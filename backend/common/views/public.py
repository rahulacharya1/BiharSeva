import threading
from django.conf import settings
from django.db.models import Count
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response

from reports.models import Report
from authentication.models import Volunteer
from events.models import Event, Certificate
from colleges.models import College
from common.serializers import ContactMessageSerializer
from common.views.helpers import send_contact_email
from common.auth_utils import refresh_access_token


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
def api_health_check(request):
    """Health check endpoint for monitoring."""
    return Response({
        "status": "healthy",
        "version": "1.0.0",
        "timestamp": timezone.now().isoformat(),
    })


@api_view(["POST"])
def api_token_refresh(request):
    """Refresh an access token using a valid refresh token."""
    refresh_token = request.COOKIES.get("refresh_token") or request.data.get("refresh_token")
    if not refresh_token:
        return Response({"detail": "refresh_token is required."}, status=401)

    new_access_token = refresh_access_token(refresh_token)
    if not new_access_token:
        return Response({"detail": "Invalid or expired refresh token. Please log in again."}, status=401)

    response = Response({"token": new_access_token})

    # If using cookie-based auth, set the new access token cookie
    if request.COOKIES.get("refresh_token"):
        response.set_cookie(
            key="access_token",
            value=new_access_token,
            max_age=30 * 60,
            httponly=True,
            secure=not settings.DEBUG,
            samesite="Lax",
        )
    return response
