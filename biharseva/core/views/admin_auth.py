"""Admin authentication views — login, OTP, profile."""
import threading

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from rest_framework.decorators import api_view, throttle_classes
from rest_framework.response import Response

from ..auth_utils import (
    decode_token,
    issue_token,
    issue_token_pair,
    set_auth_cookies,
    delete_auth_cookies,
    blacklist_token,
)
from ..totp import generate_totp_secret, get_totp_uri, verify_totp
from ..models import AdminProfile
from ..serializers import AdminOtpRequestSerializer, AdminOtpVerifySerializer
from .helpers import (
    generate_otp,
    require_staff_api,
    send_admin_otp_email,
    send_admin_password_changed_email,
)
from .volunteer import OTPThrottle


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

    # Check if MFA is enabled
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

    # Store hashed OTP server-side in cache (NOT in the JWT)
    import hashlib
    from django.core.cache import cache

    otp_nonce = hashlib.sha256(f"{admin_user.id}:{email}:{otp}".encode()).hexdigest()[:16]
    cache_key = f"admin_otp:{otp_nonce}"
    cache.set(cache_key, {
        "otp_hash": hashlib.sha256(otp.encode()).hexdigest(),
        "user_id": admin_user.id,
        "email": email,
    }, timeout=600)  # 10 minutes

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

    # Verify OTP against server-side cache (not from JWT)
    import hashlib
    from django.core.cache import cache

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

    # Invalidate OTP after successful use
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
