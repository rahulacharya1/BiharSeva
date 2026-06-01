"""Admin data export views — CSV download for reports, volunteers, events."""
import csv
from io import StringIO

from django.http import HttpResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response

from ..models import Report, Volunteer
from .helpers import (
    is_platform_admin,
    require_staff_api,
    scoped_events_queryset,
    scoped_volunteers_queryset,
)


@api_view(["GET"])
def api_admin_export_volunteers(request):
    """Export volunteers as CSV. Query param: ?format=csv"""
    admin_user = require_staff_api(request)
    if isinstance(admin_user, Response):
        return admin_user

    volunteers = scoped_volunteers_queryset(admin_user).order_by("name")

    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = 'attachment; filename="biharseva_volunteers.csv"'

    writer = csv.writer(response)
    writer.writerow(["Name", "Email", "Phone", "District", "College", "Verified", "Total Hours", "Registered On"])

    for v in volunteers:
        writer.writerow([
            v.name,
            v.email,
            v.phone,
            v.district,
            v.college.name if v.college else (v.college_name or ""),
            "Yes" if v.is_verified else "No",
            float(v.total_hours or 0),
            v.created_at.strftime("%Y-%m-%d"),
        ])

    return response


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
def api_admin_export_events(request):
    """Export events as CSV."""
    admin_user = require_staff_api(request)
    if isinstance(admin_user, Response):
        return admin_user

    events = scoped_events_queryset(admin_user).order_by("-date")

    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = 'attachment; filename="biharseva_events.csv"'

    writer = csv.writer(response)
    writer.writerow(["Title", "Date", "Location", "Activity Type", "Coordinator", "Completed", "NSS Unit"])

    for e in events:
        writer.writerow([
            e.title,
            e.date.strftime("%Y-%m-%d") if e.date else "",
            e.location,
            e.activity_type,
            e.program_coordinator_name or "",
            "Yes" if e.is_completed else "No",
            str(e.nss_unit) if e.nss_unit else "",
        ])

    return response
