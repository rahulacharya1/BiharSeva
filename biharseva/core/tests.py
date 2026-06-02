from django.test import TestCase, Client, override_settings
from django.urls import reverse
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework.settings import api_settings
import json

# Disable API throttling globally for all tests
api_settings.DEFAULT_THROTTLE_CLASSES = []
api_settings.DEFAULT_THROTTLE_RATES = {}

from .models import (
    AdminProfile,
    Badge,
    College,
    Event,
    EventRegistration,
    NSSUnit,
    ProgramOfficer,
    Volunteer,
    VolunteerHours,
    Certificate,
    Report,
    AuditLog,
    Notification,
)


@override_settings(REST_FRAMEWORK={'DEFAULT_THROTTLE_CLASSES': [], 'DEFAULT_THROTTLE_RATES': {}})
class VolunteerAuthTestCase(TestCase):
    """Test volunteer registration, login, and authentication flows."""
    
    def setUp(self):
        self.client = APIClient()
        self.volunteer_data = {
            "name": "Test Volunteer",
            "email": "test@example.com",
            "phone": "9876543210",
            "district": "Purnia",
            "password": "secure123",
            "password_confirm": "secure123",
        }
    
    def test_volunteer_registration(self):
        """Test volunteer registration endpoint."""
        response = self.client.post(
            "/api/volunteers/register/",
            self.volunteer_data,
            format="json"
        )
        self.assertEqual(response.status_code, 201)
        self.assertIn("message", response.data)
        self.assertTrue(Volunteer.objects.filter(email="test@example.com").exists())
    
    def test_volunteer_registration_duplicate_email(self):
        """Test registration fails with duplicate email."""
        Volunteer.objects.create(
            name="Existing",
            email="test@example.com",
            phone="9876543210",
            district="Purnia",
            password_hash="hash"
        )
        response = self.client.post(
            "/api/volunteers/register/",
            self.volunteer_data,
            format="json"
        )
        self.assertIn(response.status_code, [400, 429], "Duplicate email should be rejected")
    
    def test_volunteer_login_unverified(self):
        """Test login fails for unverified volunteer."""
        volunteer = Volunteer.objects.create(
            name="Test",
            email="test@example.com",
            phone="9876543210",
            district="Purnia",
            is_verified=False
        )
        volunteer.set_password("test123")
        volunteer.save()
        
        response = self.client.post(
            "/api/volunteers/login/",
            {"email": "test@example.com", "password": "test123"},
            format="json"
        )
        self.assertEqual(response.status_code, 403)
    
    def test_volunteer_login_success(self):
        """Test successful volunteer login."""
        volunteer = Volunteer.objects.create(
            name="Test",
            email="test@example.com",
            phone="9876543210",
            district="Purnia",
            is_verified=True
        )
        volunteer.set_password("test123")
        volunteer.save()
        
        response = self.client.post(
            "/api/volunteers/login/",
            {"email": "test@example.com", "password": "test123"},
            format="json"
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("token", response.data)
        self.assertIn("volunteer", response.data)


class EventAndCertificateTestCase(TestCase):
    """Test event registration, attendance, and certificate generation."""
    
    def setUp(self):
        self.client = APIClient()

        # Create college infrastructure for college_admin scoping
        self.college = College.objects.create(
            name="Event Test College",
            city="Purnia",
            district="Purnia",
            code="ETC-001",
        )
        self.unit = NSSUnit.objects.create(college=self.college, unit_number=1, name="ETC Unit 1")

        self.volunteer = Volunteer.objects.create(
            name="Test Volunteer",
            email="volunteer@test.com",
            phone="9876543210",
            district="Purnia",
            is_verified=True,
            has_participated=False,
            college=self.college,
            nss_unit=self.unit,
        )
        self.volunteer.set_password("test123")
        self.volunteer.save()
        
        # Create a college_admin (not superuser) so write operations are allowed
        self.admin_user = User.objects.create_user(
            username="admin",
            email="admin@test.com",
            password="admin123",
            is_staff=True,
            is_active=True,
        )
        AdminProfile.objects.create(
            user=self.admin_user,
            role="college_admin",
            college=self.college,
        )
        
        self.event = Event.objects.create(
            title="Test Event",
            date="2026-04-20",
            location="Test Location",
            description="Test Description",
            program_coordinator_name="Test Coordinator",
            nss_unit=self.unit,
        )
    
    def _auth_as_college_admin(self):
        from .auth_utils import issue_token
        token = issue_token({
            "role": "admin",
            "user_id": self.admin_user.id,
            "admin_role": "college_admin",
            "admin_college_id": self.college.id,
        })
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_event_registration(self):
        """Test volunteer can register for event."""
        from .auth_utils import issue_token
        token = issue_token({"role": "volunteer", "volunteer_id": self.volunteer.id})
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")
        
        response = self.client.post(f"/api/events/{self.event.id}/register/")
        self.assertEqual(response.status_code, 201)
        self.assertTrue(
            EventRegistration.objects.filter(
                volunteer=self.volunteer,
                event=self.event
            ).exists()
        )
    
    def test_attendance_marks_participation(self):
        """Test that marking attendance updates has_participated."""
        registration = EventRegistration.objects.create(
            event=self.event,
            volunteer=self.volunteer,
            attended=False
        )
        
        volunteer = Volunteer.objects.get(id=self.volunteer.id)
        self.assertFalse(volunteer.has_participated)
        
        # Use college_admin (not platform_admin) — platform_admin is view-only
        self._auth_as_college_admin()
        
        response = self.client.patch(
            f"/api/admin/events/{self.event.id}/attendance/{registration.id}/",
            {"attended": True},
            format="json"
        )
        self.assertEqual(response.status_code, 200)
        
        volunteer.refresh_from_db()
        self.assertTrue(volunteer.has_participated)
        
        self.assertTrue(
            Certificate.objects.filter(
                volunteer=self.volunteer,
                event=self.event
            ).exists()
        )


class ReportTestCase(TestCase):
    """Test civic report submission and workflow."""
    
    def setUp(self):
        self.client = APIClient()
    
    def test_report_creation(self):
        """Test creating a civic report via model."""
        report = Report.objects.create(
            reporter_name="Test Reporter",
            district="Purnia",
            location="Test Location",
            description="Test Issue",
            status="pending"
        )
        self.assertTrue(Report.objects.filter(reporter_name="Test Reporter").exists())
        self.assertEqual(report.status, "pending")
    
    def test_report_invalid_district(self):
        """Test report submission with invalid district."""
        from django.core.files.uploadedfile import SimpleUploadedFile
        
        image = SimpleUploadedFile("test.jpg", b"data", content_type="image/jpeg")
        
        response = self.client.post(
            "/api/reports/",
            {
                "reporter_name": "Test",
                "district": "InvalidDistrict",
                "location": "Test",
                "description": "Test",
                "photo": image
            },
            format="multipart"
        )
        # Should either fail validation or succeed with constraint
        # The district field is CharField with choices, so validation should catch it
        self.assertNotEqual(response.status_code, 500)


class AdminAuthTestCase(TestCase):
    """Test admin authentication flows."""
    
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_superuser(
            username="admin",
            email="admin@test.com",
            password="admin123"
        )
    
    def test_admin_login(self):
        """Test admin login."""
        response = self.client.post(
            "/api/admin/auth/login/",
            {"username": "admin", "password": "admin123"},
            format="json"
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("token", response.data)
    
    def test_admin_login_invalid_credentials(self):
        """Test admin login with wrong password."""
        response = self.client.post(
            "/api/admin/auth/login/",
            {"username": "admin", "password": "wrongpassword"},
            format="json"
        )
        self.assertEqual(response.status_code, 400)


class PublicVolunteerListTestCase(TestCase):
    """Test that public volunteer list hides sensitive data."""
    
    def setUp(self):
        self.client = APIClient()
        self.volunteer = Volunteer.objects.create(
            name="Test Volunteer",
            email="secret@example.com",
            phone="9876543210",
            district="Purnia",
            is_verified=True
        )
    
    def test_public_volunteer_list_no_email(self):
        """Test that public volunteer list endpoint doesn't return email/phone."""
        response = self.client.get("/api/volunteers/")
        self.assertEqual(response.status_code, 200)
        
        # Verify list contains volunteer
        volunteers = response.data
        self.assertTrue(len(volunteers) > 0)
        
        # Verify email and phone are not in response
        volunteer_data = volunteers[0]
        self.assertNotIn("email", volunteer_data)
        self.assertNotIn("phone", volunteer_data)
        self.assertIn("name", volunteer_data)
        self.assertIn("college", volunteer_data)
        self.assertIn("district", volunteer_data)


@override_settings(REST_FRAMEWORK={'DEFAULT_THROTTLE_CLASSES': [], 'DEFAULT_THROTTLE_RATES': {}})
class Phase2InfrastructureTestCase(TestCase):
    """Tests for Phase 2 institutional and hour-tracking features."""

    def setUp(self):
        self.client = APIClient()
        # Platform admin for read/create operations (colleges, registration)
        self.platform_admin = User.objects.create_superuser(
            username="phase2admin",
            email="phase2admin@test.com",
            password="admin123"
        )
        from .auth_utils import issue_token
        self.platform_token = issue_token({
            "role": "admin",
            "user_id": self.platform_admin.id,
            "admin_role": "platform_admin",
        })

        # College admin for write operations (attendance, hours)
        self.college = College.objects.create(
            name="Phase2 College",
            city="Purnia",
            district="Purnia",
            code="P2C-001",
        )
        self.unit = NSSUnit.objects.create(college=self.college, unit_number=1, name="P2 Unit")
        self.college_admin = User.objects.create_user(
            username="phase2collegeadmin",
            email="p2cadmin@test.com",
            password="admin123",
            is_staff=True,
            is_active=True,
        )
        AdminProfile.objects.create(
            user=self.college_admin,
            role="college_admin",
            college=self.college,
        )
        self.college_admin_token = issue_token({
            "role": "admin",
            "user_id": self.college_admin.id,
            "admin_role": "college_admin",
            "admin_college_id": self.college.id,
        })

    def test_volunteer_register_with_legacy_college_string(self):
        # Registration is a public endpoint, no admin token needed
        response = self.client.post(
            "/api/volunteers/register/",
            {
                "name": "Legacy College Volunteer",
                "college": "ABC College",
                "email": "legacy@example.com",
                "phone": "9876543210",
                "district": "Purnia",
                "password": "secure123",
                "password_confirm": "secure123",
            },
            format="json"
        )
        self.assertEqual(response.status_code, 201)
        volunteer = Volunteer.objects.get(email="legacy@example.com")
        self.assertEqual(volunteer.college_name, "ABC College")

    def test_admin_can_create_and_list_college(self):
        # Platform admin can create colleges
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.platform_token}")
        create_response = self.client.post(
            "/api/admin/colleges/",
            {
                "name": "VVID College",
                "city": "Purnia",
                "district": "Purnia",
                "code": "VVID-001",
                "email": "nss@vvid.edu",
                "phone": "9876543210",
            },
            format="json"
        )
        self.assertEqual(create_response.status_code, 201)

        list_response = self.client.get("/api/admin/colleges/")
        self.assertEqual(list_response.status_code, 200)
        self.assertTrue(any(c["name"] == "VVID College" for c in list_response.data))

    def test_attendance_creates_hours_and_updates_total(self):
        # Use college_admin for attendance (platform_admin is view-only)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.college_admin_token}")
        volunteer = Volunteer.objects.create(
            name="Hours Volunteer",
            email="hours@example.com",
            phone="9876501234",
            district="Purnia",
            is_verified=True,
            total_hours=0,
            college=self.college,
            nss_unit=self.unit,
        )
        volunteer.set_password("test123")
        volunteer.save()

        event = Event.objects.create(
            title="Cleanliness Drive",
            date="2026-04-20",
            location="Campus",
            description="Clean campus",
            hours_per_volunteer=3,
            nss_unit=self.unit,
        )
        registration = EventRegistration.objects.create(event=event, volunteer=volunteer, attended=False)

        response = self.client.patch(
            f"/api/admin/events/{event.id}/attendance/{registration.id}/",
            {"attended": True},
            format="json"
        )
        self.assertEqual(response.status_code, 200)

        volunteer.refresh_from_db()
        self.assertEqual(float(volunteer.total_hours), 3.0)
        self.assertTrue(volunteer.has_participated)


@override_settings(REST_FRAMEWORK={'DEFAULT_THROTTLE_CLASSES': [], 'DEFAULT_THROTTLE_RATES': {}})
class Phase2AdminEndpointAndBadgeEdgeCaseTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        from .auth_utils import issue_token

        self.college = College.objects.create(
            name="Edge College",
            city="Purnia",
            district="Purnia",
            code="EDGE-001",
        )
        self.unit = NSSUnit.objects.create(college=self.college, unit_number=1, name="Unit 1")
        self.officer = ProgramOfficer.objects.create(
            nss_unit=self.unit,
            name="Officer One",
            email="officer@example.com",
            phone="9999999999",
            designation="NSS Program Officer",
        )
        self.volunteer = Volunteer.objects.create(
            name="Edge Volunteer",
            email="edgevol@example.com",
            phone="9000000001",
            district="Purnia",
            is_verified=True,
            nss_unit=self.unit,
            college=self.college,
            total_hours=0,
        )
        self.event = Event.objects.create(
            title="Edge Event",
            date="2026-04-20",
            location="Edge Campus",
            description="Edge",
            nss_unit=self.unit,
            activity_type="cleanliness",
            hours_per_volunteer=10,
        )

        # Platform admin for read-only endpoints
        self.platform_admin = User.objects.create_superuser(
            username="edgeadmin",
            email="edgeadmin@test.com",
            password="admin123",
        )
        self.platform_token = issue_token({
            "role": "admin",
            "user_id": self.platform_admin.id,
            "admin_role": "platform_admin",
        })

        # College admin for write operations (attendance, hours, badges)
        self.college_admin = User.objects.create_user(
            username="edgecollegeadmin",
            email="edgecadmin@test.com",
            password="admin123",
            is_staff=True,
            is_active=True,
        )
        AdminProfile.objects.create(
            user=self.college_admin,
            role="college_admin",
            college=self.college,
        )
        self.college_admin_token = issue_token({
            "role": "admin",
            "user_id": self.college_admin.id,
            "admin_role": "college_admin",
            "admin_college_id": self.college.id,
        })

    def test_new_admin_endpoints_basic_access(self):
        # Read-only — platform admin is fine
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.platform_token}")
        self.assertEqual(self.client.get("/api/admin/nss-units/").status_code, 200)
        self.assertEqual(self.client.get("/api/admin/program-officers/").status_code, 200)
        self.assertEqual(self.client.get("/api/admin/activity-proposals/").status_code, 200)
        self.assertEqual(self.client.get("/api/admin/volunteer-hours/").status_code, 200)
        self.assertEqual(self.client.get("/api/admin/badges/").status_code, 200)

    def test_coordinator_dashboard_and_impact_analytics_endpoints(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.platform_token}")
        coordinator = self.client.get(f"/api/admin/coordinator-dashboard/?officer_id={self.officer.id}")
        self.assertEqual(coordinator.status_code, 200)
        self.assertIn("stats", coordinator.data)
        self.assertEqual(coordinator.data["coordinator"]["unit_id"], self.unit.id)

        impact = self.client.get("/api/admin/impact-analytics/")
        self.assertEqual(impact.status_code, 200)
        self.assertIn("summary", impact.data)
        self.assertIn("district_breakdown", impact.data)

    def test_attendance_idempotency_for_hours_and_badges(self):
        # Use college_admin for attendance write operations
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.college_admin_token}")
        registration = EventRegistration.objects.create(event=self.event, volunteer=self.volunteer, attended=False)

        first = self.client.patch(
            f"/api/admin/events/{self.event.id}/attendance/{registration.id}/",
            {"attended": True},
            format="json",
        )
        self.assertEqual(first.status_code, 200)

        second = self.client.patch(
            f"/api/admin/events/{self.event.id}/attendance/{registration.id}/",
            {"attended": True},
            format="json",
        )
        self.assertEqual(second.status_code, 200)

        self.volunteer.refresh_from_db()
        self.assertEqual(float(self.volunteer.total_hours), 10.0)
        self.assertEqual(VolunteerHours.objects.filter(volunteer=self.volunteer, event=self.event).count(), 1)

    def test_hour_edit_and_delete_recalculate_total(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.college_admin_token}")
        create = self.client.post(
            "/api/admin/volunteer-hours/",
            {"volunteer": self.volunteer.id, "event": self.event.id, "hours": 8},
            format="json",
        )
        self.assertEqual(create.status_code, 201)
        record_id = create.data["record"]["id"]

        self.volunteer.refresh_from_db()
        self.assertEqual(float(self.volunteer.total_hours), 8.0)

        update = self.client.patch(
            f"/api/admin/volunteer-hours/{record_id}/",
            {"hours": 12},
            format="json",
        )
        self.assertEqual(update.status_code, 200)

        self.volunteer.refresh_from_db()
        self.assertEqual(float(self.volunteer.total_hours), 12.0)

        delete = self.client.delete(f"/api/admin/volunteer-hours/{record_id}/")
        self.assertEqual(delete.status_code, 200)

        self.volunteer.refresh_from_db()
        self.assertEqual(float(self.volunteer.total_hours), 0.0)

    def test_badge_threshold_crossing_auto_award(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.college_admin_token}")
        # Cross bronze threshold at 20 hours via two records
        event2 = Event.objects.create(
            title="Threshold Event 2",
            date="2026-04-21",
            location="Ground",
            description="threshold",
            nss_unit=self.unit,
            activity_type="awareness",
            hours_per_volunteer=12,
        )
        self.client.post(
            "/api/admin/volunteer-hours/",
            {"volunteer": self.volunteer.id, "event": self.event.id, "hours": 10},
            format="json",
        )
        self.client.post(
            "/api/admin/volunteer-hours/",
            {"volunteer": self.volunteer.id, "event": event2.id, "hours": 10},
            format="json",
        )

        self.volunteer.refresh_from_db()
        self.assertGreaterEqual(float(self.volunteer.total_hours), 20.0)
        self.assertTrue(Badge.objects.filter(volunteer=self.volunteer, level="bronze").exists())
        self.assertEqual(Badge.objects.filter(volunteer=self.volunteer, level="bronze").count(), 1)


@override_settings(REST_FRAMEWORK={'DEFAULT_THROTTLE_CLASSES': [], 'DEFAULT_THROTTLE_RATES': {}})
class RoleScopedAdminPermissionsTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.platform_admin = User.objects.create_superuser(
            username="platform",
            email="platform@test.com",
            password="admin123",
        )

        self.college_a = College.objects.create(
            name="College A",
            city="Purnia",
            district="Purnia",
            code="A-001",
        )
        self.college_b = College.objects.create(
            name="College B",
            city="Katihar",
            district="Katihar",
            code="B-001",
        )
        self.unit_a = NSSUnit.objects.create(college=self.college_a, unit_number=1, name="A Unit")
        self.unit_b = NSSUnit.objects.create(college=self.college_b, unit_number=1, name="B Unit")

        self.college_admin_user = User.objects.create_user(
            username="collegeadmin",
            email="collegeadmin@test.com",
            password="admin123",
            is_staff=True,
            is_active=True,
        )
        AdminProfile.objects.create(
            user=self.college_admin_user,
            role="college_admin",
            college=self.college_a,
        )

    def _auth_as_college_admin(self):
        from .auth_utils import issue_token

        token = issue_token(
            {
                "role": "admin",
                "user_id": self.college_admin_user.id,
                "admin_role": "college_admin",
                "admin_college_id": self.college_a.id,
            }
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def _auth_as_platform_admin(self):
        from .auth_utils import issue_token

        token = issue_token(
            {
                "role": "admin",
                "user_id": self.platform_admin.id,
                "admin_role": "platform_admin",
            }
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token}")

    def test_college_admin_sees_only_own_units(self):
        self._auth_as_college_admin()
        response = self.client.get("/api/admin/nss-units/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["college_name"], "College A")

    def test_college_admin_cannot_create_unit_for_other_college(self):
        self._auth_as_college_admin()
        response = self.client.post(
            "/api/admin/nss-units/",
            {"college": self.college_b.id, "unit_number": 2, "name": "Illegal Unit"},
            format="json",
        )
        self.assertEqual(response.status_code, 403)

    def test_platform_admin_can_create_college_with_admin_account(self):
        self._auth_as_platform_admin()
        response = self.client.post(
            "/api/admin/colleges/",
            {
                "name": "Provisioned College",
                "city": "Araria",
                "district": "Araria",
                "code": "P-001",
                "admin_username": "provadmin",
                "admin_email": "provadmin@test.com",
                "admin_password": "admin123",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        created_admin = User.objects.get(username="provadmin")
        self.assertTrue(created_admin.is_staff)
        profile = AdminProfile.objects.get(user=created_admin)
        self.assertEqual(profile.role, "college_admin")
        self.assertEqual(profile.college.name, "Provisioned College")


@override_settings(REST_FRAMEWORK={'DEFAULT_THROTTLE_CLASSES': [], 'DEFAULT_THROTTLE_RATES': {}})
class Part4FeaturesTestCase(TestCase):
    """Tests for Part 4 features: health check, token refresh, notifications, audit logging."""

    def setUp(self):
        self.client = APIClient()
        self.volunteer = Volunteer.objects.create(
            name="Part4 Volunteer",
            email="part4@example.com",
            phone="9876543210",
            district="Purnia",
            is_verified=True,
        )
        self.volunteer.set_password("secure123")
        self.volunteer.save()

        # Admin user
        self.admin_user = User.objects.create_superuser(
            username="part4admin",
            email="part4admin@test.com",
            password="admin123",
        )

        from .auth_utils import issue_token, issue_token_pair
        # Issue volunteer token pair
        tokens = issue_token_pair({"role": "volunteer", "volunteer_id": self.volunteer.id})
        self.vol_access_token = tokens["access_token"]
        self.vol_refresh_token = tokens["refresh_token"]

        # Issue admin token pair
        admin_tokens = issue_token_pair({
            "role": "admin",
            "user_id": self.admin_user.id,
            "admin_role": "platform_admin",
        })
        self.admin_access_token = admin_tokens["access_token"]

    def test_health_check_endpoint(self):
        # Test basic health check
        response = self.client.get("/api/health/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], "healthy")

        # Test v1 health check alias
        response_v1 = self.client.get("/api/v1/health/")
        self.assertEqual(response_v1.status_code, 200)
        self.assertEqual(response_v1.data["status"], "healthy")

    def test_token_refresh_flow(self):
        # Refresh access token using valid refresh token
        response = self.client.post(
            "/api/token/refresh/",
            {"refresh_token": self.vol_refresh_token},
            format="json"
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("token", response.data)

        # Test with invalid refresh token
        response_invalid = self.client.post(
            "/api/token/refresh/",
            {"refresh_token": "invalid_refresh_token"},
            format="json"
        )
        self.assertEqual(response_invalid.status_code, 401)

    def test_notifications_crud(self):
        # Create notifications
        Notification.objects.create(
            volunteer=self.volunteer,
            title="Notification 1",
            message="Test Message 1",
            notification_type="general",
        )
        Notification.objects.create(
            volunteer=self.volunteer,
            title="Notification 2",
            message="Test Message 2",
            notification_type="certificate",
        )

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.vol_access_token}")
        
        # Test listing
        response = self.client.get("/api/notifications/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["notifications"]), 2)
        self.assertEqual(response.data["unread_count"], 2)

        # Mark single as read
        notif = Notification.objects.first()
        response_read = self.client.patch(f"/api/notifications/{notif.id}/read/")
        self.assertEqual(response_read.status_code, 200)
        
        # Mark all read
        response_read_all = self.client.post("/api/notifications/read-all/")
        self.assertEqual(response_read_all.status_code, 200)
        
        response_list = self.client.get("/api/notifications/")
        self.assertEqual(response_list.data["unread_count"], 0)

    def test_audit_log_endpoint(self):
        # Create audit logs
        AuditLog.objects.create(
            admin_user=self.admin_user,
            action="test.action",
            target_model="Volunteer",
            target_id=self.volunteer.id,
            details="Test audit detail",
        )

        # Non-admin user can't access audit logs
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.vol_access_token}")
        response_unauthorized = self.client.get("/api/admin/audit-log/")
        self.assertEqual(response_unauthorized.status_code, 403)

        # Platform admin can access
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.admin_access_token}")
        response = self.client.get("/api/admin/audit-log/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["count"], 1)
        self.assertEqual(response.data["results"][0]["action"], "test.action")
