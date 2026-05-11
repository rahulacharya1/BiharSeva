"""Public-facing API views (no authentication required)."""
import threading

from django.conf import settings
from django.db.models import Count
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from ..models import Certificate, Event, Report, Volunteer
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
    return Response({"stats": stats, "top_districts": top_districts})


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
        recipient_email = getattr(settings, "CONTACT_RECIPIENT_EMAIL", settings.DEFAULT_FROM_EMAIL)
        try:
            threading.Thread(target=send_new_report_alert_email, args=(recipient_email, report), daemon=True).start()
        except Exception:
            pass
        return Response({"message": "Issue reported successfully!", "report": serializer.data}, status=201)
    return Response(serializer.errors, status=400)


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
    reports = Report.objects.filter(status__in=["verified", "in_progress", "cleaned"]).order_by("-created_at")
    return Response(ReportSerializer(reports, many=True, context={"request": request}).data)


@api_view(["GET"])
def api_volunteers_list(request):
    volunteers = Volunteer.objects.filter(is_verified=True).order_by("name")
    return Response(PublicVolunteerSerializer(volunteers, many=True).data)
