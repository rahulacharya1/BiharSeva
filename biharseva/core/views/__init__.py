"""
core.views — Modular API views package.

Split from a monolithic 1,977-line api_views.py into focused modules:
  - public.py       — Unauthenticated endpoints (home, about, reports, contact)
  - volunteer.py    — Volunteer auth, profile, and OTP flows
  - events.py       — Event listing, registration, certificate download
  - admin_auth.py   — Admin login, OTP, profile
  - admin_ops.py    — Admin dashboard, reports/volunteers/events/certificates CRUD
  - admin_college.py — College infrastructure (NSS units, officers, proposals, hours, badges, analytics)
  - helpers.py      — Shared utilities, scoped querysets, email functions
  - certificates.py — PDF generation
"""

# Public views
from .public import (
    api_home_stats,
    api_about_stats,
    api_report_create,
    api_report_status,
    api_contact_message,
    api_report_gallery,
    api_volunteers_list,
    api_volunteer_leaderboard,
    api_token_refresh,
    api_health_check,
    api_public_colleges,
)

# Volunteer views
from .volunteer import (
    api_volunteer_register,
    api_volunteer_login,
    api_volunteer_google_auth,
    api_volunteer_logout,
    api_volunteer_me,
    api_volunteer_request_otp,
    api_volunteer_verify_otp,
)

# Event & certificate views
from .events import (
    api_events_list,
    api_event_register,
    api_certificates,
    api_certificate_download,
    api_certificate_view,
)

# Admin auth views
from .admin_auth import (
    api_admin_login,
    api_admin_logout,
    api_admin_request_otp,
    api_admin_verify_otp,
    api_admin_me,
    api_admin_profile,
    api_admin_mfa_verify,
    api_admin_mfa_setup,
    api_admin_mfa_enable,
    api_admin_mfa_disable,
)

# Admin operations views
from .admin_ops import (
    api_admin_dashboard,
    api_admin_reports,
    api_admin_report_assign,
    api_admin_volunteers,
    api_admin_events,
    api_admin_event_detail,
    api_admin_event_attendance,
    api_admin_certificates,
    api_admin_certificate_detail,
    api_admin_certificate_view,
    api_admin_audit_logs,
)

# Admin college infrastructure views
from .admin_college import (
    api_admin_colleges,
    api_admin_college_detail,
    api_admin_nss_units,
    api_admin_nss_unit_detail,
    api_admin_program_officers,
    api_admin_program_officer_detail,
)

# Admin export views
from .admin_export import (
    api_admin_export_volunteers,
    api_admin_export_reports,
    api_admin_export_events,
)

# Volunteer notification views
from .notifications import (
    api_notifications,
    api_notification_read,
    api_notifications_read_all,
)
