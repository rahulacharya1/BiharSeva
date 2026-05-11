"""Admin college infrastructure views — colleges, NSS units, officers, proposals, hours, badges, analytics."""
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
    ActivityProposal,
    Badge,
    College,
    Event,
    EventRegistration,
    NSSUnit,
    ProgramOfficer,
    Volunteer,
    VolunteerHours,
)
from ..serializers import (
    ActivityProposalSerializer,
    BadgeSerializer,
    CollegeSerializer,
    NSSUnitSerializer,
    ProgramOfficerSerializer,
    VolunteerHoursSerializer,
)
from .helpers import (
    award_badges_for_volunteer,
    ensure_college_admin_owns_unit,
    is_platform_admin,
    require_staff_api,
    scoped_badges_queryset,
    scoped_events_queryset,
    scoped_hours_queryset,
    scoped_officers_queryset,
    scoped_proposals_queryset,
    scoped_units_queryset,
    scoped_volunteers_queryset,
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


@api_view(["GET", "POST"])
def api_admin_activity_proposals(request):
    admin_user = require_staff_api(request)
    if isinstance(admin_user, Response):
        return admin_user

    if request.method == "GET":
        proposals = scoped_proposals_queryset(admin_user).order_by("-created_at")
        return Response(ActivityProposalSerializer(proposals, many=True).data)

    if is_platform_admin(admin_user):
        return Response({"detail": "Platform admin is view-only for proposal operations."}, status=403)

    serializer = ActivityProposalSerializer(data=request.data)
    if serializer.is_valid():
        unit = serializer.validated_data.get("nss_unit")
        unit_error = ensure_college_admin_owns_unit(admin_user, unit)
        if unit_error:
            return unit_error
        serializer.save()
        return Response({"message": "Activity proposal created successfully.", "proposal": serializer.data}, status=201)
    return Response(serializer.errors, status=400)


@api_view(["PATCH", "DELETE"])
def api_admin_activity_proposal_detail(request, proposal_id):
    admin_user = require_staff_api(request)
    if isinstance(admin_user, Response):
        return admin_user

    proposal = get_object_or_404(scoped_proposals_queryset(admin_user), id=proposal_id)

    if is_platform_admin(admin_user):
        return Response({"detail": "Platform admin is view-only for proposal operations."}, status=403)
    if request.method == "DELETE":
        proposal.delete()
        return Response({"message": "Activity proposal deleted successfully."})

    serializer = ActivityProposalSerializer(proposal, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response({"message": "Activity proposal updated successfully.", "proposal": serializer.data})
    return Response(serializer.errors, status=400)


@api_view(["GET", "POST"])
def api_admin_volunteer_hours(request):
    admin_user = require_staff_api(request)
    if isinstance(admin_user, Response):
        return admin_user

    if request.method == "GET":
        qs = scoped_hours_queryset(admin_user).order_by("-recorded_at")
        volunteer_id = request.query_params.get("volunteer_id")
        event_id = request.query_params.get("event_id")
        if volunteer_id:
            qs = qs.filter(volunteer_id=volunteer_id)
        if event_id:
            qs = qs.filter(event_id=event_id)

        summary = {
            "total_records": qs.count(),
            "total_hours": float(qs.aggregate(total=Sum("hours"))["total"] or 0),
        }
        return Response({"summary": summary, "records": VolunteerHoursSerializer(qs, many=True).data})

    if is_platform_admin(admin_user):
        return Response({"detail": "Platform admin is view-only for volunteer hour operations."}, status=403)

    serializer = VolunteerHoursSerializer(data=request.data)
    if serializer.is_valid():
        volunteer = serializer.validated_data.get("volunteer")
        event = serializer.validated_data.get("event")
        if not is_platform_admin(admin_user):
            college = admin_user.admin_college
            volunteer_ok = volunteer and (volunteer.college_id == college.id or (volunteer.nss_unit and volunteer.nss_unit.college_id == college.id))
            event_ok = event and event.nss_unit and event.nss_unit.college_id == college.id
            if not (volunteer_ok and event_ok):
                return Response({"detail": "Volunteer and event must belong to your college."}, status=403)

        hour_record = serializer.save(recorded_by=admin_user.username)
        volunteer = hour_record.volunteer
        volunteer.total_hours = (volunteer.total_hours or Decimal("0.00")) + hour_record.hours
        volunteer.save(update_fields=["total_hours"])
        award_badges_for_volunteer(volunteer)
        return Response({"message": "Volunteer hours recorded successfully.", "record": VolunteerHoursSerializer(hour_record).data}, status=201)
    return Response(serializer.errors, status=400)


@api_view(["PATCH", "DELETE"])
def api_admin_volunteer_hour_detail(request, record_id):
    admin_user = require_staff_api(request)
    if isinstance(admin_user, Response):
        return admin_user

    hour_record = get_object_or_404(scoped_hours_queryset(admin_user), id=record_id)
    volunteer = hour_record.volunteer

    if is_platform_admin(admin_user):
        return Response({"detail": "Platform admin is view-only for volunteer hour operations."}, status=403)

    if request.method == "DELETE":
        volunteer.total_hours = max(Decimal("0.00"), (volunteer.total_hours or Decimal("0.00")) - hour_record.hours)
        volunteer.save(update_fields=["total_hours"])
        hour_record.delete()
        return Response({"message": "Hour record deleted successfully."})

    old_hours = hour_record.hours
    serializer = VolunteerHoursSerializer(hour_record, data=request.data, partial=True)
    if serializer.is_valid():
        updated_record = serializer.save(recorded_by=admin_user.username)
        delta = updated_record.hours - old_hours
        volunteer.total_hours = max(Decimal("0.00"), (volunteer.total_hours or Decimal("0.00")) + delta)
        volunteer.save(update_fields=["total_hours"])
        award_badges_for_volunteer(volunteer)
        return Response({"message": "Hour record updated successfully.", "record": VolunteerHoursSerializer(updated_record).data})
    return Response(serializer.errors, status=400)


@api_view(["GET", "POST"])
def api_admin_badges(request):
    admin_user = require_staff_api(request)
    if isinstance(admin_user, Response):
        return admin_user

    if request.method == "GET":
        badges = scoped_badges_queryset(admin_user).order_by("-earned_date")
        return Response(BadgeSerializer(badges, many=True).data)

    if is_platform_admin(admin_user):
        return Response({"detail": "Platform admin is view-only for badge operations."}, status=403)

    serializer = BadgeSerializer(data=request.data)
    if serializer.is_valid():
        volunteer = serializer.validated_data.get("volunteer")
        if not is_platform_admin(admin_user):
            college = admin_user.admin_college
            volunteer_ok = volunteer and (volunteer.college_id == college.id or (volunteer.nss_unit and volunteer.nss_unit.college_id == college.id))
            if not volunteer_ok:
                return Response({"detail": "You can award badges only to volunteers in your college."}, status=403)
        serializer.save()
        return Response({"message": "Badge awarded successfully.", "badge": serializer.data}, status=201)
    return Response(serializer.errors, status=400)


@api_view(["PATCH", "DELETE"])
def api_admin_badge_detail(request, badge_id):
    admin_user = require_staff_api(request)
    if isinstance(admin_user, Response):
        return admin_user

    badge = get_object_or_404(scoped_badges_queryset(admin_user), id=badge_id)

    if is_platform_admin(admin_user):
        return Response({"detail": "Platform admin is view-only for badge operations."}, status=403)
    if request.method == "DELETE":
        badge.delete()
        return Response({"message": "Badge deleted successfully."})

    serializer = BadgeSerializer(badge, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response({"message": "Badge updated successfully.", "badge": serializer.data})
    return Response(serializer.errors, status=400)


@api_view(["GET"])
def api_admin_coordinator_dashboard(request):
    admin_user = require_staff_api(request)
    if isinstance(admin_user, Response):
        return admin_user

    officer_id = request.query_params.get("officer_id")
    unit_id = request.query_params.get("unit_id")

    if officer_id:
        officer = get_object_or_404(scoped_officers_queryset(admin_user), id=officer_id)
        unit = officer.nss_unit
    elif unit_id:
        officer = None
        unit = get_object_or_404(scoped_units_queryset(admin_user), id=unit_id)
    else:
        return Response({"detail": "officer_id or unit_id query parameter is required."}, status=400)

    members_qs = Volunteer.objects.filter(nss_unit=unit)
    events_qs = Event.objects.filter(nss_unit=unit)
    proposals_qs = ActivityProposal.objects.filter(nss_unit=unit)
    hours_qs = VolunteerHours.objects.filter(volunteer__nss_unit=unit)

    top_members = members_qs.order_by("-total_hours", "name")[:5]
    recent_events = events_qs.order_by("-date")[:5]

    proposal_status = {
        "draft": proposals_qs.filter(status="draft").count(),
        "submitted": proposals_qs.filter(status="submitted").count(),
        "approved": proposals_qs.filter(status="approved").count(),
        "rejected": proposals_qs.filter(status="rejected").count(),
        "completed": proposals_qs.filter(status="completed").count(),
    }

    response_data = {
        "coordinator": {
            "officer_id": officer.id if officer else None,
            "officer_name": officer.name if officer else None,
            "unit_id": unit.id,
            "unit_number": unit.unit_number,
            "unit_name": unit.name,
            "college": unit.college.name,
        },
        "stats": {
            "total_members": members_qs.count(),
            "verified_members": members_qs.filter(is_verified=True).count(),
            "total_events": events_qs.count(),
            "completed_events": events_qs.filter(is_completed=True).count(),
            "active_events": events_qs.filter(is_completed=False).count(),
            "total_proposals": proposals_qs.count(),
            "proposal_status": proposal_status,
            "total_service_hours": float(hours_qs.aggregate(total=Sum("hours"))["total"] or 0),
            "badges_awarded": Badge.objects.filter(volunteer__nss_unit=unit).count(),
        },
        "top_members": [
            {
                "id": v.id,
                "name": v.name,
                "district": v.district,
                "total_hours": float(v.total_hours or 0),
                "badges": v.badges.count(),
            }
            for v in top_members
        ],
        "recent_events": [
            {
                "id": e.id,
                "title": e.title,
                "date": e.date,
                "activity_type": e.activity_type,
                "is_completed": e.is_completed,
                "registrations": EventRegistration.objects.filter(event=e).count(),
            }
            for e in recent_events
        ],
    }

    return Response(response_data)


@api_view(["GET"])
def api_admin_impact_analytics(request):
    admin_user = require_staff_api(request)
    if isinstance(admin_user, Response):
        return admin_user

    hours_qs = scoped_hours_queryset(admin_user)
    volunteers_qs = scoped_volunteers_queryset(admin_user)
    events_qs = scoped_events_queryset(admin_user)
    proposals_qs = scoped_proposals_queryset(admin_user)
    badges_qs = scoped_badges_queryset(admin_user)
    units_qs = scoped_units_queryset(admin_user)
    officers_qs = scoped_officers_queryset(admin_user)

    district_breakdown = list(
        hours_qs.values("volunteer__district")
        .annotate(total_hours=Sum("hours"), volunteers=Count("volunteer", distinct=True), events=Count("event", distinct=True))
        .order_by("-total_hours")
    )

    activity_breakdown = list(
        hours_qs.values("event__activity_type")
        .annotate(total_hours=Sum("hours"), volunteers=Count("volunteer", distinct=True), events=Count("event", distinct=True))
        .order_by("-total_hours")
    )

    monthly_trend = list(
        hours_qs.annotate(month=TruncMonth("recorded_at"))
        .values("month")
        .annotate(total_hours=Sum("hours"), volunteers=Count("volunteer", distinct=True), events=Count("event", distinct=True))
        .order_by("month")
    )

    unit_breakdown = list(
        units_qs.values("id", "college__name", "unit_number", "name")
        .annotate(members_count=Count("members", distinct=True), events=Count("events", distinct=True), total_hours=Sum("members__service_hours__hours"))
        .order_by("-total_hours", "college__name")
    )

    summary = {
        "total_colleges": College.objects.count() if is_platform_admin(admin_user) else 1,
        "total_units": units_qs.count(),
        "total_officers": officers_qs.filter(is_active=True).count(),
        "total_volunteers": volunteers_qs.count(),
        "verified_volunteers": volunteers_qs.filter(is_verified=True).count(),
        "total_events": events_qs.count(),
        "completed_events": events_qs.filter(is_completed=True).count(),
        "total_hours": float(hours_qs.aggregate(total=Sum("hours"))["total"] or 0),
        "total_badges": badges_qs.count(),
        "total_proposals": proposals_qs.count(),
        "approved_proposals": proposals_qs.filter(status="approved").count(),
    }

    return Response(
        {
            "summary": summary,
            "district_breakdown": district_breakdown,
            "activity_breakdown": activity_breakdown,
            "monthly_trend": monthly_trend,
            "unit_breakdown": unit_breakdown,
        }
    )
