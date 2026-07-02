import logging
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from django.conf import settings
from reports.models import Report, ReportAuditLog
from reports.views import auto_assign_report_to_least_busy_college
from notifications.models import Notification
from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = "Process unclaimed reports, execute load-balanced auto-assignment, and check SLA escalations."

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Starting SLA & auto-assignment checks..."))
        now = timezone.now()
        User = get_user_model()

        # 1. PROCESS EXPIRED PENDING REPORTS
        expired_reports = Report.objects.filter(
            status="pending",
            claim_deadline__lte=now
        ).exclude(priority="emergency")

        self.stdout.write(self.style.NOTICE(f"Found {expired_reports.count()} expired pending reports."))
        for report in expired_reports:
            self.stdout.write(f"Processing auto-assignment for Report BS-R{report.id:06d} in district {report.district}...")
            college = auto_assign_report_to_least_busy_college(report)
            if college:
                self.stdout.write(self.style.SUCCESS(f"Successfully auto-assigned Report BS-R{report.id:06d} to college: {college.name}"))
            else:
                self.stdout.write(self.style.WARNING(f"Failed to auto-assign Report BS-R{report.id:06d}: No colleges found in district {report.district}."))

        # 2. SLA ESCALATION: ASSIGNED BUT INACTIVE (48 hours)
        inactive_limit = now - timedelta(hours=48)
        inactive_reports = Report.objects.filter(
            status="assigned",
            assigned_at__lte=inactive_limit,
            is_overdue=False
        )
        self.stdout.write(self.style.NOTICE(f"Found {inactive_reports.count()} inactive assigned reports."))
        for report in inactive_reports:
            report.is_overdue = True
            report.save(update_fields=["is_overdue"])
            
            # Log audit trail
            ReportAuditLog.objects.create(
                report=report,
                action="sla_violation",
                remarks="Report flagged as OVERDUE: Assigned to college but remained inactive (no status update or progress) for over 48 hours."
            )

            # Notify Platform Admins
            platform_admins = User.objects.filter(is_superuser=True)
            for admin in platform_admins:
                Notification.objects.create(
                    user=admin,
                    title="SLA Flag: Inactive Report",
                    message=f"Report BS-R{report.id:06d} in {report.district} has been assigned for over 48 hours without updates.",
                    notification_type="general",
                    link=f"/admin/panel"
                )

        # 3. SLA ESCALATION: IN PROGRESS BUT NO UPDATE FOR 7 DAYS
        slow_limit = now - timedelta(days=7)
        slow_reports = Report.objects.filter(
            status="in_progress",
            updated_at__lte=slow_limit,
            is_overdue=False
        )
        self.stdout.write(self.style.NOTICE(f"Found {slow_reports.count()} slow in-progress reports."))
        for report in slow_reports:
            report.is_overdue = True
            report.save(update_fields=["is_overdue"])

            # Log audit trail
            ReportAuditLog.objects.create(
                report=report,
                action="sla_violation",
                remarks="Report flagged as OVERDUE: Cleanup is in progress but no updates or photos have been provided in the last 7 days."
            )

            # Notify Platform Admins
            platform_admins = User.objects.filter(is_superuser=True)
            for admin in platform_admins:
                Notification.objects.create(
                    user=admin,
                    title="SLA Flag: Slow Progress",
                    message=f"Report BS-R{report.id:06d} cleanup is in progress but has not received updates for 7 days.",
                    notification_type="general",
                    link=f"/admin/panel"
                )

        self.stdout.write(self.style.SUCCESS("SLA & auto-assignment runner completed successfully."))
