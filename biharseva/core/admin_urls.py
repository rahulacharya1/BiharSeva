from django.urls import path
from . import admin_views

urlpatterns = [
    path('', admin_views.admin_dashboard, name='admin_dashboard'),
    path('reports/', admin_views.admin_reports, name='admin_reports'),
    path('volunteers/', admin_views.admin_volunteers, name='admin_volunteers'),
    path('events/', admin_views.admin_events, name='admin_events'),
    path('events/<int:event_id>/attendance/', admin_views.admin_event_attendance, name='admin_event_attendance'),
    path('certificates/', admin_views.admin_certificates, name='admin_certificates'),
]
