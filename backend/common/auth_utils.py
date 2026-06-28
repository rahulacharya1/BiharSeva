from datetime import datetime, timedelta, timezone
import hashlib

import jwt
from django.conf import settings
from django.contrib.auth import get_user_model

from authentication.models import Volunteer, BlacklistedToken

ACCESS_TOKEN_EXPIRY_MINUTES = 30
REFRESH_TOKEN_EXPIRY_MINUTES = 7 * 24 * 60  # 7 days


def issue_token(payload, expires_minutes=120):
    now = datetime.now(timezone.utc)
    claims = {
        **payload,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=expires_minutes)).timestamp()),
    }
    return jwt.encode(claims, settings.SECRET_KEY, algorithm="HS256")


def issue_token_pair(payload):
    """Issue an access + refresh token pair."""
    access_payload = {**payload, "token_type": "access"}
    refresh_payload = {**payload, "token_type": "refresh"}
    access_token = issue_token(access_payload, expires_minutes=ACCESS_TOKEN_EXPIRY_MINUTES)
    refresh_token = issue_token(refresh_payload, expires_minutes=REFRESH_TOKEN_EXPIRY_MINUTES)
    return {"access_token": access_token, "refresh_token": refresh_token}


def refresh_access_token(refresh_token_str):
    """Validate a refresh token and return a new access token, or None on failure."""
    try:
        payload = decode_token(refresh_token_str)
    except jwt.InvalidTokenError:
        return None

    if payload.get("token_type") != "refresh":
        return None

    # Strip token metadata and reissue
    new_payload = {k: v for k, v in payload.items() if k not in ("iat", "exp", "token_type")}
    new_payload["token_type"] = "access"
    return issue_token(new_payload, expires_minutes=ACCESS_TOKEN_EXPIRY_MINUTES)


def decode_token(token):
    if is_token_blacklisted(token):
        raise jwt.InvalidTokenError("Token has been blacklisted (logged out).")
    return jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])


def extract_bearer_token(request):
    # Check httpOnly cookie first
    token = request.COOKIES.get("access_token")
    if token:
        return token

    # Fallback to Authorization header
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    return auth_header.split(" ", 1)[1].strip()


def get_volunteer_from_request(request):
    token = extract_bearer_token(request)
    if not token:
        return None

    try:
        payload = decode_token(token)
    except jwt.InvalidTokenError:
        return None

    if payload.get("role") != "volunteer":
        return None

    volunteer_id = payload.get("volunteer_id")
    if not volunteer_id:
        return None

    return Volunteer.objects.filter(id=volunteer_id, is_verified=True).first()


def get_admin_from_request(request):
    token = extract_bearer_token(request)
    if not token:
        return None

    try:
        payload = decode_token(token)
    except jwt.InvalidTokenError:
        return None

    if payload.get("role") != "admin":
        return None

    user_id = payload.get("user_id")
    if not user_id:
        return None

    User = get_user_model()
    return User.objects.filter(id=user_id, is_staff=True, is_active=True).first()


def hash_token(token_str):
    return hashlib.sha256(token_str.encode()).hexdigest()


def is_token_blacklisted(token_str):
    if not token_str:
        return False
    h = hash_token(token_str)
    return BlacklistedToken.objects.filter(token_hash=h).exists()


def blacklist_token(token_str):
    if not token_str:
        return
    try:
        payload = jwt.decode(token_str, options={"verify_signature": False})
        exp = payload.get("exp")
        if exp:
            expires_at = datetime.fromtimestamp(exp, tz=timezone.utc)
        else:
            expires_at = datetime.now(timezone.utc) + timedelta(days=1)
    except Exception:
        expires_at = datetime.now(timezone.utc) + timedelta(days=1)

    h = hash_token(token_str)
    BlacklistedToken.objects.get_or_create(token_hash=h, defaults={"expires_at": expires_at})


def set_auth_cookies(response, tokens):
    response.set_cookie(
        key="access_token",
        value=tokens["access_token"],
        max_age=30 * 60,
        httponly=True,
        secure=not settings.DEBUG,
        samesite="Lax",
    )
    response.set_cookie(
        key="refresh_token",
        value=tokens["refresh_token"],
        max_age=7 * 24 * 60 * 60,
        httponly=True,
        secure=not settings.DEBUG,
        samesite="Lax",
    )


def delete_auth_cookies(response):
    response.delete_cookie("access_token", samesite="Lax")
    response.delete_cookie("refresh_token", samesite="Lax")
