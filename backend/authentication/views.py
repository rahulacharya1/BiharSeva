import threading
import hashlib
from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from django.contrib.auth import authenticate, get_user_model
from django.db.models import Count, Q
from django.core.cache import cache
from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.decorators import api_view, throttle_classes
from rest_framework.response import Response

from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

from common.auth_utils import (
    decode_token,
    get_volunteer_from_request,
    issue_token,
    issue_token_pair,
    set_auth_cookies,
    delete_auth_cookies,
    blacklist_token,
)
from common.totp import generate_totp_secret, get_totp_uri, verify_totp
from common.models import AuditLog
from common.views.helpers import (
    generate_otp,
    require_staff_api,
    send_otp_email,
    send_password_changed_email,
    send_admin_otp_email,
    send_admin_password_changed_email,
    send_new_volunteer_alert_email,
    volunteer_auth_required,
    OTPThrottle,
    is_platform_admin,
    scoped_volunteers_queryset,
    create_notification,
    log_admin_action,
)

from authentication.models import Volunteer, AdminProfile
from authentication.serializers import (
    PublicVolunteerSerializer,
    VolunteerRegisterSerializer,
    VolunteerSerializer,
    VolunteerOtpRequestSerializer,
    VolunteerOtpVerifySerializer,
    AdminOtpRequestSerializer,
    AdminOtpVerifySerializer,
    AdminVolunteerManageSerializer,
    AdminVolunteerActionSerializer,
)
from authentication.filters import VolunteerFilter

from events.models import Event, EventRegistration, Certificate
from events.serializers import EventSerializer, EventRegistrationSerializer, CertificateSerializer


# ─── VOLUNTEER AUTH VIEWS ───────────────────────────────────────────

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

    tokens = issue_token_pair({"role": "volunteer", "volunteer_id": volunteer.id})
    response = Response({
        "message": "Login successful.",
        "token": tokens["access_token"],
        "refresh_token": tokens["refresh_token"],
        "volunteer": VolunteerSerializer(volunteer).data,
    })
    set_auth_cookies(response, tokens)
    return response


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

        tokens = issue_token_pair({"role": "volunteer", "volunteer_id": volunteer.id})
        response = Response({
            "message": "Login successful.",
            "token": tokens["access_token"],
            "refresh_token": tokens["refresh_token"],
            "volunteer": VolunteerSerializer(volunteer).data,
        })
        set_auth_cookies(response, tokens)
        return response

    return Response(
        {
            "detail": "No volunteer account found for this email. Complete signup.",
            "signup_seed": {"email": email, "name": name, "google_sub": sub},
        },
        status=404,
    )


@api_view(["POST"])
def api_volunteer_logout(request):
    access_token = request.COOKIES.get("access_token")
    if not access_token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            access_token = auth_header.split(" ", 1)[1].strip()

    refresh_token = request.COOKIES.get("refresh_token") or request.data.get("refresh_token")

    blacklist_token(access_token)
    blacklist_token(refresh_token)

    response = Response({"message": "Logout successful on server."})
    delete_auth_cookies(response)
    return response


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
@throttle_classes([OTPThrottle])
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
@throttle_classes([OTPThrottle])
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


@api_view(["GET"])
def api_volunteers_list(request):
    """Volunteer directory with search and filter support."""
    volunteers = Volunteer.objects.filter(is_verified=True)

    filter_set = VolunteerFilter(request.GET, queryset=volunteers)
    if filter_set.is_valid():
        volunteers = filter_set.qs

    search = request.query_params.get("search")
    if search:
        volunteers = volunteers.filter(name__icontains=search)

    volunteers = volunteers.order_by("name")
    return Response(PublicVolunteerSerializer(volunteers, many=True).data)


@api_view(["GET"])
def api_volunteer_leaderboard(request):
    """Public leaderboard: top volunteers by service hours."""
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


# ─── ADMIN AUTH VIEWS ───────────────────────────────────────────────

@api_view(["POST"])
def api_admin_login(request):
    identifier = (request.data.get("username") or request.data.get("email") or "").strip()
    password = request.data.get("password") or ""

    if not identifier or not password:
        return Response({"detail": "Username/email and password are required."}, status=400)

    User = get_user_model()
    username = identifier
    if "@" in identifier:
        by_email_user = User.objects.filter(email__iexact=identifier, is_active=True).first()
        if by_email_user:
            username = by_email_user.get_username()

    user = authenticate(request, username=username, password=password)
    if not user:
        return Response({"detail": "Invalid admin credentials."}, status=400)
    if not user.is_staff:
        return Response({"detail": "This account is not an admin account."}, status=403)

    profile = AdminProfile.objects.select_related("college").filter(user=user).first()
    if user.is_superuser:
        admin_role = "platform_admin"
        admin_college_id = None
    elif profile:
        admin_role = profile.role
        admin_college_id = profile.college_id
    else:
        return Response({"detail": "Admin profile is not configured for this account."}, status=403)

    if admin_role == "college_admin" and not admin_college_id:
        return Response({"detail": "College admin account must be assigned to a college."}, status=403)

    if profile and profile.mfa_enabled:
        mfa_pending_token = issue_token(
            {
                "role": "admin",
                "purpose": "mfa_pending",
                "user_id": user.id,
                "admin_role": admin_role,
                "admin_college_id": admin_college_id,
            },
            expires_minutes=5,
        )
        return Response({
            "mfa_required": True,
            "mfa_pending_token": mfa_pending_token,
        })

    tokens = issue_token_pair(
        {
            "role": "admin",
            "user_id": user.id,
            "admin_role": admin_role,
            "admin_college_id": admin_college_id,
        }
    )
    response = Response(
        {
            "message": "Admin login successful.",
            "token": tokens["access_token"],
            "refresh_token": tokens["refresh_token"],
            "username": user.username,
            "admin_role": admin_role,
            "admin_college_id": admin_college_id,
            "admin_college_name": profile.college.name if (profile and profile.college_id) else None,
        }
    )
    set_auth_cookies(response, tokens)
    return response


@api_view(["POST"])
@throttle_classes([OTPThrottle])
def api_admin_request_otp(request):
    serializer = AdminOtpRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)

    email = serializer.validated_data["email"]
    User = get_user_model()
    admin_user = User.objects.filter(email=email, is_staff=True, is_active=True).first()
    if not admin_user:
        return Response({"detail": "No admin account found for the provided email."}, status=404)

    otp = generate_otp()
    otp_nonce = hashlib.sha256(f"{admin_user.id}:{email}:{otp}".encode()).hexdigest()[:16]
    cache_key = f"admin_otp:{otp_nonce}"
    cache.set(cache_key, {
        "otp_hash": hashlib.sha256(otp.encode()).hexdigest(),
        "user_id": admin_user.id,
        "email": email,
    }, timeout=600)

    otp_reset_token = issue_token(
        {"role": "admin", "purpose": "otp_reset", "email": email, "user_id": admin_user.id, "otp_nonce": otp_nonce},
        expires_minutes=10,
    )

    try:
        threading.Thread(target=send_admin_otp_email, args=(email, otp, admin_user.username), daemon=True).start()
    except Exception:
        return Response({"detail": "Failed to send OTP. Please try again later."}, status=500)

    return Response(
        {
            "message": f"OTP requested for {email}. It usually arrives in a few seconds.",
            "otp_reset_token": otp_reset_token,
        },
        status=202,
    )


@api_view(["POST"])
@throttle_classes([OTPThrottle])
def api_admin_verify_otp(request):
    serializer = AdminOtpVerifySerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)

    otp_reset_token = request.data.get("otp_reset_token")
    if not otp_reset_token:
        return Response({"detail": "otp_reset_token is required."}, status=400)

    try:
        otp_payload = decode_token(otp_reset_token)
    except Exception:
        return Response({"detail": "OTP session expired or invalid. Please request a new OTP."}, status=400)

    if otp_payload.get("role") != "admin" or otp_payload.get("purpose") != "otp_reset":
        return Response({"detail": "Invalid OTP session."}, status=400)

    email = otp_payload.get("email") or ""
    user_id = otp_payload.get("user_id")
    otp_nonce = otp_payload.get("otp_nonce") or ""
    otp = serializer.validated_data["otp"]
    new_password = serializer.validated_data["new_password"]

    cache_key = f"admin_otp:{otp_nonce}"
    cached_data = cache.get(cache_key)
    if not cached_data:
        return Response({"detail": "OTP has expired. Please request a new OTP."}, status=400)

    expected_otp_hash = cached_data.get("otp_hash", "")
    submitted_otp_hash = hashlib.sha256(otp.encode()).hexdigest()

    if submitted_otp_hash != expected_otp_hash:
        return Response({"detail": "Invalid OTP code."}, status=400)

    if cached_data.get("user_id") != user_id or cached_data.get("email") != email:
        return Response({"detail": "OTP session mismatch."}, status=400)

    User = get_user_model()
    admin_user = User.objects.filter(id=user_id, email=email, is_staff=True, is_active=True).first()
    if not admin_user:
        return Response({"detail": "Admin account not found."}, status=404)

    admin_user.set_password(new_password)
    admin_user.save(update_fields=["password"])
    cache.delete(cache_key)

    try:
        threading.Thread(target=send_admin_password_changed_email, args=(admin_user.email, admin_user.username), daemon=True).start()
    except Exception:
        pass

    return Response({"message": "Admin password reset successful."})


@api_view(["GET"])
def api_admin_me(request):
    admin_user = require_staff_api(request)
    if isinstance(admin_user, Response):
        return admin_user
    return Response(
        {
            "username": admin_user.username,
            "is_staff": True,
            "admin_role": admin_user.admin_role,
            "admin_college_id": admin_user.admin_college_id,
            "admin_college_name": admin_user.admin_college.name if admin_user.admin_college else None,
        }
    )


@api_view(["GET", "PATCH"])
def api_admin_profile(request):
    admin_user = require_staff_api(request)
    if isinstance(admin_user, Response):
        return admin_user

    profile = AdminProfile.objects.select_related("college").filter(user=admin_user).first()
    if not profile and admin_user.is_superuser:
        profile = AdminProfile.objects.create(user=admin_user, role="platform_admin")

    if not profile:
        return Response({"detail": "Admin profile is not configured for this account."}, status=403)

    if request.method == "GET":
        return Response(
            {
                "username": admin_user.username,
                "email": admin_user.email,
                "admin_role": admin_user.admin_role,
                "college_id": admin_user.admin_college_id,
                "college_name": admin_user.admin_college.name if admin_user.admin_college else None,
                "mfa_enabled": profile.mfa_enabled,
            }
        )

    username = (request.data.get("username") or admin_user.username or "").strip()
    email = (request.data.get("email") or admin_user.email or "").strip().lower()

    if not username:
        return Response({"detail": "Username is required."}, status=400)

    User = get_user_model()
    username_taken = User.objects.filter(username=username).exclude(id=admin_user.id).exists()
    email_taken = bool(email) and User.objects.filter(email__iexact=email).exclude(id=admin_user.id).exists()
    if username_taken:
        return Response({"detail": "Username already exists."}, status=400)
    if email_taken:
        return Response({"detail": "Email already exists."}, status=400)

    admin_user.username = username
    admin_user.email = email
    admin_user.save(update_fields=["username", "email"])

    return Response(
        {
            "message": "Profile updated successfully.",
            "profile": {
                "username": admin_user.username,
                "email": admin_user.email,
                "admin_role": admin_user.admin_role,
                "college_id": admin_user.admin_college_id,
                "college_name": admin_user.admin_college.name if admin_user.admin_college else None,
                "mfa_enabled": profile.mfa_enabled,
            },
        }
    )


@api_view(["POST"])
def api_admin_logout(request):
    access_token = request.COOKIES.get("access_token")
    if not access_token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            access_token = auth_header.split(" ", 1)[1].strip()

    refresh_token = request.COOKIES.get("refresh_token") or request.data.get("refresh_token")

    blacklist_token(access_token)
    blacklist_token(refresh_token)

    response = Response({"message": "Logout successful on server."})
    delete_auth_cookies(response)
    return response


@api_view(["POST"])
def api_admin_mfa_verify(request):
    mfa_pending_token = request.data.get("mfa_pending_token")
    code = (request.data.get("code") or "").strip()

    if not mfa_pending_token or not code:
        return Response({"detail": "mfa_pending_token and verification code are required."}, status=400)

    try:
        payload = decode_token(mfa_pending_token)
    except Exception:
        return Response({"detail": "Login session expired or invalid. Please log in again."}, status=401)

    if payload.get("role") != "admin" or payload.get("purpose") != "mfa_pending":
        return Response({"detail": "Invalid login session state."}, status=400)

    user_id = payload.get("user_id")
    admin_role = payload.get("admin_role")
    admin_college_id = payload.get("admin_college_id")

    User = get_user_model()
    user = User.objects.filter(id=user_id, is_staff=True, is_active=True).first()
    if not user:
        return Response({"detail": "User not found or is inactive."}, status=404)

    profile = AdminProfile.objects.select_related("college").filter(user=user).first()
    if not profile or not profile.mfa_enabled or not profile.mfa_secret:
        return Response({"detail": "MFA configuration mismatch."}, status=400)

    if verify_totp(profile.mfa_secret, code):
        tokens = issue_token_pair(
            {
                "role": "admin",
                "user_id": user.id,
                "admin_role": admin_role,
                "admin_college_id": admin_college_id,
            }
        )
        response = Response(
            {
                "message": "MFA verification successful. Admin login successful.",
                "token": tokens["access_token"],
                "refresh_token": tokens["refresh_token"],
                "username": user.username,
                "admin_role": admin_role,
                "admin_college_id": admin_college_id,
                "admin_college_name": profile.college.name if (profile and profile.college_id) else None,
            }
        )
        set_auth_cookies(response, tokens)
        return response
    else:
        return Response({"detail": "Invalid verification code. Please check your authenticator app."}, status=400)


@api_view(["GET"])
def api_admin_mfa_setup(request):
    admin_user = require_staff_api(request)
    if isinstance(admin_user, Response):
        return admin_user

    profile = AdminProfile.objects.filter(user=admin_user).first()
    if not profile and admin_user.is_superuser:
        profile = AdminProfile.objects.create(user=admin_user, role="platform_admin")

    if not profile:
        return Response({"detail": "Admin profile not found."}, status=404)

    if not profile.mfa_secret or not profile.mfa_enabled:
        profile.mfa_secret = generate_totp_secret()
        profile.save(update_fields=["mfa_secret"])

    qr_code_uri = get_totp_uri(profile.mfa_secret, admin_user.email or admin_user.username)

    return Response({
        "mfa_secret": profile.mfa_secret,
        "qr_code_uri": qr_code_uri,
        "mfa_enabled": profile.mfa_enabled,
    })


@api_view(["POST"])
def api_admin_mfa_enable(request):
    admin_user = require_staff_api(request)
    if isinstance(admin_user, Response):
        return admin_user

    code = (request.data.get("code") or "").strip()
    if not code:
        return Response({"detail": "MFA code is required."}, status=400)

    profile = AdminProfile.objects.filter(user=admin_user).first()
    if not profile or not profile.mfa_secret:
        return Response({"detail": "MFA setup has not been initialized. Request setup first."}, status=400)

    if verify_totp(profile.mfa_secret, code):
        profile.mfa_enabled = True
        profile.save(update_fields=["mfa_enabled"])
        return Response({"message": "Two-factor authentication enabled successfully."})
    else:
        return Response({"detail": "Invalid verification code. Please check your authenticator app."}, status=400)


@api_view(["POST"])
def api_admin_mfa_disable(request):
    admin_user = require_staff_api(request)
    if isinstance(admin_user, Response):
        return admin_user

    code = (request.data.get("code") or "").strip()
    if not code:
        return Response({"detail": "MFA verification code is required to disable 2FA."}, status=400)

    profile = AdminProfile.objects.filter(user=admin_user).first()
    if not profile or not profile.mfa_enabled:
        return Response({"detail": "MFA is not enabled for this account."}, status=400)

    if verify_totp(profile.mfa_secret, code):
        profile.mfa_enabled = False
        profile.mfa_secret = None
        profile.save(update_fields=["mfa_enabled", "mfa_secret"])
        return Response({"message": "Two-factor authentication disabled successfully."})
    else:
        return Response({"detail": "Invalid verification code."}, status=400)


@api_view(["GET"])
def api_admin_audit_logs(request):
    admin_user = require_staff_api(request)
    if isinstance(admin_user, Response):
        return admin_user

    if not is_platform_admin(admin_user):
        return Response({"detail": "Only platform admin can view system audit logs."}, status=403)

    logs = AuditLog.objects.select_related("admin_user").order_by("-created_at")[:100]
    data = []
    for log in logs:
        data.append({
            "id": log.id,
            "admin_user": log.admin_user.username if log.admin_user else "Unknown",
            "action": log.action,
            "target_model": log.target_model,
            "target_id": log.target_id,
            "details": log.details,
            "ip_address": log.ip_address,
            "created_at": log.created_at,
        })
    return Response(data)


@api_view(["GET", "PATCH", "DELETE"])
def api_admin_volunteers(request, volunteer_id=None):
    admin_user = require_staff_api(request)
    if isinstance(admin_user, Response):
        return admin_user

    if request.method == "GET":
        volunteers = scoped_volunteers_queryset(admin_user).order_by("-created_at")
        filter_set = VolunteerFilter(request.GET, queryset=volunteers)
        if filter_set.is_valid():
            volunteers = filter_set.qs
        return Response(PublicVolunteerSerializer(volunteers, many=True).data)

    if is_platform_admin(admin_user):
        return Response({"detail": "Platform admin is view-only for volunteer operations."}, status=403)

    volunteer = get_object_or_404(scoped_volunteers_queryset(admin_user), id=volunteer_id)

    if request.method == "DELETE":
        volunteer.delete()
        log_admin_action(request, admin_user, "volunteer.delete", "Volunteer", volunteer_id, f"Deleted {volunteer.name}")
        return Response({"message": "Volunteer deleted successfully."})

    if "action" in request.data:
        serializer = AdminVolunteerActionSerializer(data=request.data)
        if serializer.is_valid():
            action = serializer.validated_data["action"]
            volunteer.is_verified = action == "verify"
            volunteer.save(update_fields=["is_verified"])
            log_admin_action(request, admin_user, f"volunteer.{action}", "Volunteer", volunteer.id, f"{action} {volunteer.name}")
            if action == "verify":
                create_notification(
                    volunteer,
                    "Account Verified! ✅",
                    "Your volunteer account has been verified. You can now register for events and earn certificates.",
                    notification_type="verification",
                    link="/dashboard",
                )
            return Response({"message": "Volunteer status updated."})
        return Response(serializer.errors, status=400)

    serializer = AdminVolunteerManageSerializer(volunteer, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response({"message": "Volunteer updated successfully.", "volunteer": VolunteerSerializer(volunteer).data})
    return Response(serializer.errors, status=400)

