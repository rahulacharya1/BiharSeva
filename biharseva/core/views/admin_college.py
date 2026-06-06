"""Admin college infrastructure views — colleges, NSS units, officers."""
import secrets
import threading
from decimal import Decimal

from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Count, Sum
from django.db.models.functions import TruncMonth
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response

from ..models import (
    AdminProfile,
    College,
    NSSUnit,
    ProgramOfficer,
    Volunteer,
)
from ..serializers import (
    CollegeSerializer,
    NSSUnitSerializer,
    ProgramOfficerSerializer,
)
from .helpers import (
    ensure_college_admin_owns_unit,
    is_platform_admin,
    require_staff_api,
    scoped_officers_queryset,
    scoped_units_queryset,
    send_admin_invite_email,
)


@api_view(["GET", "POST"])
def api_admin_colleges(request):
    admin_user = require_staff_api(request)
    if isinstance(admin_user, Response):
        return admin_user

    if request.method == "GET":
        if is_platform_admin(admin_user):
            colleges = College.objects.all().order_by("name")
        else:
            colleges = College.objects.filter(id=admin_user.admin_college_id)
        return Response(CollegeSerializer(colleges, many=True).data)

    if not is_platform_admin(admin_user):
        return Response({"detail": "Only platform admin can create colleges."}, status=403)

    payload = request.data.copy()
    admin_username = (payload.pop("admin_username", "") or "").strip()
    admin_email = (payload.pop("admin_email", "") or "").strip().lower()

    if admin_email:
        from django.core.validators import validate_email
        from django.core.exceptions import ValidationError
        try:
            validate_email(admin_email)
        except ValidationError:
            return Response({"detail": "Enter a valid college admin email address."}, status=400)

    serializer = CollegeSerializer(data=payload)
    if serializer.is_valid():
        with transaction.atomic():
            college = serializer.save()
            created_admin = None
            temp_password = None

            if admin_username or admin_email:
                if not admin_username:
                    return Response({"detail": "admin_username is required to provision college admin."}, status=400)
                User = get_user_model()
                if User.objects.filter(username=admin_username).exists():
                    return Response({"detail": "Admin username already exists."}, status=400)

                temp_password = secrets.token_urlsafe(10)

                created_admin = User.objects.create_user(
                    username=admin_username,
                    email=admin_email,
                    password=temp_password,
                    is_staff=True,
                    is_active=True,
                )
                AdminProfile.objects.create(user=created_admin, role="college_admin", college=college)

                if admin_email:
                    try:
                        threading.Thread(
                            target=send_admin_invite_email,
                            args=(admin_email, admin_username, temp_password, college.name),
                            daemon=True,
                        ).start()
                    except Exception:
                        pass

        return Response(
            {
                "message": "College created successfully.",
                "college": serializer.data,
                "college_admin": {
                    "username": created_admin.username,
                    "email": created_admin.email,
                    "role": "college_admin",
                    "college_id": college.id,
                    "temporary_password": temp_password,
                }
                if created_admin
                else None,
            },
            status=201,
        )
    return Response(serializer.errors, status=400)


@api_view(["PATCH", "DELETE"])
def api_admin_college_detail(request, college_id):
    admin_user = require_staff_api(request, allowed_roles=["platform_admin"])
    if isinstance(admin_user, Response):
        return admin_user
    return Response({"detail": "Platform admin can create and view colleges only."}, status=403)


@api_view(["GET", "POST"])
def api_admin_nss_units(request):
    admin_user = require_staff_api(request)
    if isinstance(admin_user, Response):
        return admin_user

    if request.method == "GET":
        units = scoped_units_queryset(admin_user).order_by("college__name", "unit_number")
        return Response(NSSUnitSerializer(units, many=True).data)

    if is_platform_admin(admin_user):
        return Response({"detail": "Platform admin is view-only for NSS unit operations."}, status=403)

    serializer = NSSUnitSerializer(data=request.data)
    if serializer.is_valid():
        if not is_platform_admin(admin_user):
            unit_college = serializer.validated_data.get("college")
            if not unit_college or unit_college.id != admin_user.admin_college_id:
                return Response({"detail": "You can create units only for your assigned college."}, status=403)
        serializer.save()
        return Response({"message": "NSS unit created successfully.", "nss_unit": serializer.data}, status=201)
    return Response(serializer.errors, status=400)


@api_view(["PATCH", "DELETE"])
def api_admin_nss_unit_detail(request, unit_id):
    admin_user = require_staff_api(request)
    if isinstance(admin_user, Response):
        return admin_user

    unit = get_object_or_404(scoped_units_queryset(admin_user), id=unit_id)

    if is_platform_admin(admin_user):
        return Response({"detail": "Platform admin is view-only for NSS unit operations."}, status=403)
    if request.method == "DELETE":
        unit.delete()
        return Response({"message": "NSS unit deleted successfully."})

    serializer = NSSUnitSerializer(unit, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response({"message": "NSS unit updated successfully.", "nss_unit": serializer.data})
    return Response(serializer.errors, status=400)


@api_view(["GET", "POST"])
def api_admin_program_officers(request):
    admin_user = require_staff_api(request)
    if isinstance(admin_user, Response):
        return admin_user

    if request.method == "GET":
        officers = scoped_officers_queryset(admin_user).order_by("name")
        return Response(ProgramOfficerSerializer(officers, many=True).data)

    if is_platform_admin(admin_user):
        return Response({"detail": "Platform admin is view-only for program officer operations."}, status=403)

    serializer = ProgramOfficerSerializer(data=request.data)
    if serializer.is_valid():
        unit = serializer.validated_data.get("nss_unit")
        unit_error = ensure_college_admin_owns_unit(admin_user, unit)
        if unit_error:
            return unit_error
        serializer.save()
        return Response({"message": "Program officer created successfully.", "officer": serializer.data}, status=201)
    return Response(serializer.errors, status=400)


@api_view(["PATCH", "DELETE"])
def api_admin_program_officer_detail(request, officer_id):
    admin_user = require_staff_api(request)
    if isinstance(admin_user, Response):
        return admin_user

    officer = get_object_or_404(scoped_officers_queryset(admin_user), id=officer_id)

    if is_platform_admin(admin_user):
        return Response({"detail": "Platform admin is view-only for program officer operations."}, status=403)
    if request.method == "DELETE":
        officer.delete()
        return Response({"message": "Program officer deleted successfully."})

    serializer = ProgramOfficerSerializer(officer, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response({"message": "Program officer updated successfully.", "officer": serializer.data})
    return Response(serializer.errors, status=400)



