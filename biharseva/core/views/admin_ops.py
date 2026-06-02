"""Admin CRUD operations — dashboard, reports, volunteers, events, certificates."""
import threading
import uuid
from decimal import Decimal

from django.conf import settings
from django.db.models import Q, Count
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response

from ..models import (
    Certificate,
    College,
    Event,
    EventRegistration,
    NSSUnit,
    ProgramOfficer,
    Report,
    Volunteer,
    VolunteerHours,
)
from ..serializers import (
    AdminAttendanceSerializer,
    AdminCertificateManageSerializer,
    AdminEventCreateSerializer,
    AdminEventManageSerializer,
    AdminReportManageSerializer,
    AdminReportStatusSerializer,
    AdminVolunteerActionSerializer,
    AdminVolunteerManageSerializer,
    EventRegistrationAdminSerializer,
    EventSerializer,
    NSSUnitSerializer,
    ReportSerializer,
    VolunteerSerializer,
)
from .certificates import build_certificate_pdf_response
from .helpers import (
    award_badges_for_volunteer,
    create_notification,
    ensure_college_admin_owns_unit,
    is_platform_admin,
    log_admin_action,
    logger,
    require_staff_api,
    scoped_certificates_queryset,
    scoped_events_queryset,
    scoped_volunteers_queryset,
    send_event_announcement_email,
    send_new_certificate_email,
)


@api_view(["GET"])
def api_admin_dashboard(request):
    admin_user = require_staff_api(request)
    if isinstance(admin_user, Response):
        return admin_user

    volunteers_qs = scoped_volunteers_queryset(admin_user)
    events_qs = scoped_events_queryset(admin_user)
    certificates_qs = scoped_certificates_queryset(admin_user)
    stats = {
        "total_reports": Report.objects.count(),
        "cleaned_reports": Report.objects.filter(status="cleaned").count(),
        "total_volunteers": volunteers_qs.count(),
        "verified_volunteers": volunteers_qs.filter(is_verified=True).count(),
        "total_events": events_qs.count(),
        "total_certificates": certificates_qs.count(),
    }

    if is_platform_admin(admin_user):
        colleges_qs = College.objects.all().order_by("name")
    else:
        colleges_qs = College.objects.filter(id=admin_user.admin_college_id)

    colleges_overview = []
    for college in colleges_qs:
        college_volunteers = Volunteer.objects.filter(Q(college=college) | Q(nss_unit__college=college)).distinct()
        college_events = Event.objects.filter(nss_unit__college=college).distinct()
        college_certificates = Certificate.objects.filter(
            Q(event__nss_unit__college=college)
            | Q(volunteer__college=college)
            | Q(volunteer__nss_unit__college=college)
        ).distinct()
        college_officers = ProgramOfficer.objects.filter(nss_unit__college=college).order_by("name")

        colleges_overview.append(
            {
                "college_id": college.id,
                "college_name": college.name,
                "district": college.district,
                "nss_units": NSSUnit.objects.filter(college=college).count(),
                "program_officers": college_officers.count(),
                "events": college_events.count(),
                "volunteers": college_volunteers.count(),
                "certificates": college_certificates.count(),
                "officer_names": list(college_officers.values_list("name", flat=True)[:5]),
            }
        )

    return Response(
        {
            "stats": stats,
            "colleges_overview": colleges_overview,
            "admin_context": {
                "role": admin_user.admin_role,
                "college_id": admin_user.admin_college_id,
                "college_name": admin_user.admin_college.name if admin_user.admin_college else None,
            },
        }
    )


@api_view(["GET", "PATCH", "DELETE"])
def api_admin_reports(request, report_id=None):
    admin_user = require_staff_api(request)
    if isinstance(admin_user, Response):
        return admin_user

    if request.method == "GET":
        reports = Report.objects.all().order_by("-created_at")
        return Response(ReportSerializer(reports, many=True, context={"request": request}).data)

    report = get_object_or_404(Report, id=report_id)

    if request.method == "DELETE":
        report.delete()
        log_admin_action(request, admin_user, "report.delete", "Report", report_id, f"Deleted report at {report.location}")
        return Response({"message": "Report deleted successfully."})

    if len(request.data.keys()) == 1 and "status" in request.data:
        serializer = AdminReportStatusSerializer(data=request.data)
        if serializer.is_valid():
            report.status = serializer.validated_data["status"]
            report.save(update_fields=["status"])
            log_admin_action(request, admin_user, "report.update_status", "Report", report.id, f"Updated report status to: {report.status}")
            return Response({"message": f"Report status updated to {report.status}."})
        return Response(serializer.errors, status=400)

    serializer = AdminReportManageSerializer(report, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        log_admin_action(request, admin_user, "report.update", "Report", report.id, "Updated report details")
        return Response({"message": "Report updated successfully."})
    return Response(serializer.errors, status=400)


@api_view(["GET", "PATCH", "DELETE"])
def api_admin_volunteers(request, volunteer_id=None):
    admin_user = require_staff_api(request)
    if isinstance(admin_user, Response):
        return admin_user

    if request.method == "GET":
        volunteers = scoped_volunteers_queryset(admin_user).order_by("-created_at")
        return Response(VolunteerSerializer(volunteers, many=True).data)

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
            # Notify volunteer about verification status change
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


@api_view(["GET", "POST"])
def api_admin_events(request):
    admin_user = require_staff_api(request)
    if isinstance(admin_user, Response):
        return admin_user

    if request.method == "GET":
        events = scoped_events_queryset(admin_user).order_by("-date")
        return Response(EventSerializer(events, many=True).data)

    if is_platform_admin(admin_user):
        return Response({"detail": "Platform admin is view-only for event operations."}, status=403)

    serializer = AdminEventCreateSerializer(data=request.data)
    if serializer.is_valid():
        unit = serializer.validated_data.get("nss_unit")
        if not unit and not is_platform_admin(admin_user):
            return Response({"detail": "nss_unit is required for college admin event creation."}, status=400)
        unit_error = ensure_college_admin_owns_unit(admin_user, unit)
        if unit_error:
            return unit_error

        event = serializer.save()
        log_admin_action(request, admin_user, "event.create", "Event", event.id, f"Created: {event.title}")

        notify_verified_only = getattr(settings, "EVENT_ANNOUNCEMENT_VERIFIED_ONLY", False)
        volunteer_qs = Volunteer.objects.filter(is_verified=True) if notify_verified_only else Volunteer.objects.all()
        recipients = [email for email in volunteer_qs.values_list("email", flat=True) if email]

        try:
            threading.Thread(target=send_event_announcement_email, args=(recipients, event), daemon=True).start()
        except Exception:
            pass

        return Response({"message": "Event created successfully!"}, status=201)
    return Response(serializer.errors, status=400)


@api_view(["PATCH", "DELETE"])
def api_admin_event_detail(request, event_id):
    admin_user = require_staff_api(request)
    if isinstance(admin_user, Response):
        return admin_user

    event = get_object_or_404(scoped_events_queryset(admin_user), id=event_id)

    if is_platform_admin(admin_user):
        return Response({"detail": "Platform admin is view-only for event operations."}, status=403)

    if request.method == "DELETE":
        event.delete()
        log_admin_action(request, admin_user, "event.delete", "Event", event_id, f"Deleted event: {event.title}")
        return Response({"message": "Event deleted successfully."})

    serializer = AdminEventManageSerializer(event, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        log_admin_action(request, admin_user, "event.update", "Event", event.id, f"Updated event: {event.title}")
        return Response({"message": "Event updated successfully.", "event": EventSerializer(event).data})
    return Response(serializer.errors, status=400)


@api_view(["GET", "PATCH"])
def api_admin_event_attendance(request, event_id, registration_id=None):
    admin_user = require_staff_api(request)
    if isinstance(admin_user, Response):
        return admin_user

    event = get_object_or_404(scoped_events_queryset(admin_user), id=event_id)

    if request.method == "GET":
        registrations = EventRegistration.objects.filter(event=event).select_related("volunteer")
        if not is_platform_admin(admin_user):
            registrations = registrations.filter(
                Q(volunteer__college=admin_user.admin_college)
                | Q(volunteer__nss_unit__college=admin_user.admin_college)
            )
        return Response(
            {
                "event": EventSerializer(event).data,
                "registrations": EventRegistrationAdminSerializer(registrations, many=True).data,
            }
        )

    if is_platform_admin(admin_user):
        return Response({"detail": "Platform admin is view-only for attendance updates."}, status=403)

    registration_qs = EventRegistration.objects.filter(event=event)
    if not is_platform_admin(admin_user):
        registration_qs = registration_qs.filter(
            Q(volunteer__college=admin_user.admin_college)
            | Q(volunteer__nss_unit__college=admin_user.admin_college)
        )
    registration = get_object_or_404(registration_qs, id=registration_id)
    serializer = AdminAttendanceSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)

    registration.attended = serializer.validated_data["attended"]
    registration.save(update_fields=["attended"])

    if registration.attended and registration.volunteer.is_verified:
        # Mark volunteer as participated
        registration.volunteer.has_participated = True
        update_fields = ["has_participated"]

        hour_entry, hour_created = VolunteerHours.objects.get_or_create(
            volunteer=registration.volunteer,
            event=event,
            defaults={
                "hours": event.hours_per_volunteer,
                "recorded_by": admin_user.username,
            },
        )
        if hour_created:
            registration.volunteer.total_hours = (registration.volunteer.total_hours or Decimal("0.00")) + hour_entry.hours
            update_fields.append("total_hours")

        registration.volunteer.save(update_fields=update_fields)
        award_badges_for_volunteer(registration.volunteer)

        certificate, created = Certificate.objects.get_or_create(
            volunteer=registration.volunteer,
            event=event,
            defaults={"certificate_id": "BS-" + str(uuid.uuid4())[:8].upper()},
        )
        if created:
            # Notify volunteer about new certificate
            create_notification(
                registration.volunteer,
                f"Certificate Issued: {event.title} 🎓",
                f"You've earned a certificate (ID: {certificate.certificate_id}) for participating in '{event.title}'.",
                notification_type="certificate",
                link="/dashboard",
            )
            try:
                send_new_certificate_email(
                    registration.volunteer.email,
                    registration.volunteer.name,
                    certificate.certificate_id,
                    event.title,
                    certificate.issued_date,
                    certificate.id,
                )
            except Exception:
                logger.exception("Failed to send certificate email for certificate id %s", certificate.id)

    # Log the admin action
    log_admin_action(
        request, admin_user, "attendance.mark", "EventRegistration",
        registration.id, f"Marked {'attended' if registration.attended else 'absent'} for {registration.volunteer.name} at {event.title}"
    )

    return Response({"message": "Attendance updated successfully."})


@api_view(["GET", "POST"])
def api_admin_certificates(request):
    admin_user = require_staff_api(request)
    if isinstance(admin_user, Response):
        return admin_user

    if request.method == "POST":
        if is_platform_admin(admin_user):
            return Response({"detail": "Platform admin is view-only for certificate operations."}, status=403)

        serializer = AdminCertificateManageSerializer(data=request.data)
        if serializer.is_valid():
            if not is_platform_admin(admin_user):
                volunteer = serializer.validated_data.get("volunteer")
                event = serializer.validated_data.get("event")
                college = admin_user.admin_college
                volunteer_ok = volunteer and (volunteer.college_id == college.id or (volunteer.nss_unit and volunteer.nss_unit.college_id == college.id))
                event_ok = event and event.nss_unit and event.nss_unit.college_id == college.id
                if not (volunteer_ok and event_ok):
                    return Response({"detail": "Volunteer and event must belong to your college."}, status=403)

            certificate = serializer.save()
            
            # Send in-app notification to volunteer
            create_notification(
                certificate.volunteer,
                f"Certificate Issued: {certificate.event.title} 🎓",
                f"You've earned a certificate (ID: {certificate.certificate_id}) for participating in '{certificate.event.title}'.",
                notification_type="certificate",
                link="/dashboard",
            )
            
            # Log admin action
            log_admin_action(
                request, admin_user, "certificate.create", "Certificate",
                certificate.id, f"Issued certificate {certificate.certificate_id} to {certificate.volunteer.name}"
            )

            try:
                send_new_certificate_email(
                    certificate.volunteer.email,
                    certificate.volunteer.name,
                    certificate.certificate_id,
                    certificate.event.title,
                    certificate.issued_date,
                    certificate.id,
                )
            except Exception:
                logger.exception("Failed to send certificate email for certificate id %s", certificate.id)
            return Response({"message": "Certificate created successfully."}, status=201)
        return Response(serializer.errors, status=400)

    certificates = scoped_certificates_queryset(admin_user).order_by("-issued_date")
    payload = []
    for cert in certificates:
        payload.append(
            {
                "id": cert.id,
                "certificate_id": cert.certificate_id,
                "issued_date": cert.issued_date,
                "volunteer": VolunteerSerializer(cert.volunteer).data,
                "event": EventSerializer(cert.event).data,
            }
        )
    return Response(payload)


@api_view(["PATCH", "DELETE"])
def api_admin_certificate_detail(request, certificate_id):
    admin_user = require_staff_api(request)
    if isinstance(admin_user, Response):
        return admin_user

    certificate = get_object_or_404(scoped_certificates_queryset(admin_user), id=certificate_id)

    if is_platform_admin(admin_user):
        return Response({"detail": "Platform admin is view-only for certificate operations."}, status=403)

    if request.method == "DELETE":
        certificate.delete()
        log_admin_action(request, admin_user, "certificate.delete", "Certificate", certificate_id, f"Deleted certificate {certificate.certificate_id} for {certificate.volunteer.name}")
        return Response({"message": "Certificate deleted successfully."})

    serializer = AdminCertificateManageSerializer(certificate, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        log_admin_action(request, admin_user, "certificate.update", "Certificate", certificate.id, f"Updated certificate {certificate.certificate_id} details")
        return Response({"message": "Certificate updated successfully."})
    return Response(serializer.errors, status=400)


@api_view(["GET"])
def api_admin_certificate_view(request, certificate_id):
    admin_user = require_staff_api(request)
    if isinstance(admin_user, Response):
        return admin_user

    certificate = get_object_or_404(scoped_certificates_queryset(admin_user), id=certificate_id)
    return build_certificate_pdf_response(certificate, as_attachment=False)


@api_view(["GET"])
def api_admin_audit_logs(request):
    """Retrieve audit logs for platform admin with search and pagination."""
    admin_user = require_staff_api(request)
    if isinstance(admin_user, Response):
        return admin_user
    if not is_platform_admin(admin_user):
        return Response({"detail": "Only platform admin can view audit logs."}, status=403)

    from django.core.paginator import Paginator
    from ..models import AuditLog

    logs = AuditLog.objects.select_related("admin_user").order_by("-created_at")

    action = request.query_params.get("action", "").strip()
    if action:
        logs = logs.filter(action__icontains=action)

    admin_username = request.query_params.get("admin_user", "").strip()
    if admin_username:
        logs = logs.filter(admin_user__username__icontains=admin_username)

    page_number = request.query_params.get("page", 1)
    page_size = request.query_params.get("page_size", 50)
    
    paginator = Paginator(logs, page_size)
    try:
        page_obj = paginator.page(page_number)
    except Exception:
        return Response({"detail": "Invalid page number."}, status=400)

    data = []
    for log in page_obj:
        data.append({
            "id": log.id,
            "admin_user": log.admin_user.username if log.admin_user else "Unknown",
            "action": log.action,
            "target_model": log.target_model,
            "target_id": log.target_id,
            "details": log.details,
            "ip_address": log.ip_address,
            "created_at": log.created_at.isoformat(),
        })

    return Response({
        "results": data,
        "count": paginator.count,
        "num_pages": paginator.num_pages,
        "current_page": page_obj.number,
        "has_next": page_obj.has_next(),
        "has_previous": page_obj.has_previous(),
    })
