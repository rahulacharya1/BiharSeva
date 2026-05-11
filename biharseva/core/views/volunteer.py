"""Volunteer authentication, profile, and OTP views."""
import threading
from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from ..auth_utils import decode_token, get_volunteer_from_request, issue_token
from ..models import Certificate, Event, EventRegistration, Volunteer
from ..serializers import (
    CertificateSerializer,
    EventRegistrationSerializer,
    EventSerializer,
    VolunteerOtpRequestSerializer,
    VolunteerOtpVerifySerializer,
    VolunteerRegisterSerializer,
    VolunteerSerializer,
)
from .helpers import (
    generate_otp,
    send_new_volunteer_alert_email,
    send_otp_email,
    send_password_changed_email,
    volunteer_auth_required,
)


@api_view(["POST"])
def api_volunteer_register(request):
    serializer = VolunteerRegisterSerializer(data=request.data)
    if serializer.is_valid():
        volunteer = serializer.save()
        signup_sub = request.data.get("google_sub")
        if signup_sub:
            volunteer.google_sub = signup_sub
            volunteer.save(update_fields=["google_sub"])

        recipient_email = getattr(settings, "CONTACT_RECIPIENT_EMAIL", settings.DEFAULT_FROM_EMAIL)
        try:
            threading.Thread(target=send_new_volunteer_alert_email, args=(recipient_email, volunteer), daemon=True).start()
        except Exception:
            pass

        return Response({"message": "Registered successfully! Wait for admin verification."}, status=201)
    return Response(serializer.errors, status=400)


@api_view(["POST"])
def api_volunteer_login(request):
    email = (request.data.get("email") or "").strip().lower()
    password = request.data.get("password") or ""
    volunteer = Volunteer.objects.filter(email=email).first()

    if not volunteer or not volunteer.verify_password(password):
        return Response({"detail": "Invalid email or password."}, status=400)
    if not volunteer.is_verified:
        return Response({"detail": "Registration exists, but admin verification is pending."}, status=403)

    token = issue_token({"role": "volunteer", "volunteer_id": volunteer.id}, expires_minutes=24 * 60)
    return Response({"message": "Login successful.", "token": token, "volunteer": VolunteerSerializer(volunteer).data})


@api_view(["POST"])
def api_volunteer_google_auth(request):
    credential = request.data.get("credential")
    if not getattr(settings, "GOOGLE_CLIENT_ID", ""):
        return Response({"detail": "Google login is not configured yet."}, status=503)
    if not credential:
        return Response({"detail": "Google authentication token missing."}, status=400)

    try:
        payload = id_token.verify_oauth2_token(credential, google_requests.Request(), settings.GOOGLE_CLIENT_ID)
    except Exception:
        return Response({"detail": "Google authentication failed."}, status=400)

    email = payload.get("email", "").strip().lower()
    name = payload.get("name", "").strip()
    sub = payload.get("sub", "").strip()

    if not email or not sub:
        return Response({"detail": "Google account data is incomplete."}, status=400)

    volunteer = Volunteer.objects.filter(email=email).first()
    if volunteer:
        if volunteer.google_sub and volunteer.google_sub != sub:
            return Response({"detail": "This email is linked with a different Google account."}, status=400)
        if not volunteer.google_sub:
            volunteer.google_sub = sub
            volunteer.save(update_fields=["google_sub"])
        if not volunteer.is_verified:
            return Response({"detail": "Registration exists, but admin verification is pending."}, status=403)

        token = issue_token({"role": "volunteer", "volunteer_id": volunteer.id}, expires_minutes=24 * 60)
        return Response({"message": "Login successful.", "token": token, "volunteer": VolunteerSerializer(volunteer).data})

    return Response(
        {
            "detail": "No volunteer account found for this email. Complete signup.",
            "signup_seed": {"email": email, "name": name, "google_sub": sub},
        },
        status=404,
    )


@api_view(["POST"])
def api_volunteer_logout(request):
    return Response({"message": "Logout is handled on client by deleting token."})


@api_view(["GET", "PATCH"])
def api_volunteer_me(request):
    volunteer, error = volunteer_auth_required(request)
    if error:
        return error

    if request.method == "GET":
        registrations = EventRegistration.objects.filter(volunteer=volunteer).select_related("event").order_by("-registered_at")
        certificates = Certificate.objects.filter(volunteer=volunteer).select_related("event").order_by("-issued_date")
        upcoming_events = Event.objects.filter(is_completed=False).order_by("date")[:5]

        return Response(
            {
                "volunteer": VolunteerSerializer(volunteer).data,
                "registrations": EventRegistrationSerializer(registrations, many=True).data,
                "certificates": CertificateSerializer(certificates, many=True).data,
                "upcoming_events": EventSerializer(upcoming_events, many=True).data,
                "registration_count": registrations.count(),
                "certificate_count": certificates.count(),
            }
        )

    serializer = VolunteerSerializer(volunteer, data=request.data, partial=True)
    if serializer.is_valid():
        new_password = request.data.get("new_password")
        old_password = request.data.get("old_password")

        # Validate old password if new password is provided
        if new_password:
            if not old_password:
                return Response({"detail": "old_password is required to change password."}, status=400)
            if not volunteer.verify_password(old_password):
                return Response({"detail": "Current password is incorrect."}, status=400)

        updated_volunteer = serializer.save()

        if new_password:
            updated_volunteer.set_password(new_password)
            updated_volunteer.save(update_fields=["password_hash"])
            try:
                threading.Thread(
                    target=send_password_changed_email,
                    args=(updated_volunteer.email, updated_volunteer.name),
                    daemon=True,
                ).start()
            except Exception:
                pass
        return Response({"message": "Profile updated successfully.", "volunteer": VolunteerSerializer(updated_volunteer).data})
    return Response(serializer.errors, status=400)


@api_view(["POST"])
def api_volunteer_request_otp(request):
    serializer = VolunteerOtpRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)

    email = serializer.validated_data["email"]
    phone = serializer.validated_data["phone"]

    volunteer = Volunteer.objects.filter(email=email, phone=phone).first()
    if not volunteer:
        return Response({"detail": "No volunteer found with provided email and phone number."}, status=404)
    if not volunteer.is_verified:
        return Response({"detail": "Account is not verified yet."}, status=403)

    if volunteer.otp_code and volunteer.otp_expiry and timezone.now() < volunteer.otp_expiry:
        otp = volunteer.otp_code
    else:
        otp = generate_otp()
        volunteer.otp_code = otp
        volunteer.otp_expiry = timezone.now() + timedelta(minutes=10)
        volunteer.save(update_fields=["otp_code", "otp_expiry"])

    try:
        threading.Thread(target=send_otp_email, args=(email, otp, volunteer.name), daemon=True).start()
    except Exception:
        return Response({"detail": "Failed to send OTP. Please try again later."}, status=500)

    otp_reset_token = issue_token(
        {"role": "volunteer", "purpose": "otp_reset", "email": email, "phone": phone},
        expires_minutes=10,
    )
    return Response(
        {
            "message": f"OTP requested for {email}. It usually arrives in a few seconds.",
            "otp_reset_token": otp_reset_token,
        },
        status=202,
    )


@api_view(["POST"])
def api_volunteer_verify_otp(request):
    serializer = VolunteerOtpVerifySerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)

    otp_reset_token = request.data.get("otp_reset_token")
    if not otp_reset_token:
        return Response({"detail": "otp_reset_token is required."}, status=400)

    try:
        otp_payload = decode_token(otp_reset_token)
    except Exception:
        return Response({"detail": "Invalid or expired OTP reset token."}, status=400)

    if otp_payload.get("purpose") != "otp_reset":
        return Response({"detail": "Invalid OTP reset token purpose."}, status=400)

    otp_email = otp_payload.get("email")
    otp_phone = otp_payload.get("phone")
    if not otp_email or not otp_phone:
        return Response({"detail": "Invalid OTP reset token payload."}, status=400)

    volunteer = Volunteer.objects.filter(email=otp_email, phone=otp_phone).first()
    if not volunteer:
        return Response({"detail": "Volunteer not found."}, status=404)
    if volunteer.otp_code != serializer.validated_data["otp"]:
        return Response({"detail": "Invalid OTP."}, status=400)
    if volunteer.otp_expiry and timezone.now() > volunteer.otp_expiry:
        return Response({"detail": "OTP has expired. Please request a new OTP."}, status=400)

    volunteer.set_password(serializer.validated_data["new_password"])
    volunteer.otp_code = None
    volunteer.otp_expiry = None
    volunteer.save(update_fields=["password_hash", "otp_code", "otp_expiry"])

    try:
        threading.Thread(
            target=send_password_changed_email,
            args=(volunteer.email, volunteer.name),
            daemon=True,
        ).start()
    except Exception:
        pass

    return Response({"message": "Password reset successful."})
