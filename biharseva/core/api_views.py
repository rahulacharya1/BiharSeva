import random
import string
import uuid
from datetime import timedelta
import threading
import logging

from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
from django.db.models import Count
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

from .auth_utils import decode_token, get_admin_from_request, get_volunteer_from_request, issue_token
from .models import Certificate, Event, EventRegistration, Report, Volunteer
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
    CertificateSerializer,
    ContactMessageSerializer,
    EventRegistrationAdminSerializer,
    EventRegistrationSerializer,
    EventSerializer,
    ReportSerializer,
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


def require_staff_api(request):
    admin_user = get_admin_from_request(request)
    if admin_user is None:
        return Response({"detail": "Staff authentication required."}, status=status.HTTP_403_FORBIDDEN)
    return admin_user


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
        updated_volunteer = serializer.save()
        new_password = request.data.get("new_password")
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
    return Response(VolunteerSerializer(volunteers, many=True).data)


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

    token = issue_token({"role": "admin", "user_id": user.id}, expires_minutes=12 * 60)
    return Response({"message": "Admin login successful.", "token": token, "username": user.username})


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
    return Response({"username": admin_user.username, "is_staff": True})


@api_view(["GET"])
def api_admin_dashboard(request):
    admin_user = require_staff_api(request)
    if isinstance(admin_user, Response):
        return admin_user

    stats = {
        "total_reports": Report.objects.count(),
        "cleaned_reports": Report.objects.filter(status="cleaned").count(),
        "total_volunteers": Volunteer.objects.count(),
        "verified_volunteers": Volunteer.objects.filter(is_verified=True).count(),
        "total_events": Event.objects.count(),
        "total_certificates": Certificate.objects.count(),
    }
    return Response({"stats": stats})


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
        volunteers = Volunteer.objects.all().order_by("-created_at")
        return Response(VolunteerSerializer(volunteers, many=True).data)

    volunteer = get_object_or_404(Volunteer, id=volunteer_id)

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
        events = Event.objects.all().order_by("-date")
        return Response(EventSerializer(events, many=True).data)

    serializer = AdminEventCreateSerializer(data=request.data)
    if serializer.is_valid():
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

    event = get_object_or_404(Event, id=event_id)

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

    event = get_object_or_404(Event, id=event_id)

    if request.method == "GET":
        registrations = EventRegistration.objects.filter(event=event).select_related("volunteer")
        return Response(
            {
                "event": EventSerializer(event).data,
                "registrations": EventRegistrationAdminSerializer(registrations, many=True).data,
            }
        )

    registration = get_object_or_404(EventRegistration, id=registration_id, event=event)
    serializer = AdminAttendanceSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)

    registration.attended = serializer.validated_data["attended"]
    registration.save(update_fields=["attended"])

    if registration.attended and registration.volunteer.is_verified:
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
        serializer = AdminCertificateManageSerializer(data=request.data)
        if serializer.is_valid():
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

    certificates = Certificate.objects.all().select_related("volunteer", "event").order_by("-issued_date")
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

    certificate = get_object_or_404(Certificate, id=certificate_id)

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

    certificate = get_object_or_404(Certificate, id=certificate_id)
    return build_certificate_pdf_response(certificate, as_attachment=False)
