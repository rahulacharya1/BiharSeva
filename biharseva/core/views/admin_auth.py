"""Admin authentication views — login, OTP, profile."""
import threading

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from rest_framework.decorators import api_view
from rest_framework.response import Response

from ..auth_utils import decode_token, issue_token
from ..models import AdminProfile
from ..serializers import AdminOtpRequestSerializer, AdminOtpVerifySerializer
from .helpers import (
    generate_otp,
    require_staff_api,
    send_admin_otp_email,
    send_admin_password_changed_email,
)


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

    token = issue_token(
        {
            "role": "admin",
            "user_id": user.id,
            "admin_role": admin_role,
            "admin_college_id": admin_college_id,
        },
        expires_minutes=12 * 60,
    )
    return Response(
        {
            "message": "Admin login successful.",
            "token": token,
            "username": user.username,
            "admin_role": admin_role,
            "admin_college_id": admin_college_id,
            "admin_college_name": profile.college.name if (profile and profile.college_id) else None,
        }
    )


@api_view(["POST"])
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
    otp_reset_token = issue_token(
        {"role": "admin", "purpose": "otp_reset", "email": email, "user_id": admin_user.id, "otp": otp},
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
    expected_otp = otp_payload.get("otp") or ""
    otp = serializer.validated_data["otp"]
    new_password = serializer.validated_data["new_password"]

    if otp != expected_otp:
        return Response({"detail": "Invalid OTP code."}, status=400)

    User = get_user_model()
    admin_user = User.objects.filter(id=user_id, email=email, is_staff=True, is_active=True).first()
    if not admin_user:
        return Response({"detail": "Admin account not found."}, status=404)

    admin_user.set_password(new_password)
    admin_user.save(update_fields=["password"])

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
            },
        }
    )
