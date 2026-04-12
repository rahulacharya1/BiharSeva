from datetime import datetime, timedelta, timezone

import jwt
from django.conf import settings
from django.contrib.auth import get_user_model

from .models import Volunteer


def issue_token(payload, expires_minutes=120):
    now = datetime.now(timezone.utc)
    claims = {
        **payload,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=expires_minutes)).timestamp()),
    }
    return jwt.encode(claims, settings.SECRET_KEY, algorithm="HS256")


def decode_token(token):
    return jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])


def extract_bearer_token(request):
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
