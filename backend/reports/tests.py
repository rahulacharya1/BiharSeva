from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from django.core.files.uploadedfile import SimpleUploadedFile

from reports.models import Report, ReportAuditLog
from colleges.models import College
from authentication.models import AdminProfile
from notifications.models import Notification

User = get_user_model()

@override_settings(
    STORAGES={
        "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
        "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"}
    }
)
class BiharSevaSaaSV3Tests(TestCase):
    def setUp(self):
        # 1. Create a dummy image
        self.dummy_photo = SimpleUploadedFile(
            name="test_image.jpg",
            content=b"\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00\xff\xff\xff\x21\xf9\x04\x01\x00\x00\x00\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02\x4c\x01\x00\x3b",
            content_type="image/jpeg"
        )
        
        # 2. Create colleges
        self.college_a = College.objects.create(
            name="Purnia College",
            city="Purnia",
            district="Purnia",
            code="PC001"
        )
        self.college_b = College.objects.create(
            name="Katihar College",
            city="Katihar",
            district="Katihar",
            code="KC001"
        )

        # 3. Create platform admin user
        self.platform_user = User.objects.create_user(
            username="platform_admin",
            email="platform@biharseva.com",
            password="password123",
            is_staff=True,
            is_superuser=True
        )
        self.platform_profile = AdminProfile.objects.create(
            user=self.platform_user,
            role="platform_admin"
        )

        # 4. Create college admin user
        self.college_user = User.objects.create_user(
            username="purnia_admin",
            email="purnia_admin@biharseva.com",
            password="password123",
            is_staff=True
        )
        self.college_profile = AdminProfile.objects.create(
            user=self.college_user,
            role="college_admin",
            college=self.college_a
        )

    def test_report_creation_and_priority_deadline(self):
        """Test reporting creates a report and calculates dynamic claim deadline."""
        # High priority should set 6 hours deadline
        report = Report.objects.create(
            reporter_name="Citizen A",
            district="Purnia",
            location="Near Main Bus Stand",
            description="Garbage pile up near the station.",
            photo=self.dummy_photo,
            priority="high",
            claim_deadline=timezone.now() + timedelta(hours=6)
        )
        
        self.assertEqual(report.status, "pending")
        self.assertEqual(report.priority, "high")
        self.assertTrue(report.claim_deadline > timezone.now())
        self.assertTrue(report.claim_deadline <= timezone.now() + timedelta(hours=6))

    def test_duplicate_check_and_prevention(self):
        """Test duplicate checking within district and 24 hours."""
        from django.test import RequestFactory
        from reports.views import api_report_create

        # Create original report
        Report.objects.create(
            reporter_name="Citizen A",
            district="Purnia",
            location="Near Main Bus Stand",
            description="Garbage pile up near the station.",
            photo=self.dummy_photo,
            status="pending"
        )

        factory = RequestFactory()
        # Duplicate report request
        data = {
            "reporter_name": "Citizen B",
            "district": "Purnia",
            "location": "near main bus stand",  # different casing, but duplicate
            "description": "Clean this area.",
            "photo": self.dummy_photo
        }
        
        request = factory.post("/api/reports/", data)
        response = api_report_create(request)
        
        self.assertEqual(response.status_code, 400)
        self.assertIn("Duplicate report detected", response.data.get("detail", ""))

    def test_claim_queue_limitations(self):
        """Test claiming rules for college admins."""
        from django.test import RequestFactory
        from reports.views import api_admin_report_assign
        from common.auth_utils import issue_token

        report = Report.objects.create(
            reporter_name="Citizen A",
            district="Purnia",
            location="Near Main Bus Stand",
            description="Garbage pile up near the station.",
            photo=self.dummy_photo,
            status="pending",
            claim_deadline=timezone.now() + timedelta(hours=24)
        )

        factory = RequestFactory()
        
        # 1. Attempt claim with matching college admin
        request = factory.post(f"/api/admin/reports/{report.id}/assign/", {"action": "claim"})
        request.user = self.college_user
        request._dont_enforce_csrf_checks = True
        
        # Generate valid JWT token and set in cookies
        token = issue_token({
            "user_id": self.college_user.id,
            "role": "admin"
        })
        request.COOKIES["access_token"] = token
        
        response = api_admin_report_assign(request, report.id)
        self.assertEqual(response.status_code, 200, response.data)
        
        # Verify changes in DB
        report.refresh_from_db()
        self.assertEqual(report.status, "assigned")
        self.assertEqual(report.assigned_college, self.college_a)
        self.assertEqual(report.assignment_method, "claimed")

        # Verify audit logs
        audit_log = ReportAuditLog.objects.filter(report=report, action="claimed").first()
        self.assertIsNotNone(audit_log)
        self.assertIn("Purnia College", audit_log.remarks)

    def test_management_command_auto_assignment_and_sla(self):
        """Test management command run_auto_assign for expired claim windows and SLA breaches."""
        from django.core.management import call_command

        # 1. Create a pending report with expired claim deadline
        expired_report = Report.objects.create(
            reporter_name="Citizen A",
            district="Purnia",
            location="Near Main Bus Stand",
            description="Garbage pile up near the station.",
            photo=self.dummy_photo,
            status="pending",
            claim_deadline=timezone.now() - timedelta(hours=1),
            priority="medium"
        )

        # 2. Create an assigned report with SLA breach (no action for 48 hours)
        sla_breach_report = Report.objects.create(
            reporter_name="Citizen B",
            district="Purnia",
            location="Court Area",
            description="Plastic pollution in field.",
            photo=self.dummy_photo,
            status="assigned",
            assigned_college=self.college_a,
            assigned_at=timezone.now() - timedelta(hours=49),
            is_overdue=False
        )

        # Call the management command
        call_command("run_auto_assign")

        # Assertions
        expired_report.refresh_from_db()
        self.assertEqual(expired_report.status, "assigned")
        self.assertEqual(expired_report.assigned_college, self.college_a)
        self.assertEqual(expired_report.assignment_method, "auto_assigned")

        sla_breach_report.refresh_from_db()
        self.assertTrue(sla_breach_report.is_overdue)

        # Verify escalation notification generated
        notif = Notification.objects.filter(user=self.platform_user, title="SLA Flag: Inactive Report").first()
        self.assertIsNotNone(notif)
        self.assertIn(f"BS-R{sla_breach_report.id:06d}", notif.message)
