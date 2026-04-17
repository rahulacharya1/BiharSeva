import random
import secrets
import string
import uuid
from decimal import Decimal
from datetime import timedelta
import threading
import logging

from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Count, Q, Sum
from django.db.models.functions import TruncMonth
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .auth_utils import (
    decode_token,
    extract_bearer_token,
    get_admin_from_request,
    get_volunteer_from_request,
    issue_token,
)
from .models import (
    AdminProfile,
    ActivityProposal,
    Badge,
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
from .serializers import (
    AdminAttendanceSerializer,
    AdminCertificateManageSerializer,
    AdminEventCreateSerializer,
    AdminEventManageSerializer,
    AdminReportManageSerializer,
    AdminReportStatusSerializer,
    AdminOtpRequestSerializer,
    AdminOtpVerifySerializer,
    AdminVolunteerActionSerializer,
    AdminVolunteerManageSerializer,
    ActivityProposalSerializer,
    BadgeSerializer,
    CertificateSerializer,
    CollegeSerializer,
    ContactMessageSerializer,
    EventRegistrationAdminSerializer,
    EventRegistrationSerializer,
    EventSerializer,
    NSSUnitSerializer,
    ProgramOfficerSerializer,
    PublicVolunteerSerializer,
    ReportSerializer,
    VolunteerHoursSerializer,
    VolunteerOtpRequestSerializer,
    VolunteerOtpVerifySerializer,
    VolunteerRegisterSerializer,
    VolunteerSerializer,
)


logger = logging.getLogger(__name__)


def volunteer_auth_required(request):
    volunteer = get_volunteer_from_request(request)
    if volunteer is None:
        return None, Response(
            {"detail": "Please log in as a verified volunteer first."},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    return volunteer, None


def generate_otp():
    return "".join(random.choices(string.digits, k=6))


def send_otp_email(email, otp, volunteer_name):
    from django.core.mail import send_mail

    subject = "BiharSeva - Password Reset OTP"
    message = f"""
Hello {volunteer_name},

Your One-Time Password (OTP) for password reset is: {otp}

This OTP is valid for 10 minutes. Please do not share this code with anyone.

If you didn't request this password reset, please ignore this email.

Best regards,
BiharSeva Team
    """
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email], fail_silently=False)


def send_contact_email(recipient_email, sender_name, sender_email, subject, message_body):
    from django.core.mail import EmailMessage

    email_subject = f"[BiharSeva Contact] {subject}"
    email_message = (
        f"New message from BiharSeva contact form\n\n"
        f"Name: {sender_name}\n"
        f"Email: {sender_email}\n"
        f"Subject: {subject}\n\n"
        f"Message:\n{message_body}\n"
    )

    email = EmailMessage(
        email_subject,
        email_message,
        settings.DEFAULT_FROM_EMAIL,
        [recipient_email],
        reply_to=[sender_email],
    )
    email.send(fail_silently=False)


def send_password_changed_email(email, volunteer_name):
    from django.core.mail import send_mail

    subject = "BiharSeva - Password Changed"
    message = f"""
Hello {volunteer_name},

Your BiharSeva account password was changed successfully.

If you made this change, no further action is required.
If you did not make this change, please reset your password immediately and contact support.

Best regards,
BiharSeva Team
    """
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email], fail_silently=False)


def send_admin_otp_email(email, otp, username):
    from django.core.mail import send_mail

    subject = "BiharSeva Admin - Password Reset OTP"
    message = f"""
Hello {username},

Your one-time password (OTP) for admin password reset is: {otp}

This OTP is valid for 10 minutes. Please do not share this code with anyone.

If you didn't request this reset, please ignore this email.

Regards,
BiharSeva Team
    """
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email], fail_silently=False)


def send_admin_password_changed_email(email, username):
    from django.core.mail import send_mail

    subject = "BiharSeva Admin - Password Changed"
    message = f"""
Hello {username},

Your BiharSeva admin password was changed successfully.

If you made this change, no further action is required.
If you did not make this change, please reset your password immediately and contact support.

Regards,
BiharSeva Team
    """
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email], fail_silently=False)


def send_admin_invite_email(email, username, temp_password, college_name):
    from django.core.mail import send_mail

    subject = "BiharSeva College Admin Access"
    message = f"""
Hello {username},

Your BiharSeva college admin account has been created for {college_name}.

Username: {username}
Temporary Password: {temp_password}

Please sign in and change your password using the OTP/reset flow as soon as possible.

Regards,
BiharSeva Team
    """
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email], fail_silently=False)


def send_new_report_alert_email(recipient_email, report):
    from django.core.mail import send_mail

    subject = "BiharSeva - New Report Submitted"
    message = f"""
Hello Admin,

A new civic report was submitted on BiharSeva.

Reporter: {report.reporter_name}
District: {report.district}
Location: {report.location}
Status: {report.status}

Please review it in the admin panel.

Regards,
BiharSeva System
    """
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [recipient_email], fail_silently=False)


def send_new_volunteer_alert_email(recipient_email, volunteer):
    from django.core.mail import send_mail

    subject = "BiharSeva - New Volunteer Registration"
    message = f"""
Hello Admin,

A new volunteer has registered on BiharSeva.

Name: {volunteer.name}
Email: {volunteer.email}
Phone: {volunteer.phone}
District: {volunteer.district}
College: {volunteer.college}
Verified: {'Yes' if volunteer.is_verified else 'No'}

Please review and verify from the admin panel.

Regards,
BiharSeva System
    """
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [recipient_email], fail_silently=False)


def send_event_announcement_email(recipient_list, event):
    from django.core.mail import send_mail

    if not recipient_list:
        return

    subject = f"BiharSeva - New Event: {event.title}"
    message = f"""
Hello Volunteer,

A new BiharSeva event has been announced.

Title: {event.title}
Date: {event.date}
Location: {event.location}
Coordinator: {event.program_coordinator_name or 'TBA'}

Description:
{event.description}

Please login to BiharSeva and register if you wish to participate.

Regards,
BiharSeva Team
    """
    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, recipient_list, fail_silently=False)


def send_new_certificate_email(volunteer_email, volunteer_name, certificate_id, event_title, issued_date, certificate_pk):
    from django.core.mail import EmailMessage

    subject = "BiharSeva - New Certificate Awarded"
    message = f"""
Hello {volunteer_name},

Congratulations! You have received a new certificate on BiharSeva.

Certificate ID: {certificate_id}
Event: {event_title}
Issued Date: {issued_date}

Your certificate PDF is attached with this email.

Regards,
BiharSeva Team
    """

    email = EmailMessage(subject, message, settings.DEFAULT_FROM_EMAIL, [volunteer_email])
    try:
        certificate = Certificate.objects.filter(id=certificate_pk).first()
        if certificate:
            pdf_bytes = build_certificate_pdf_bytes(certificate)
            email.attach(f"certificate-{certificate.certificate_id}.pdf", pdf_bytes, "application/pdf")
    except Exception:
        logger.exception("Failed to generate/attach certificate PDF for certificate id %s", certificate_pk)
    email.send(fail_silently=False)


def build_certificate_pdf_bytes(certificate):
    from io import BytesIO

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


def require_staff_api(request, allowed_roles=None):
    admin_user = get_admin_from_request(request)
    if admin_user is None:
        return Response({"detail": "Staff authentication required."}, status=status.HTTP_403_FORBIDDEN)

    token = extract_bearer_token(request)
    claims = {}
    if token:
        try:
            claims = decode_token(token)
        except Exception:
            claims = {}

    profile = AdminProfile.objects.select_related("college").filter(user=admin_user).first()

    if admin_user.is_superuser:
        admin_role = "platform_admin"
        admin_college = None
    elif profile:
        admin_role = profile.role
        admin_college = profile.college
    else:
        return Response(
            {"detail": "Admin profile is not configured for this account."},
            status=status.HTTP_403_FORBIDDEN,
        )

    claimed_role = claims.get("admin_role")
    if claimed_role and claimed_role != admin_role:
        return Response({"detail": "Admin role claim mismatch. Please login again."}, status=403)

    if admin_role == "college_admin" and not admin_college:
        return Response({"detail": "College admin must be assigned to a college."}, status=403)

    if allowed_roles and admin_role not in allowed_roles:
        return Response({"detail": "You do not have permission for this operation."}, status=403)

    admin_user.admin_role = admin_role
    admin_user.admin_college = admin_college
    admin_user.admin_college_id = admin_college.id if admin_college else None
    return admin_user


def is_platform_admin(admin_user):
    return getattr(admin_user, "admin_role", None) == "platform_admin"


def scoped_volunteers_queryset(admin_user):
    qs = Volunteer.objects.all()
    if is_platform_admin(admin_user):
        return qs
    college = admin_user.admin_college
    return qs.filter(Q(college=college) | Q(nss_unit__college=college)).distinct()


def scoped_units_queryset(admin_user):
    qs = NSSUnit.objects.select_related("college")
    if is_platform_admin(admin_user):
        return qs
    return qs.filter(college=admin_user.admin_college)


def scoped_officers_queryset(admin_user):
    qs = ProgramOfficer.objects.select_related("nss_unit", "nss_unit__college")
    if is_platform_admin(admin_user):
        return qs
    return qs.filter(nss_unit__college=admin_user.admin_college)


def scoped_events_queryset(admin_user):
    qs = Event.objects.select_related("nss_unit", "nss_unit__college")
    if is_platform_admin(admin_user):
        return qs
    return qs.filter(nss_unit__college=admin_user.admin_college)


def scoped_certificates_queryset(admin_user):
    qs = Certificate.objects.select_related("volunteer", "event", "event__nss_unit", "event__nss_unit__college")
    if is_platform_admin(admin_user):
        return qs
    college = admin_user.admin_college
    return qs.filter(
        Q(volunteer__college=college)
        | Q(volunteer__nss_unit__college=college)
        | Q(event__nss_unit__college=college)
    ).distinct()


def scoped_proposals_queryset(admin_user):
    qs = ActivityProposal.objects.select_related("nss_unit", "nss_unit__college", "submitted_by", "approved_by", "linked_event")
    if is_platform_admin(admin_user):
        return qs
    return qs.filter(nss_unit__college=admin_user.admin_college)


def scoped_hours_queryset(admin_user):
    qs = VolunteerHours.objects.select_related("volunteer", "event", "event__nss_unit", "volunteer__nss_unit")
    if is_platform_admin(admin_user):
        return qs
    college = admin_user.admin_college
    return qs.filter(Q(volunteer__college=college) | Q(volunteer__nss_unit__college=college) | Q(event__nss_unit__college=college)).distinct()


def scoped_badges_queryset(admin_user):
    qs = Badge.objects.select_related("volunteer", "volunteer__nss_unit", "volunteer__college")
    if is_platform_admin(admin_user):
        return qs
    college = admin_user.admin_college
    return qs.filter(Q(volunteer__college=college) | Q(volunteer__nss_unit__college=college)).distinct()


def ensure_college_admin_owns_unit(admin_user, unit):
    if is_platform_admin(admin_user):
        return None
    if not unit or unit.college_id != admin_user.admin_college_id:
        return Response({"detail": "Unit does not belong to your college."}, status=403)
    return None


BADGE_THRESHOLDS = [
    ("bronze", Decimal("20.00"), "Bronze Contributor"),
    ("silver", Decimal("50.00"), "Silver Volunteer"),
    ("gold", Decimal("100.00"), "Gold Service Leader"),
    ("platinum", Decimal("200.00"), "Platinum Impact Champion"),
]


def award_badges_for_volunteer(volunteer):
    for level, threshold, name in BADGE_THRESHOLDS:
        if volunteer.total_hours >= threshold:
            Badge.objects.get_or_create(
                volunteer=volunteer,
                level=level,
                defaults={
                    "name": name,
                    "description": f"Awarded after completing {threshold} service hours.",
                    "hours_required": threshold,
                },
            )


@api_view(["GET"])
def api_home_stats(request):
    stats = {
        "total_reports": Report.objects.count(),
        "total_volunteers": Volunteer.objects.filter(is_verified=True).count(),
        "total_events": Event.objects.count(),
        "total_certificates": Certificate.objects.count(),
    }
    top_districts = list(
        Report.objects.values("district").annotate(count=Count("id")).order_by("-count")[:5]
    )
    return Response({"stats": stats, "top_districts": top_districts})


@api_view(["GET"])
def api_about_stats(request):
    stats = {
        "total_reports": Report.objects.filter(status="cleaned").count(),
        "total_volunteers": Volunteer.objects.filter(is_verified=True).count(),
        "total_events": Event.objects.count(),
    }
    return Response({"stats": stats})


@api_view(["POST"])
def api_report_create(request):
    serializer = ReportSerializer(data=request.data)
    if serializer.is_valid():
        report = serializer.save()
        recipient_email = getattr(settings, "CONTACT_RECIPIENT_EMAIL", settings.DEFAULT_FROM_EMAIL)

        try:
            threading.Thread(
                target=send_new_report_alert_email,
                args=(recipient_email, report),
                daemon=True,
            ).start()
        except Exception:
            pass

        return Response({"message": "Issue reported successfully!", "report": serializer.data}, status=201)
    return Response(serializer.errors, status=400)


@api_view(["POST"])
def api_contact_message(request):
    serializer = ContactMessageSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)

    recipient_email = getattr(settings, "CONTACT_RECIPIENT_EMAIL", settings.DEFAULT_FROM_EMAIL)
    sender_name = serializer.validated_data["name"].strip()
    sender_email = serializer.validated_data["email"].strip()
    subject = serializer.validated_data["subject"].strip()
    message_body = serializer.validated_data["message"].strip()

    try:
        threading.Thread(
            target=send_contact_email,
            args=(recipient_email, sender_name, sender_email, subject, message_body),
            daemon=True,
        ).start()
    except Exception:
        return Response({"detail": "Failed to send your message. Please try again later."}, status=500)

    return Response({"message": "Message received. It is being sent now."}, status=202)


@api_view(["GET"])
def api_report_gallery(request):
    reports = Report.objects.filter(status__in=["verified", "in_progress", "cleaned"]).order_by("-created_at")
    return Response(ReportSerializer(reports, many=True, context={"request": request}).data)


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
            threading.Thread(
                target=send_new_volunteer_alert_email,
                args=(recipient_email, volunteer),
                daemon=True,
            ).start()
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


@api_view(["GET"])
def api_volunteers_list(request):
    volunteers = Volunteer.objects.filter(is_verified=True).order_by("name")
    return Response(PublicVolunteerSerializer(volunteers, many=True).data)


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
        from .auth_utils import decode_token

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
def api_events_list(request):
    events = Event.objects.all().order_by("-date")
    registered_event_ids = []
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
        return Response({"message": "Report deleted successfully."})

    if len(request.data.keys()) == 1 and "status" in request.data:
        serializer = AdminReportStatusSerializer(data=request.data)
        if serializer.is_valid():
            report.status = serializer.validated_data["status"]
            report.save(update_fields=["status"])
            return Response({"message": f"Report status updated to {report.status}."})
        return Response(serializer.errors, status=400)

    serializer = AdminReportManageSerializer(report, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
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
        return Response({"message": "Volunteer deleted successfully."})

    if "action" in request.data:
        serializer = AdminVolunteerActionSerializer(data=request.data)
        if serializer.is_valid():
            action = serializer.validated_data["action"]
            volunteer.is_verified = action == "verify"
            volunteer.save(update_fields=["is_verified"])
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

        notify_verified_only = getattr(settings, "EVENT_ANNOUNCEMENT_VERIFIED_ONLY", False)
        volunteer_qs = Volunteer.objects.filter(is_verified=True) if notify_verified_only else Volunteer.objects.all()
        recipients = [email for email in volunteer_qs.values_list("email", flat=True) if email]

        try:
            threading.Thread(
                target=send_event_announcement_email,
                args=(recipients, event),
                daemon=True,
            ).start()
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
        return Response({"message": "Event deleted successfully."})

    serializer = AdminEventManageSerializer(event, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
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
        return Response({"message": "Certificate deleted successfully."})

    serializer = AdminCertificateManageSerializer(certificate, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response({"message": "Certificate updated successfully."})
    return Response(serializer.errors, status=400)


@api_view(["GET"])
def api_admin_certificate_view(request, certificate_id):
    admin_user = require_staff_api(request)
    if isinstance(admin_user, Response):
        return admin_user

    certificate = get_object_or_404(scoped_certificates_queryset(admin_user), id=certificate_id)
    return build_certificate_pdf_response(certificate, as_attachment=False)


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
        .annotate(
            total_hours=Sum("hours"),
            volunteers=Count("volunteer", distinct=True),
            events=Count("event", distinct=True),
        )
        .order_by("-total_hours")
    )

    activity_breakdown = list(
        hours_qs.values("event__activity_type")
        .annotate(
            total_hours=Sum("hours"),
            volunteers=Count("volunteer", distinct=True),
            events=Count("event", distinct=True),
        )
        .order_by("-total_hours")
    )

    monthly_trend = list(
        hours_qs.annotate(month=TruncMonth("recorded_at"))
        .values("month")
        .annotate(
            total_hours=Sum("hours"),
            volunteers=Count("volunteer", distinct=True),
            events=Count("event", distinct=True),
        )
        .order_by("month")
    )

    unit_breakdown = list(
        units_qs.values("id", "college__name", "unit_number", "name")
        .annotate(
            members_count=Count("members", distinct=True),
            events=Count("events", distinct=True),
            total_hours=Sum("members__service_hours__hours"),
        )
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
