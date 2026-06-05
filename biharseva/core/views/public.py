"""Public-facing API views (no authentication required)."""
import threading
import uuid

from django.conf import settings
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from ..auth_utils import refresh_access_token
from ..models import Certificate, Event, Report, Volunteer, College
from ..serializers import (
    ContactMessageSerializer,
    PublicVolunteerSerializer,
    ReportSerializer,
)
from .helpers import send_contact_email, send_new_report_alert_email


@api_view(["GET"])
def api_home_stats(request):
    stats = {
        "total_reports": Report.objects.count(),
        "total_volunteers": Volunteer.objects.filter(is_verified=True).count(),
        "total_events": Event.objects.count(),
        "total_certificates": Certificate.objects.count(),
    }
    top_districts = list(
        Report.objects.values("district").annotate(count=Count("id")).order_by("-count")[:5]
    )
    colleges = list(
        College.objects.all().order_by("name").values("id", "name")
    )
    return Response({"stats": stats, "top_districts": top_districts, "colleges": colleges})


@api_view(["GET"])
def api_about_stats(request):
    stats = {
        "total_reports": Report.objects.filter(status="cleaned").count(),
        "total_volunteers": Volunteer.objects.filter(is_verified=True).count(),
        "total_events": Event.objects.count(),
    }
    return Response({"stats": stats})


@api_view(["POST"])
def api_report_create(request):
    serializer = ReportSerializer(data=request.data)
    if serializer.is_valid():
        report = serializer.save()
        # Generate tracking number for the reporter
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

    # Parse tracking number → report ID
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


@api_view(["POST"])
def api_contact_message(request):
    serializer = ContactMessageSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)

    recipient_email = getattr(settings, "CONTACT_RECIPIENT_EMAIL", settings.DEFAULT_FROM_EMAIL)
    sender_name = serializer.validated_data["name"].strip()
    sender_email = serializer.validated_data["email"].strip()
    subject = serializer.validated_data["subject"].strip()
    message_body = serializer.validated_data["message"].strip()

    try:
        threading.Thread(
            target=send_contact_email,
            args=(recipient_email, sender_name, sender_email, subject, message_body),
            daemon=True,
        ).start()
    except Exception:
        return Response({"detail": "Failed to send your message. Please try again later."}, status=500)

    return Response({"message": "Message received. It is being sent now."}, status=202)


@api_view(["GET"])
def api_report_gallery(request):
    """Report gallery with search and filter support.
    Query params:
      ?district=Purnea     — filter by district
      ?status=cleaned      — filter by status
      ?search=garbage      — search in location and description
    """
    reports = Report.objects.filter(status__in=["verified", "in_progress", "cleaned"])

    district = request.query_params.get("district")
    report_status = request.query_params.get("status")
    search = request.query_params.get("search")

    if district:
        reports = reports.filter(district__iexact=district)
    if report_status:
        reports = reports.filter(status=report_status)
    if search:
        reports = reports.filter(
            Q(location__icontains=search)
            | Q(description__icontains=search)
            | Q(reporter_name__icontains=search)
        )

    reports = reports.order_by("-created_at")
    return Response(ReportSerializer(reports, many=True, context={"request": request}).data)


@api_view(["GET"])
def api_volunteers_list(request):
    """Volunteer directory with search and filter support.
    Query params:
      ?district=Purnea     — filter by district
      ?search=rahul        — search by name
    """
    volunteers = Volunteer.objects.filter(is_verified=True)

    district = request.query_params.get("district")
    search = request.query_params.get("search")

    if district:
        volunteers = volunteers.filter(district__iexact=district)
    if search:
        volunteers = volunteers.filter(name__icontains=search)

    volunteers = volunteers.order_by("name")
    return Response(PublicVolunteerSerializer(volunteers, many=True).data)


@api_view(["GET"])
def api_volunteer_leaderboard(request):
    """Public leaderboard: top volunteers by service hours.
    Query params:
      ?district=Purnea     — filter by district
      ?limit=10            — number of results (default 10, max 50)
    """
    qs = Volunteer.objects.filter(is_verified=True, total_hours__gt=0)

    district = request.query_params.get("district")
    if district:
        qs = qs.filter(district__iexact=district)

    try:
        limit = min(int(request.query_params.get("limit", 10)), 50)
    except (ValueError, TypeError):
        limit = 10

    top_volunteers = qs.order_by("-total_hours")[:limit]

    leaderboard = []
    for rank, volunteer in enumerate(top_volunteers, 1):
        badges = list(volunteer.badges.values_list("level", flat=True))
        leaderboard.append({
            "rank": rank,
            "name": volunteer.name,
            "district": volunteer.district,
            "college": volunteer.college.name if volunteer.college else None,
            "total_hours": float(volunteer.total_hours or 0),
            "badges": badges,
            "highest_badge": badges[-1] if badges else None,
        })

    return Response({"leaderboard": leaderboard, "total_active": qs.count()})


@api_view(["POST"])
def api_token_refresh(request):
    """Refresh an access token using a valid refresh token."""
    refresh_token = request.data.get("refresh_token")
    if not refresh_token:
        return Response({"detail": "refresh_token is required."}, status=400)

    new_access_token = refresh_access_token(refresh_token)
    if not new_access_token:
        return Response({"detail": "Invalid or expired refresh token. Please log in again."}, status=401)

    return Response({"token": new_access_token})


@api_view(["GET"])
def api_health_check(request):
    """Health check endpoint for monitoring."""
    return Response({
        "status": "healthy",
        "version": "1.0.0",
        "timestamp": timezone.now().isoformat(),
    })


@api_view(["GET"])
def api_public_colleges(request):
    """List of all registered colleges."""
    colleges = College.objects.all().order_by("name")
    data = [{"id": c.id, "name": c.name, "district": c.district} for c in colleges]
    return Response(data)


