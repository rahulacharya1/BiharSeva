import csv
import threading
from django.conf import settings
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from django.db.models import Q

from rest_framework.decorators import api_view
from rest_framework.response import Response

from reports.models import Report
from colleges.models import College
from reports.serializers import ReportSerializer, AdminReportStatusSerializer, AdminReportManageSerializer
from reports.filters import ReportFilter
from common.views.helpers import (
    require_staff_api,
    is_platform_admin,
    log_admin_action,
    send_new_report_alert_email,
)


from datetime import timedelta
from reports.models import ReportAuditLog
from authentication.models import AdminProfile
from notifications.models import Notification

def dispatch_report_notifications_thread(report, priority, hours):
    # 1. Notify Platform Admin
    recipient_email = getattr(settings, "CONTACT_RECIPIENT_EMAIL", settings.DEFAULT_FROM_EMAIL)
    try:
        send_new_report_alert_email(recipient_email, report)
    except Exception:
        pass

    # 2. Query and notify all College Admins in same district
    district_admins = AdminProfile.objects.filter(role="college_admin", college__district=report.district)
    from django.core.mail import send_mail
    
    subject = f"BiharSeva - New Local Report in {report.district}"
    for admin in district_admins:
        # Create In-App Notification
        try:
            Notification.objects.create(
                user=admin.user,
                title="New Local Report Filed",
                message=f"A new {priority} priority report was filed in {report.district} at {report.location}.",
                notification_type="general",
                link=f"/college/reports?id={report.id}"
            )
        except Exception:
            pass
        
        # Send Email Notification
        if admin.user.email:
            try:
                body = f"""Hello {admin.user.username},

A new civic report has been submitted in your district ({report.district}).

Reporter: {report.reporter_name}
Location: {report.location}
Priority: {priority.upper()}
Claim Deadline: {report.claim_deadline}

Please log in and claim the report within {hours} hours.

Regards,
BiharSeva Platform
"""
                send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, [admin.user.email], fail_silently=True)
            except Exception:
                pass


# ─── PUBLIC REPORT VIEWS ────────────────────────────────────────────

@api_view(["POST"])
def api_report_create(request):
    priority = request.data.get("priority", "medium").lower()
    if priority == "emergency":
        return Response({"detail": "Emergency priority is restricted to administrators only."}, status=400)
    if priority not in ("low", "medium", "high"):
        priority = "medium"

    # Duplicate detection check
    district = request.data.get("district")
    location = request.data.get("location", "")
    if district and location:
        recent_reports = Report.objects.filter(
            district=district,
            created_at__gte=timezone.now() - timedelta(hours=24)
        )
        new_loc_clean = "".join(c for c in location.lower() if c.isalnum())
        for r in recent_reports:
            existing_loc_clean = "".join(c for c in r.location.lower() if c.isalnum())
            if new_loc_clean == existing_loc_clean or (len(new_loc_clean) > 5 and new_loc_clean in existing_loc_clean) or (len(existing_loc_clean) > 5 and existing_loc_clean in new_loc_clean):
                return Response({
                    "detail": "Duplicate report detected.",
                    "existing_report_id": r.id,
                    "tracking_number": f"BS-R{r.id:06d}"
                }, status=400)

    serializer = ReportSerializer(data=request.data)
    if serializer.is_valid():
        hours = 24
        if priority == "low":
            hours = 48
        elif priority == "high":
            hours = 6

        claim_deadline = timezone.now() + timedelta(hours=hours)
        report = serializer.save(
            priority=priority,
            claim_deadline=claim_deadline,
            status="pending"
        )
        tracking = f"BS-R{report.id:06d}"

        # Create audit trail entry
        ReportAuditLog.objects.create(
            report=report,
            action="submitted",
            remarks=f"Citizen submitted report with priority: {priority.upper()}. Claim window: {hours} hours."
        )

        # Dispatch emails and notifications in a background thread to keep it instant
        threading.Thread(
            target=dispatch_report_notifications_thread,
            args=(report, priority, hours),
            daemon=True
        ).start()

        return Response({
            "message": "Issue reported successfully!",
            "tracking_number": tracking,
            "report": serializer.data,
        }, status=201)
    return Response(serializer.errors, status=400)


@api_view(["GET"])
def api_report_status(request):
    """Public endpoint: check report status by tracking number (BS-R000001) or report ID."""
    tracking = (request.query_params.get("tracking") or "").strip().upper()
    if not tracking:
        return Response({"detail": "tracking query parameter is required."}, status=400)

    report_id = None
    if tracking.startswith("BS-R"):
        try:
            report_id = int(tracking[4:])
        except ValueError:
            pass

    if report_id is None:
        return Response({"detail": "Invalid tracking number format. Expected BS-RXXXXXX."}, status=400)

    report = Report.objects.filter(id=report_id).first()
    if not report:
        return Response({"detail": "No report found with this tracking number."}, status=404)

    return Response({
        "tracking_number": tracking,
        "status": report.status,
        "district": report.district,
        "location": report.location,
        "created_at": report.created_at,
    })


@api_view(["GET"])
def api_report_gallery(request):
    """Report gallery with search and filter support."""
    reports = Report.objects.filter(status__in=["verified", "in_progress", "cleaned"])

    filter_set = ReportFilter(request.GET, queryset=reports)
    if filter_set.is_valid():
        reports = filter_set.qs

    search = request.query_params.get("search")
    if search:
        reports = reports.filter(
            Q(location__icontains=search)
            | Q(description__icontains=search)
            | Q(reporter_name__icontains=search)
        )

    reports = reports.order_by("-created_at")
    return Response(ReportSerializer(reports, many=True, context={"request": request}).data)


# ─── ADMIN REPORT VIEWS ─────────────────────────────────────────────

@api_view(["GET", "PATCH", "DELETE"])
def api_admin_reports(request, report_id=None):
    admin_user = require_staff_api(request)
    if isinstance(admin_user, Response):
        return admin_user

    if request.method == "GET":
        reports = Report.objects.all().order_by("-created_at")
        filter_set = ReportFilter(request.GET, queryset=reports)
        if filter_set.is_valid():
            reports = filter_set.qs
        return Response(ReportSerializer(reports, many=True, context={"request": request}).data)

    report = get_object_or_404(Report, id=report_id)

    if request.method == "DELETE":
        report.delete()
        log_admin_action(request, admin_user, "report.delete", "Report", report_id, f"Deleted report at {report.location}")
        return Response({"message": "Report deleted successfully."})

    if len(request.data.keys()) == 1 and "status" in request.data:
        serializer = AdminReportStatusSerializer(data=request.data)
        if serializer.is_valid():
            report.status = serializer.validated_data["status"]
            report.save(update_fields=["status"])
            log_admin_action(request, admin_user, "report.update_status", "Report", report.id, f"Updated report status to: {report.status}")
            return Response({"message": f"Report status updated to {report.status}."})
        return Response(serializer.errors, status=400)

    serializer = AdminReportManageSerializer(report, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        log_admin_action(request, admin_user, "report.update", "Report", report.id, "Updated report details")
        return Response({"message": "Report updated successfully."})
    return Response(serializer.errors, status=400)


from datetime import date
from django.db.models import Count

def auto_assign_report_to_least_busy_college(report, manual_by_user=None):
    from colleges.models import College
    from events.models import Event
    from authentication.models import Volunteer
    
    colleges = College.objects.filter(district=report.district)
    if not colleges.exists():
        return None
    
    best_college = None
    best_score = float('inf')
    
    for college in colleges:
        active_reports = Report.objects.filter(
            assigned_college=college,
            status__in=['assigned', 'in_progress']
        ).count()
        
        ongoing_events = Event.objects.filter(
            nss_unit__college=college,
            date__gte=date.today()
        ).count()
        
        verified_volunteers = Volunteer.objects.filter(
            college=college,
            is_verified=True
        ).count()
        
        # Scoring: (Active Reports * 10) + (Ongoing Events * 3) - (Verified Volunteers * 0.5)
        score = (active_reports * 10.0) + (ongoing_events * 3.0) - (verified_volunteers * 0.5)
        if score < best_score:
            best_score = score
            best_college = college
            
    if best_college:
        report.assigned_college = best_college
        report.assigned_at = timezone.now()
        report.status = "assigned"
        report.assignment_method = "auto_assigned"
        
        remarks = f"Auto-assigned to college {best_college.name} based on workload score {best_score}."
        if manual_by_user:
            remarks = f"Manual override trigger: {remarks}"
            report.assignment_method = "manual"
            
        report.save()
        
        ReportAuditLog.objects.create(
            report=report,
            user=manual_by_user,
            action="auto_assigned",
            remarks=remarks
        )
        
        college_admins = AdminProfile.objects.filter(role="college_admin", college=best_college)
        for admin in college_admins:
            try:
                Notification.objects.create(
                    user=admin.user,
                    title="New Report Auto-Assigned",
                    message=f"Report BS-R{report.id:06d} has been auto-assigned to your college ({best_college.name}) for cleanup.",
                    notification_type="general",
                    link=f"/college/reports?id={report.id}"
                )
                if admin.user.email:
                    from django.core.mail import send_mail
                    body = f"""Hello {admin.user.username},

A civic report has been auto-assigned to your college ({best_college.name}) for cleanup.

Reporter: {report.reporter_name}
Location: {report.location}
Priority: {report.priority.upper()}

Please organize an NSS event to handle this cleanup.

Regards,
BiharSeva Platform
"""
                    send_mail(
                        "BiharSeva - Report Auto-Assigned",
                        body,
                        settings.DEFAULT_FROM_EMAIL,
                        [admin.user.email],
                        fail_silently=True
                    )
            except Exception:
                pass
        return best_college
    return None


@api_view(["POST"])
def api_admin_report_assign(request, report_id):
    """Assign reports to a college/admin or allow college admins to claim a report."""
    admin_user = require_staff_api(request)
    if isinstance(admin_user, Response):
        return admin_user

    report = get_object_or_404(Report, id=report_id)
    action = (request.data.get("action") or "").strip().lower()

    if report.is_locked and action != "unlock":
        return Response({"detail": "This report is locked and cannot be modified."}, status=400)

    # 1. CLAIM ACTION
    if action == "claim":
        admin_role = getattr(admin_user, "admin_role", None)
        if admin_role not in ("college_admin", "platform_admin"):
            return Response({"detail": "Only college or platform admins may claim reports."}, status=403)

        if report.status != "pending":
            return Response({"detail": "This report is already assigned or resolved."}, status=400)

        if report.claim_deadline and timezone.now() > report.claim_deadline:
            return Response({"detail": "The claim window for this report has expired."}, status=400)

        college = getattr(admin_user, "admin_college", None)
        if admin_role == "college_admin":
            if not college:
                return Response({"detail": "Your admin profile is not assigned to a college."}, status=403)
            if report.district != college.district:
                return Response({"detail": "This report does not belong to your college district."}, status=403)

        report.assigned_college = college
        report.assigned_admin = admin_user
        report.assigned_at = timezone.now()
        report.claimed_at = timezone.now()
        report.status = "assigned"
        report.assignment_method = "claimed"
        report.save()

        ReportAuditLog.objects.create(
            report=report,
            user=admin_user,
            action="claimed",
            remarks=f"Claimed by {admin_user.username} for college {college.name if college else 'System'}."
        )
        return Response(ReportSerializer(report, context={"request": request}).data)

    # 2. AUTO ASSIGN ACTION
    if action == "auto_assign":
        if not is_platform_admin(admin_user):
            return Response({"detail": "Only platform admin may auto-assign reports."}, status=403)
        college = auto_assign_report_to_least_busy_college(report, manual_by_user=admin_user)
        if college:
            return Response(ReportSerializer(report, context={"request": request}).data)
        return Response({"detail": "No matching college found for district."}, status=404)

    # 3. REASSIGN ACTION
    if action == "reassign":
        if not is_platform_admin(admin_user):
            return Response({"detail": "Only platform admin may reassign reports."}, status=403)
        assigned_college_id = request.data.get("assigned_college")
        if not assigned_college_id:
            return Response({"detail": "assigned_college parameter is required for reassignment."}, status=400)
        college = College.objects.filter(id=assigned_college_id).first()
        if not college:
            return Response({"detail": "Selected college does not exist."}, status=404)
        
        report.assigned_college = college
        report.assigned_at = timezone.now()
        report.status = "assigned"
        report.assignment_method = "manual"
        report.save()

        ReportAuditLog.objects.create(
            report=report,
            user=admin_user,
            action="reassigned",
            remarks=f"Reassigned to college {college.name} manually by Platform Admin."
        )
        return Response(ReportSerializer(report, context={"request": request}).data)

    # 4. CANCEL ACTION
    if action == "cancel":
        if not is_platform_admin(admin_user):
            return Response({"detail": "Only platform admin may cancel assignments."}, status=403)
        
        old_college = report.assigned_college
        report.assigned_college = None
        report.assigned_admin = None
        report.assigned_at = None
        report.claimed_at = None
        report.status = "pending"
        report.assignment_method = None
        # Reset claim deadline with 12 additional hours
        report.claim_deadline = timezone.now() + timedelta(hours=12)
        report.save()

        ReportAuditLog.objects.create(
            report=report,
            user=admin_user,
            action="cancelled",
            remarks=f"Assignment to {old_college.name if old_college else 'None'} cancelled. Claim window extended by 12 hours."
        )
        return Response(ReportSerializer(report, context={"request": request}).data)

    # 5. EXTEND DEADLINE ACTION
    if action == "extend_deadline":
        if not is_platform_admin(admin_user):
            return Response({"detail": "Only platform admin may extend deadlines."}, status=403)
        hours = int(request.data.get("hours", 12))
        if not report.claim_deadline:
            report.claim_deadline = timezone.now()
        report.claim_deadline = report.claim_deadline + timedelta(hours=hours)
        report.save()

        ReportAuditLog.objects.create(
            report=report,
            user=admin_user,
            action="extended_deadline",
            remarks=f"Claim deadline extended by {hours} hours by Platform Admin."
        )
        return Response(ReportSerializer(report, context={"request": request}).data)

    # 6. UPGRADE PRIORITY ACTION
    if action == "upgrade_priority":
        priority = (request.data.get("priority") or "").strip().lower()
        if priority not in ("low", "medium", "high", "emergency"):
            return Response({"detail": "Invalid priority level."}, status=400)
        
        report.priority = priority
        report.save()

        ReportAuditLog.objects.create(
            report=report,
            user=admin_user,
            action="priority_updated",
            remarks=f"Priority upgraded to {priority.upper()} by {admin_user.username}."
        )

        if priority == "emergency":
            auto_assign_report_to_least_busy_college(report, manual_by_user=admin_user)
            
        return Response(ReportSerializer(report, context={"request": request}).data)

    # 7. LOCK / UNLOCK ACTIONS
    if action == "lock":
        if not is_platform_admin(admin_user):
            return Response({"detail": "Only platform admin may lock reports."}, status=403)
        report.is_locked = True
        report.save()
        ReportAuditLog.objects.create(
            report=report,
            user=admin_user,
            action="locked",
            remarks="Report locked by Platform Admin."
        )
        return Response(ReportSerializer(report, context={"request": request}).data)

    if action == "unlock":
        if not is_platform_admin(admin_user):
            return Response({"detail": "Only platform admin may unlock reports."}, status=403)
        report.is_locked = False
        report.save()
        ReportAuditLog.objects.create(
            report=report,
            user=admin_user,
            action="unlocked",
            remarks="Report unlocked by Platform Admin."
        )
        return Response(ReportSerializer(report, context={"request": request}).data)

    # 8. CLOSE DUPLICATE ACTION
    if action == "close_duplicate":
        if not is_platform_admin(admin_user):
            return Response({"detail": "Only platform admin may close duplicate reports."}, status=403)
        report.status = "duplicate"
        report.save()
        ReportAuditLog.objects.create(
            report=report,
            user=admin_user,
            action="duplicate",
            remarks="Report marked as duplicate and closed."
        )
        return Response(ReportSerializer(report, context={"request": request}).data)

    return Response({"detail": "No valid action provided."}, status=400)


# ─── EXPORT CSV VIEW ────────────────────────────────────────────────

@api_view(["GET"])
def api_admin_export_reports(request):
    """Export reports as CSV."""
    admin_user = require_staff_api(request)
    if isinstance(admin_user, Response):
        return admin_user

    reports = Report.objects.all().order_by("-created_at")

    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = 'attachment; filename="biharseva_reports.csv"'

    writer = csv.writer(response)
    writer.writerow(["ID", "Tracking", "Reporter", "District", "Location", "Status", "Created"])

    for r in reports:
        writer.writerow([
            r.id,
            f"BS-R{r.id:06d}",
            r.reporter_name,
            r.district,
            r.location,
            r.status,
            r.created_at.strftime("%Y-%m-%d %H:%M"),
        ])

    return response


@api_view(["GET"])
def api_admin_report_audit_logs(request, report_id):
    """Retrieve audit trail logs for a specific report."""
    admin_user = require_staff_api(request)
    if isinstance(admin_user, Response):
        return admin_user

    report = get_object_or_404(Report, id=report_id)
    logs = report.audit_logs.all().order_by("timestamp")
    
    data = []
    for l in logs:
        data.append({
            "id": l.id,
            "timestamp": l.timestamp.isoformat(),
            "username": l.user.username if l.user else "Citizen",
            "action": l.action,
            "remarks": l.remarks
        })
    return Response(data)
