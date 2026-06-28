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


# ─── PUBLIC REPORT VIEWS ────────────────────────────────────────────

@api_view(["POST"])
def api_report_create(request):
    serializer = ReportSerializer(data=request.data)
    if serializer.is_valid():
        report = serializer.save()
        tracking = f"BS-R{report.id:06d}"
        recipient_email = getattr(settings, "CONTACT_RECIPIENT_EMAIL", settings.DEFAULT_FROM_EMAIL)
        try:
            threading.Thread(target=send_new_report_alert_email, args=(recipient_email, report), daemon=True).start()
        except Exception:
            pass
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


@api_view(["POST"])
def api_admin_report_assign(request, report_id):
    """Assign reports to a college/admin or allow college admins to claim a report."""
    admin_user = require_staff_api(request)
    if isinstance(admin_user, Response):
        return admin_user

    report = get_object_or_404(Report, id=report_id)
    action = (request.data.get("action") or "").strip()

    if action == "claim":
        if getattr(admin_user, "admin_role", None) not in ("college_admin", "platform_admin"):
            return Response({"detail": "Only college or platform admins may claim reports."}, status=403)

        if getattr(admin_user, "admin_role", None) == "college_admin":
            college = admin_user.admin_college
            if not college:
                return Response({"detail": "Your admin profile is not assigned to a college."}, status=403)
            if report.district != college.district:
                return Response({"detail": "This report does not belong to your college district."}, status=403)
            report.assigned_college = college

        report.assigned_admin = admin_user
        report.assigned_at = timezone.now()
        report.status = "assigned"
        report.save(update_fields=["assigned_college", "assigned_admin", "assigned_at", "status"])
        log_admin_action(request, admin_user, "report.claim", "Report", report.id, f"Claimed by {admin_user.username}")
        return Response(ReportSerializer(report, context={"request": request}).data)

    if action == "auto_assign":
        if not is_platform_admin(admin_user):
            return Response({"detail": "Only platform admin may auto-assign reports."}, status=403)
        college = College.objects.filter(district=report.district).order_by("name").first()
        if college:
            report.assigned_college = college
            report.assigned_at = timezone.now()
            report.status = "assigned"
            report.save(update_fields=["assigned_college", "assigned_at", "status"])
            log_admin_action(request, admin_user, "report.auto_assign", "Report", report.id, f"Auto-assigned to {college.name}")
            return Response(ReportSerializer(report, context={"request": request}).data)
        return Response({"detail": "No matching college found for district."}, status=404)

    if not is_platform_admin(admin_user):
        return Response({"detail": "Only platform admin may assign or override assignments."}, status=403)

    changed = False
    assigned_college_id = request.data.get("assigned_college")
    if assigned_college_id is not None:
        college = College.objects.filter(id=assigned_college_id).first()
        report.assigned_college = college
        changed = True

    assigned_admin_id = request.data.get("assigned_admin")
    if assigned_admin_id is not None:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        u = User.objects.filter(id=assigned_admin_id).first()
        report.assigned_admin = u
        changed = True

    target_date = request.data.get("target_date")
    if target_date is not None:
        report.target_date = target_date
        changed = True

    if changed:
        report.assigned_at = timezone.now()
        if report.assigned_college and report.assigned_admin:
            report.status = "assigned"
        report.save()
        log_admin_action(request, admin_user, "report.assign", "Report", report.id, f"Assigned to college={report.assigned_college} admin={report.assigned_admin}")
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
