import csv
import logging
import uuid
import threading
from decimal import Decimal
from io import BytesIO

from django.conf import settings
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count

from rest_framework.decorators import api_view
from rest_framework.response import Response

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas

from events.models import Event, EventRegistration, Certificate, VolunteerHours, Badge
from authentication.models import Volunteer, AdminProfile
from reports.models import Report
from colleges.models import College, NSSUnit, ProgramOfficer

from events.serializers import (
    EventSerializer,
    EventRegistrationSerializer,
    EventRegistrationAdminSerializer,
    CertificateSerializer,
    AdminAttendanceSerializer,
    AdminEventCreateSerializer,
    AdminEventManageSerializer,
    AdminCertificateManageSerializer,
)
from authentication.serializers import VolunteerSerializer
from events.filters import EventFilter

from common.views.helpers import (
    volunteer_auth_required,
    require_staff_api,
    is_platform_admin,
    scoped_events_queryset,
    scoped_volunteers_queryset,
    scoped_certificates_queryset,
    ensure_college_admin_owns_unit,
    award_badges_for_volunteer,
    create_notification,
    log_admin_action,
    send_event_announcement_email,
    send_new_certificate_email,
)

logger = logging.getLogger("events")


# ─── ReportLab Certificate Generators ───────────────────────────────

def build_certificate_pdf_bytes(certificate):
    buffer = BytesIO()
    page_size = landscape(A4)
    pdf = canvas.Canvas(buffer, pagesize=page_size)
    width, height = page_size

    pdf.setTitle(f"Certificate {certificate.certificate_id}")
    pdf.setAuthor("BiharSeva")
    pdf.setSubject("Volunteer participation certificate")

    pdf.setLineWidth(4)
    pdf.setFillColor(colors.HexColor("#059669"))
    pdf.setStrokeColor(colors.HexColor("#059669"))
    pdf.rect(1.0 * cm, 1.0 * cm, width - 2.0 * cm, height - 2.0 * cm)

    pdf.setLineWidth(1.2)
    pdf.setStrokeColor(colors.HexColor("#34d399"))
    pdf.rect(1.4 * cm, 1.4 * cm, width - 2.8 * cm, height - 2.8 * cm)

    pdf.setFont("Helvetica-Bold", 13)
    pdf.setFillColor(colors.HexColor("#059669"))
    pdf.drawCentredString(width / 2, height - 2.2 * cm, "BIHARSEVA COMMUNITY INITIATIVE")

    pdf.setFont("Helvetica-Bold", 34)
    pdf.setFillColor(colors.HexColor("#111827"))
    pdf.drawCentredString(width / 2, height - 4.2 * cm, "CERTIFICATE OF PARTICIPATION")

    pdf.setLineWidth(1.5)
    pdf.setStrokeColor(colors.HexColor("#059669"))
    pdf.line(3.0 * cm, height - 5.0 * cm, width - 3.0 * cm, height - 5.0 * cm)

    pdf.setFont("Helvetica", 14)
    pdf.setFillColor(colors.HexColor("#374151"))
    pdf.drawCentredString(width / 2, height - 6.3 * cm, "This certificate is proudly awarded to")

    pdf.setFont("Helvetica-Bold", 36)
    pdf.setFillColor(colors.HexColor("#059669"))
    pdf.drawCentredString(width / 2, height - 8.1 * cm, certificate.volunteer.name)

    pdf.setFont("Helvetica", 14)
    pdf.setFillColor(colors.HexColor("#374151"))
    pdf.drawCentredString(width / 2, height - 9.5 * cm, "for dedicated service and successful participation in")

    pdf.setFont("Helvetica-Bold", 20)
    pdf.setFillColor(colors.HexColor("#059669"))
    pdf.drawCentredString(width / 2, height - 10.8 * cm, certificate.event.title)

    pdf.setFont("Helvetica", 11)
    pdf.setFillColor(colors.HexColor("#6b7280"))
    pdf.drawCentredString(width / 2, height - 12.1 * cm, f"Event Date: {certificate.event.date.strftime('%d %B %Y')}")
    pdf.drawCentredString(width / 2, height - 12.8 * cm, f"Issued On: {certificate.issued_date.strftime('%d %B %Y')}")
    pdf.drawCentredString(width / 2, height - 13.5 * cm, f"Certificate ID: {certificate.certificate_id}")

    pdf.setLineWidth(1)
    pdf.setStrokeColor(colors.HexColor("#94a3b8"))
    left_x = width * 0.22
    right_x = width * 0.78
    sign_y = 4.8 * cm
    pdf.line(left_x - 2.3 * cm, sign_y, left_x + 2.3 * cm, sign_y)
    pdf.line(right_x - 2.3 * cm, sign_y, right_x + 2.3 * cm, sign_y)

    event_coordinator_name = getattr(certificate.event, "program_coordinator_name", "")
    left_sign_name = event_coordinator_name or getattr(settings, "CERTIFICATE_LEFT_SIGN_NAME", "A. Kumar")
    left_sign_title = getattr(settings, "CERTIFICATE_LEFT_SIGN_TITLE", "Program Coordinator")
    right_sign_name = getattr(settings, "CERTIFICATE_RIGHT_SIGN_NAME", "Admin")
    right_sign_title = getattr(settings, "CERTIFICATE_RIGHT_SIGN_TITLE", "Admin, BiharSeva")

    pdf.setFont("Times-Italic", 20)
    pdf.setFillColor(colors.HexColor("#0f766e"))
    pdf.drawCentredString(left_x, sign_y + 0.35 * cm, left_sign_name)
    pdf.drawCentredString(right_x, sign_y + 0.35 * cm, right_sign_name)

    pdf.setFont("Helvetica-Bold", 12)
    pdf.setFillColor(colors.HexColor("#1e293b"))
    pdf.drawCentredString(left_x, sign_y - 0.65 * cm, left_sign_title)
    pdf.drawCentredString(right_x, sign_y - 0.65 * cm, right_sign_title)

    pdf.setLineWidth(0.8)
    pdf.setStrokeColor(colors.HexColor("#cbd5e1"))
    pdf.line(2.0 * cm, 3.0 * cm, width - 2.0 * cm, 3.0 * cm)
    pdf.setFont("Helvetica-Oblique", 9)
    pdf.setFillColor(colors.HexColor("#64748b"))
    pdf.drawCentredString(width / 2, 2.35 * cm, "Verified digital certificate issued by BiharSeva")
    pdf.drawCentredString(width / 2, 1.9 * cm, "Authenticity can be verified using the Certificate ID")

    pdf.showPage()
    pdf.save()
    buffer.seek(0)
    return buffer.read()


def build_certificate_pdf_response(certificate, as_attachment=True):
    pdf_bytes = build_certificate_pdf_bytes(certificate)
    response = HttpResponse(pdf_bytes, content_type="application/pdf")
    disposition_type = "attachment" if as_attachment else "inline"
    response["Content-Disposition"] = f'{disposition_type}; filename="certificate-{certificate.certificate_id}.pdf"'
    return response


# ─── VOLUNTEER EVENT VIEWS ───────────────────────────────────────────

@api_view(["GET"])
def api_events_list(request):
    events = Event.objects.all().order_by("-date")
    
    filter_set = EventFilter(request.GET, queryset=events)
    if filter_set.is_valid():
        events = filter_set.qs

    registered_event_ids = []
    from common.auth_utils import get_volunteer_from_request
    volunteer = get_volunteer_from_request(request)
    if volunteer:
        registered_event_ids = list(
            EventRegistration.objects.filter(volunteer=volunteer).values_list("event_id", flat=True)
        )
    return Response(
        {
            "events": EventSerializer(events, many=True).data,
            "registered_event_ids": registered_event_ids,
        }
    )


@api_view(["POST"])
def api_event_register(request, pk):
    volunteer, error = volunteer_auth_required(request)
    if error:
        return error

    event = get_object_or_404(Event, pk=pk)
    registration, created = EventRegistration.objects.get_or_create(event=event, volunteer=volunteer)
    if created:
        return Response({"message": "Successfully registered for the event!"}, status=201)
    return Response({"message": "Already registered for this event."})


@api_view(["GET"])
def api_certificates(request):
    volunteer, error = volunteer_auth_required(request)
    if error:
        return error
    certificates = Certificate.objects.filter(volunteer=volunteer).select_related("event").order_by("-issued_date")
    return Response(CertificateSerializer(certificates, many=True).data)


@api_view(["GET"])
def api_certificate_download(request, certificate_id):
    volunteer, error = volunteer_auth_required(request)
    if error:
        return error
    certificate = get_object_or_404(Certificate, id=certificate_id, volunteer=volunteer)
    return build_certificate_pdf_response(certificate, as_attachment=True)


@api_view(["GET"])
def api_certificate_view(request, certificate_id):
    volunteer, error = volunteer_auth_required(request)
    if error:
        return error
    certificate = get_object_or_404(Certificate, id=certificate_id, volunteer=volunteer)
    return build_certificate_pdf_response(certificate, as_attachment=False)


# ─── ADMIN DASHBOARD STATS ──────────────────────────────────────────

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


# ─── ADMIN EVENT & CERTIFICATE VIEWS ─────────────────────────────────

@api_view(["GET", "POST"])
def api_admin_events(request):
    admin_user = require_staff_api(request)
    if isinstance(admin_user, Response):
        return admin_user

    if request.method == "GET":
        events = scoped_events_queryset(admin_user).order_by("-date")
        filter_set = EventFilter(request.GET, queryset=events)
        if filter_set.is_valid():
            events = filter_set.qs
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
            
            create_notification(
                certificate.volunteer,
                f"Certificate Issued: {certificate.event.title} 🎓",
                f"You've earned a certificate (ID: {certificate.certificate_id}) for participating in '{certificate.event.title}'.",
                notification_type="certificate",
                link="/dashboard",
            )
            
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


# ─── ADMIN DATA EXPORTS ──────────────────────────────────────────────

@api_view(["GET"])
def api_admin_export_volunteers(request):
    admin_user = require_staff_api(request)
    if isinstance(admin_user, Response):
        return admin_user

    volunteers = scoped_volunteers_queryset(admin_user).order_by("name")

    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = 'attachment; filename="biharseva_volunteers.csv"'

    writer = csv.writer(response)
    writer.writerow(["Name", "Email", "Phone", "District", "College", "Verified", "Total Hours", "Registered On"])

    for v in volunteers:
        writer.writerow([
            v.name,
            v.email,
            v.phone,
            v.district,
            v.college.name if v.college else (v.college_name or ""),
            "Yes" if v.is_verified else "No",
            float(v.total_hours or 0),
            v.created_at.strftime("%Y-%m-%d"),
        ])

    return response


@api_view(["GET"])
def api_admin_export_events(request):
    admin_user = require_staff_api(request)
    if isinstance(admin_user, Response):
        return admin_user

    events = scoped_events_queryset(admin_user).order_by("-date")

    response = HttpResponse(content_type="text/csv")
    response["Content-Disposition"] = 'attachment; filename="biharseva_events.csv"'

    writer = csv.writer(response)
    writer.writerow(["Title", "Date", "Location", "Activity Type", "Coordinator", "Completed", "NSS Unit"])

    for e in events:
        writer.writerow([
            e.title,
            e.date.strftime("%Y-%m-%d") if e.date else "",
            e.location,
            e.activity_type,
            e.program_coordinator_name or "",
            "Yes" if e.is_completed else "No",
            str(e.nss_unit) if e.nss_unit else "",
        ])

    return response
