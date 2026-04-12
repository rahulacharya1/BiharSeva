from django.urls import path

from . import api_views


urlpatterns = [
    path("meta/home/", api_views.api_home_stats, name="api_home_stats"),
    path("meta/about/", api_views.api_about_stats, name="api_about_stats"),
    path("contact/", api_views.api_contact_message, name="api_contact_message"),

    path("reports/", api_views.api_report_create, name="api_report_create"),
    path("reports/gallery/", api_views.api_report_gallery, name="api_report_gallery"),

    path("volunteers/register/", api_views.api_volunteer_register, name="api_volunteer_register"),
    path("volunteers/login/", api_views.api_volunteer_login, name="api_volunteer_login"),
    path("volunteers/google-auth/", api_views.api_volunteer_google_auth, name="api_volunteer_google_auth"),
    path("volunteers/logout/", api_views.api_volunteer_logout, name="api_volunteer_logout"),
    path("volunteers/me/", api_views.api_volunteer_me, name="api_volunteer_me"),
    path("volunteers/", api_views.api_volunteers_list, name="api_volunteers_list"),
    path("volunteers/password-reset/", api_views.api_volunteer_password_reset, name="api_volunteer_password_reset"),
    path("volunteers/request-otp/", api_views.api_volunteer_request_otp, name="api_volunteer_request_otp"),
    path("volunteers/verify-otp/", api_views.api_volunteer_verify_otp, name="api_volunteer_verify_otp"),

    path("events/", api_views.api_events_list, name="api_events_list"),
    path("events/<int:pk>/register/", api_views.api_event_register, name="api_event_register"),

    path("certificates/", api_views.api_certificates, name="api_certificates"),
    path("certificates/<int:certificate_id>/download/", api_views.api_certificate_download, name="api_certificate_download"),
    path("certificates/<int:certificate_id>/view/", api_views.api_certificate_view, name="api_certificate_view"),

    path("admin/auth/login/", api_views.api_admin_login, name="api_admin_login"),
    path("admin/auth/me/", api_views.api_admin_me, name="api_admin_me"),
    path("admin/dashboard/", api_views.api_admin_dashboard, name="api_admin_dashboard"),
    path("admin/reports/", api_views.api_admin_reports, name="api_admin_reports"),
    path("admin/reports/<int:report_id>/", api_views.api_admin_reports, name="api_admin_report_update"),
    path("admin/volunteers/", api_views.api_admin_volunteers, name="api_admin_volunteers"),
    path("admin/volunteers/<int:volunteer_id>/", api_views.api_admin_volunteers, name="api_admin_volunteer_update"),
    path("admin/events/", api_views.api_admin_events, name="api_admin_events"),
    path("admin/events/<int:event_id>/", api_views.api_admin_event_detail, name="api_admin_event_detail"),
    path("admin/events/<int:event_id>/attendance/", api_views.api_admin_event_attendance, name="api_admin_event_attendance"),
    path(
        "admin/events/<int:event_id>/attendance/<int:registration_id>/",
        api_views.api_admin_event_attendance,
        name="api_admin_event_attendance_update",
    ),
    path("admin/certificates/", api_views.api_admin_certificates, name="api_admin_certificates"),
    path("admin/certificates/<int:certificate_id>/", api_views.api_admin_certificate_detail, name="api_admin_certificate_detail"),
]
