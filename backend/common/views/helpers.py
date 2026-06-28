import random
import string
import logging
from decimal import Decimal

from django.conf import settings
from django.db.models import Q
from django.utils import timezone
from rest_framework.throttling import SimpleRateThrottle

from common.auth_utils import (
    decode_token,
    extract_bearer_token,
    get_admin_from_request,
    issue_token,
)
from common.models import AuditLog
from authentication.models import AdminProfile, Volunteer
from colleges.models import College, NSSUnit, ProgramOfficer
from events.models import Badge, Certificate, Event, VolunteerHours
from notifications.models import Notification

logger = logging.getLogger("common")


# ─── Audit + notification helpers ───────────────────────────────

def log_admin_action(request, admin_user, action, target_model, target_id=None, details=""):
    """Record an admin action in the audit log."""
    ip = request.META.get("HTTP_X_FORWARDED_FOR", request.META.get("REMOTE_ADDR", ""))
    if ip and "," in ip:
        ip = ip.split(",")[0].strip()
    try:
        AuditLog.objects.create(
            admin_user=admin_user,
            action=action,
            target_model=target_model,
            target_id=target_id,
            details=details,
            ip_address=ip or None,
        )
    except Exception:
        logger.exception("Failed to create audit log entry")


def create_notification(volunteer, title, message, notification_type="general", link=""):
    """Create an in-app notification for a volunteer."""
    try:
        Notification.objects.create(
            volunteer=volunteer,
            title=title,
            message=message,
            notification_type=notification_type,
            link=link,
        )
    except Exception:
        logger.exception("Failed to create notification for volunteer %s", volunteer.id)


# ─── Auth helpers ───────────────────────────────────────────────

def volunteer_auth_required(request):
    from common.auth_utils import get_volunteer_from_request
    volunteer = get_volunteer_from_request(request)
    if volunteer is None:
        from rest_framework.response import Response
        from rest_framework import status
        return None, Response(
            {"detail": "Please log in as a verified volunteer first."},
            status=status.HTTP_401_UNAUTHORIZED,
        )
    return volunteer, None


def require_staff_api(request, allowed_roles=None):
    from rest_framework.response import Response
    import jwt

    token = extract_bearer_token(request)
    if not token:
        return Response({"detail": "Staff authentication required."}, status=401)

    try:
        claims = decode_token(token)
    except jwt.ExpiredSignatureError:
        return Response({"detail": "Staff authentication expired."}, status=401)
    except jwt.InvalidTokenError:
        return Response({"detail": "Staff authentication invalid."}, status=401)
    except Exception:
        return Response({"detail": "Staff authentication invalid."}, status=401)

    if claims.get("role") != "admin":
        return Response({"detail": "You do not have permission for this operation."}, status=403)

    user_id = claims.get("user_id")
    if not user_id:
        return Response({"detail": "Staff authentication invalid."}, status=401)

    from django.contrib.auth import get_user_model
    User = get_user_model()
    admin_user = User.objects.filter(id=user_id, is_staff=True, is_active=True).first()
    if admin_user is None:
        return Response({"detail": "Staff user not found or inactive."}, status=403)

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
            status=403,
        )

    if allowed_roles and admin_role not in allowed_roles:
        return Response({"detail": "You do not have permission for this operation."}, status=403)

    # Attach properties dynamically to admin_user
    admin_user.admin_role = admin_role
    admin_user.admin_college = admin_college
    admin_user.admin_college_id = admin_college.id if admin_college else None

    return admin_user


def generate_otp():
    return "".join(random.choices(string.digits, k=6))


# ─── Throttle classes ───────────────────────────────────────────

class OTPThrottle(SimpleRateThrottle):
    """Custom throttle to limit OTP requests to 5 per minute per IP."""
    scope = 'otp'

    def get_cache_key(self, request, view):
        if request.user.is_authenticated:
            ident = request.user.pk
        else:
            ident = self.get_ident(request)
        return self.cache_format % {'scope': self.scope, 'ident': ident}


# ─── Admin role utilities ───────────────────────────────────────

def is_platform_admin(admin_user):
    return getattr(admin_user, "admin_role", None) == "platform_admin" or admin_user.is_superuser


def is_college_admin(admin_user):
    return getattr(admin_user, "admin_role", None) == "college_admin"


def scoped_volunteers_queryset(admin_user):
    qs = Volunteer.objects.select_related("college", "nss_unit")
    if is_platform_admin(admin_user):
        return qs
    return qs.filter(Q(college=admin_user.admin_college) | Q(nss_unit__college=admin_user.admin_college))


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


def ensure_college_admin_owns_unit(admin_user, unit):
    from rest_framework.response import Response
    if is_platform_admin(admin_user):
        return None
    if not unit or unit.college_id != admin_user.admin_college_id:
        return Response({"detail": "Unit does not belong to your college."}, status=403)
    return None


# ─── Badge thresholds ───────────────────────────────────────────

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


# ─── Email helpers ──────────────────────────────────────────────

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
    email = EmailMessage(email_subject, email_message, settings.DEFAULT_FROM_EMAIL, [recipient_email], reply_to=[sender_email])
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
        from events.views import build_certificate_pdf_bytes
        certificate = Certificate.objects.filter(id=certificate_pk).first()
        if certificate:
            pdf_bytes = build_certificate_pdf_bytes(certificate)
            email.attach(f"certificate-{certificate.certificate_id}.pdf", pdf_bytes, "application/pdf")
    except Exception:
        logger.exception("Failed to generate/attach certificate PDF for certificate id %s", certificate_pk)
    email.send(fail_silently=False)
