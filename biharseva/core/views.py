from django.shortcuts import render, redirect, get_object_or_404
from django.http import HttpResponse
from django.contrib import messages
from django.db.models import Count
from django.core.mail import send_mail
from django.conf import settings
from django.utils import timezone
from functools import wraps
import uuid
import random
import string
from datetime import timedelta
from io import BytesIO
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.pdfgen import canvas

from .models import Report, Volunteer, Event, EventRegistration, Certificate
from .forms import (
    ReportForm,
    VolunteerForm,
    VolunteerLoginForm,
    VolunteerProfileForm,
    VolunteerPasswordResetForm,
    VolunteerOTPRequestForm,
    VolunteerOTPVerifyForm,
)


# Resolve the verified volunteer stored in the current session.
def get_logged_in_volunteer(request):
    volunteer_id = request.session.get('volunteer_id')
    if volunteer_id:
        volunteer = Volunteer.objects.filter(id=volunteer_id, is_verified=True).first()
        if volunteer:
            return volunteer

    return None


# Require a verified volunteer session before entering a page.
def volunteer_login_required(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not get_logged_in_volunteer(request):
            messages.info(request, 'Please log in as a verified volunteer first.')
            return redirect('volunteer_login')

        return view_func(request, *args, **kwargs)

    return wrapper

# -------------------------
# OTP Utility Functions
# -------------------------

def generate_otp():
    """Generate a 6-digit OTP"""
    return ''.join(random.choices(string.digits, k=6))

def send_otp_email(email, otp, volunteer_name):
    """Send OTP to volunteer's email"""
    subject = 'BiharSeva - Password Reset OTP'
    message = f"""
Hello {volunteer_name},

Your One-Time Password (OTP) for password reset is: {otp}

This OTP is valid for 10 minutes. Please do not share this code with anyone.

If you didn't request this password reset, please ignore this email.

Best regards,
BiharSeva Team
    """
    
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Error sending OTP email: {e}")
        return False

# -----------------------------
# Static Pages
# -----------------------------

# Render the home page with dashboard-style project statistics.
def home(request):
    stats = {
        'total_reports': Report.objects.count(),
        'total_volunteers': Volunteer.objects.filter(is_verified=True).count(),
        'total_events': Event.objects.count(),
        'total_certificates': Certificate.objects.count(),
    }

    # optional extra stat
    top_districts = Report.objects.values('district').annotate(
        count=Count('id')
    ).order_by('-count')[:5]

    context = {
        'stats': stats,
        'top_districts': top_districts,
    }

    return render(request, 'pages/home.html', context)


# Render the about page with summary counts for the movement.
def about(request):
    stats = {
        'total_reports': Report.objects.filter(status='cleaned').count(),
        'total_volunteers': Volunteer.objects.filter(is_verified=True).count(),
        'total_events': Event.objects.count(),
    }

    context = {
        'stats': stats,
        'title': 'About BiharSeva',
    }

    return render(request, 'pages/about.html', context)


# Render shared static pages from the namespaced template folder.
def static_page(request, page):
    context = {'title': page.replace('-', ' ').title()}
    return render(request, f'pages/{page}.html', context)


# -----------------------------
# Report System
# -----------------------------

# Handle the public issue reporting form.
def report_issue(request):
    if request.method == 'POST':
        form = ReportForm(request.POST, request.FILES)

        if form.is_valid():
            form.save()
            messages.success(request, 'Issue reported successfully! Admin will review it.')
            return redirect('report_success')
    else:
        form = ReportForm()

    return render(request, 'reports/report_issue.html', {'form': form})


# Show the post-report submission success page.
def report_success(request):
    return render(request, 'reports/report_success.html')


# Display verified reports in the public gallery.
def report_gallery(request):
    reports = Report.objects.filter(
        status__in=['verified', 'in_progress', 'cleaned']
    ).order_by('-created_at')

    return render(request, 'reports/report_gallery.html', {'reports': reports})


# -----------------------------
# Volunteer System
# -----------------------------

# Handle the volunteer registration form.
def volunteer_form(request):
    if request.method == 'POST':
        form = VolunteerForm(request.POST)

        if form.is_valid():
            form.save()

            messages.success(request, 'Registered successfully! Wait for admin verification, then log in.')
            return redirect('volunteer_success')
    else:
        form = VolunteerForm()

    return render(request, 'volunteers/volunteer_form.html', {'form': form})


# Show the volunteer registration success page.
def volunteer_success(request):
    return render(request, 'volunteers/volunteer_success.html')


# Authenticate a verified volunteer using email and phone.
def volunteer_login(request):
    if request.method == 'POST':
        form = VolunteerLoginForm(request.POST)

        if form.is_valid():
            email = form.cleaned_data['email']
            password = form.cleaned_data['password']
            volunteer = Volunteer.objects.filter(email=email).first()

            if volunteer and volunteer.is_verified and volunteer.verify_password(password):
                request.session['volunteer_id'] = volunteer.id
                request.session['volunteer_name'] = volunteer.name
                messages.success(request, f'Welcome back, {volunteer.name}!')
                return redirect('volunteer_dashboard')

            if volunteer and not volunteer.is_verified:
                messages.warning(request, 'Your registration exists, but admin verification is still pending.')
            else:
                messages.error(request, 'Invalid email or password.')
    else:
        form = VolunteerLoginForm()

    return render(request, 'volunteers/volunteer_login.html', {'form': form})


# Reset password for an existing volunteer using email and phone verification.
def volunteer_password_reset(request):
    if request.method == 'POST':
        form = VolunteerPasswordResetForm(request.POST)

        if form.is_valid():
            email = form.cleaned_data['email']
            phone = form.cleaned_data['phone']
            new_password = form.cleaned_data['new_password']

            volunteer = Volunteer.objects.filter(email=email, phone=phone).first()
            if not volunteer:
                messages.error(request, 'No volunteer matched the provided email and phone number.')
            elif not volunteer.is_verified:
                messages.warning(request, 'Your account is not verified yet. Please wait for admin verification.')
            else:
                volunteer.set_password(new_password)
                volunteer.save(update_fields=['password_hash'])
                messages.success(request, 'Password reset successful. Please log in with your new password.')
                return redirect('volunteer_login')
    else:
        form = VolunteerPasswordResetForm()

    return render(request, 'volunteers/volunteer_password_reset.html', {'form': form})


# Request OTP for password reset
def volunteer_request_otp(request):
    if request.method == 'POST':
        form = VolunteerOTPRequestForm(request.POST)
        
        if form.is_valid():
            email = form.cleaned_data['email']
            phone = form.cleaned_data['phone']
            
            volunteer = Volunteer.objects.filter(email=email, phone=phone).first()
            
            if not volunteer:
                messages.error(request, 'No volunteer found with provided email and phone number.')
            elif not volunteer.is_verified:
                messages.warning(request, 'Your account is not verified yet. Please wait for admin verification.')
            else:
                # Check if a valid OTP already exists
                if volunteer.otp_code and volunteer.otp_expiry and timezone.now() < volunteer.otp_expiry:
                    # Reuse existing OTP instead of sending again
                    otp = volunteer.otp_code
                    messages.info(request, f'OTP already sent to {email}. Check your inbox or request a new one after 10 minutes.')
                else:
                    # Generate and save new OTP
                    otp = generate_otp()
                    otp_expiry = timezone.now() + timedelta(minutes=10)
                    volunteer.otp_code = otp
                    volunteer.otp_expiry = otp_expiry
                    volunteer.save(update_fields=['otp_code', 'otp_expiry'])
                    
                    # Send OTP via email
                    if send_otp_email(email, otp, volunteer.name):
                        messages.success(request, f'OTP sent to {email}. Valid for 10 minutes.')
                    else:
                        messages.error(request, 'Failed to send OTP. Please try again later.')
                        return
                
                request.session['otp_email'] = email
                request.session['otp_phone'] = phone
                return redirect('volunteer_verify_otp')
    else:
        form = VolunteerOTPRequestForm()
    
    return render(request, 'volunteers/volunteer_request_otp.html', {'form': form})


# Verify OTP and reset password
def volunteer_verify_otp(request):
    otp_email = request.session.get('otp_email')
    otp_phone = request.session.get('otp_phone')
    
    if not otp_email or not otp_phone:
        messages.error(request, 'Please request OTP first.')
        return redirect('volunteer_request_otp')
    
    if request.method == 'POST':
        form = VolunteerOTPVerifyForm(request.POST)
        
        if form.is_valid():
            otp = form.cleaned_data['otp']
            new_password = form.cleaned_data['new_password']
            
            volunteer = Volunteer.objects.filter(email=otp_email, phone=otp_phone).first()
            
            if not volunteer:
                messages.error(request, 'Volunteer not found.')
                return redirect('volunteer_request_otp')
            
            if not volunteer.otp_code or volunteer.otp_code != otp:
                messages.error(request, 'Invalid OTP.')
            elif volunteer.otp_expiry and timezone.now() > volunteer.otp_expiry:
                messages.error(request, 'OTP has expired. Please request a new OTP.')
                return redirect('volunteer_request_otp')
            else:
                # Reset password and clear OTP
                volunteer.set_password(new_password)
                volunteer.otp_code = None
                volunteer.otp_expiry = None
                volunteer.save(update_fields=['password_hash', 'otp_code', 'otp_expiry'])
                
                # Clear session
                request.session.pop('otp_email', None)
                request.session.pop('otp_phone', None)
                
                messages.success(request, 'Password reset successful. Please log in with your new password.')
                return redirect('volunteer_login')
    else:
        form = VolunteerOTPVerifyForm()
    
    return render(request, 'volunteers/volunteer_verify_otp.html', {'form': form, 'email': otp_email})


# End the volunteer session and return to the public site.
def volunteer_logout(request):
    request.session.pop('volunteer_id', None)
    request.session.pop('volunteer_name', None)
    messages.success(request, 'You have been logged out.')
    return redirect('home')


# Show a volunteer dashboard with registrations and certificates.
@volunteer_login_required
def volunteer_dashboard(request):
    volunteer = get_logged_in_volunteer(request)
    registrations = EventRegistration.objects.filter(volunteer=volunteer).select_related('event').order_by('-registered_at')
    certificates_list = Certificate.objects.filter(volunteer=volunteer).select_related('event').order_by('-issued_date')
    upcoming_events = Event.objects.filter(is_completed=False).order_by('date')[:5]

    context = {
        'volunteer': volunteer,
        'registrations': registrations,
        'certificates': certificates_list,
        'upcoming_events': upcoming_events,
        'registration_count': registrations.count(),
        'certificate_count': certificates_list.count(),
    }

    return render(request, 'volunteers/volunteer_dashboard.html', context)


# Update volunteer profile details and optionally change password.
@volunteer_login_required
def volunteer_profile_edit(request):
    volunteer = get_logged_in_volunteer(request)

    if request.method == 'POST':
        form = VolunteerProfileForm(request.POST, instance=volunteer)
        if form.is_valid():
            volunteer = form.save(commit=False)
            new_password = form.cleaned_data.get('new_password')
            if new_password:
                volunteer.set_password(new_password)
            volunteer.save()
            messages.success(request, 'Profile updated successfully.')
            return redirect('volunteer_dashboard')
    else:
        form = VolunteerProfileForm(instance=volunteer)

    return render(request, 'volunteers/volunteer_profile_edit.html', {'form': form, 'volunteer': volunteer})


# List all verified volunteers publicly.
def volunteers_list(request):
    volunteers = Volunteer.objects.filter(is_verified=True)
    return render(request, 'volunteers/volunteers.html', {'volunteers': volunteers})


# -----------------------------
# Event System
# -----------------------------

# List events and show which ones the current volunteer already registered for.
def events_list(request):
    events = Event.objects.all().order_by('-date')
    registered_event_ids = []
    volunteer = get_logged_in_volunteer(request)

    if volunteer:
        registered_event_ids = EventRegistration.objects.filter(
            volunteer=volunteer
        ).values_list('event_id', flat=True)

    context = {
        'events': events,
        'registered_event_ids': registered_event_ids,
        'logged_in_volunteer': volunteer,
    }

    return render(request, 'events/events.html', context)


# Register a verified volunteer for a specific event.
def event_register(request, pk):
    event = get_object_or_404(Event, pk=pk)
    volunteer = get_logged_in_volunteer(request)

    if not volunteer:
        messages.info(request, 'Please log in as a verified volunteer to register for events.')
        return redirect('volunteer_login')

    if request.method == 'POST':
        EventRegistration.objects.get_or_create(
            event=event,
            volunteer=volunteer,
        )

        messages.success(request, 'Successfully registered for the event!')
        return redirect('events')

    return render(request, 'events/event_register.html', {'event': event, 'volunteer': volunteer})


# -----------------------------
# Certificate Logic
# -----------------------------

# Create a certificate for an attended and verified registration.
def generate_certificate(registration):
    volunteer = registration.volunteer
    event = registration.event

    if registration.attended and volunteer.is_verified:
        existing = Certificate.objects.filter(
            volunteer=volunteer,
            event=event,
        ).first()

        if not existing:
            Certificate.objects.create(
                volunteer=volunteer,
                event=event,
                certificate_id='BS-' + str(uuid.uuid4())[:8].upper(),
            )


# -----------------------------
# Mark Attendance (Admin/Manual)
# -----------------------------

# Mark attendance for a registration and generate a certificate when allowed.
def mark_attendance(request, registration_id):
    registration = get_object_or_404(EventRegistration, id=registration_id)
    registration.attended = True
    registration.save()

    # generate certificate
    generate_certificate(registration)

    messages.success(request, 'Attendance marked and certificate generated!')

    return redirect('events')


# -----------------------------
# Certificates Page
# -----------------------------

# Show all certificates for the volunteer stored in the current session.
@volunteer_login_required
def certificates(request):
    volunteer = get_logged_in_volunteer(request)

    certificates = Certificate.objects.filter(
        volunteer=volunteer
    ).order_by('-issued_date')

    return render(request, 'certificates/certificates.html', {'certificates': certificates, 'volunteer': volunteer})


def build_certificate_pdf_response(certificate, as_attachment=True):
    buffer = BytesIO()
    page_size = landscape(A4)
    pdf = canvas.Canvas(buffer, pagesize=page_size)
    width, height = page_size

    pdf.setTitle(f"Certificate {certificate.certificate_id}")
    pdf.setAuthor('BiharSeva')
    pdf.setSubject('Volunteer participation certificate')

    # Outer and inner rectangle borders
    pdf.setLineWidth(4)
    pdf.setFillColor(colors.HexColor('#059669'))
    pdf.setStrokeColor(colors.HexColor('#059669'))
    pdf.rect(1.0 * cm, 1.0 * cm, width - 2.0 * cm, height - 2.0 * cm)

    pdf.setLineWidth(1.2)
    pdf.setStrokeColor(colors.HexColor('#34d399'))
    pdf.rect(1.4 * cm, 1.4 * cm, width - 2.8 * cm, height - 2.8 * cm)

    # Header section
    pdf.setFont('Helvetica-Bold', 13)
    pdf.setFillColor(colors.HexColor('#059669'))
    pdf.drawCentredString(width / 2, height - 2.2 * cm, 'BIHARSEVA COMMUNITY INITIATIVE')

    pdf.setFont('Helvetica-Bold', 34)
    pdf.setFillColor(colors.HexColor('#111827'))
    pdf.drawCentredString(width / 2, height - 4.2 * cm, 'CERTIFICATE OF PARTICIPATION')

    pdf.setLineWidth(1.5)
    pdf.setStrokeColor(colors.HexColor('#059669'))
    pdf.line(3.0 * cm, height - 5.0 * cm, width - 3.0 * cm, height - 5.0 * cm)

    # Main body
    pdf.setFont('Helvetica', 14)
    pdf.setFillColor(colors.HexColor('#374151'))
    pdf.drawCentredString(width / 2, height - 6.3 * cm, 'This certificate is proudly awarded to')

    pdf.setFont('Helvetica-Bold', 36)
    pdf.setFillColor(colors.HexColor('#059669'))
    pdf.drawCentredString(width / 2, height - 8.1 * cm, certificate.volunteer.name)

    pdf.setFont('Helvetica', 14)
    pdf.setFillColor(colors.HexColor('#374151'))
    pdf.drawCentredString(width / 2, height - 9.5 * cm, 'for dedicated service and successful participation in')

    pdf.setFont('Helvetica-Bold', 20)
    pdf.setFillColor(colors.HexColor('#059669'))
    pdf.drawCentredString(width / 2, height - 10.8 * cm, certificate.event.title)

    # Certificate metadata
    pdf.setFont('Helvetica', 11)
    pdf.setFillColor(colors.HexColor('#6b7280'))
    pdf.drawCentredString(width / 2, height - 12.1 * cm, f"Event Date: {certificate.event.date.strftime('%d %B %Y')}")
    pdf.drawCentredString(width / 2, height - 12.8 * cm, f"Issued On: {certificate.issued_date.strftime('%d %B %Y')}")
    pdf.drawCentredString(width / 2, height - 13.5 * cm, f"Certificate ID: {certificate.certificate_id}")

    # Signature area
    pdf.setLineWidth(1)
    pdf.setStrokeColor(colors.HexColor('#94a3b8'))
    left_x = width * 0.22
    right_x = width * 0.78
    sign_y = 4.8 * cm
    pdf.line(left_x - 2.3 * cm, sign_y, left_x + 2.3 * cm, sign_y)
    pdf.line(right_x - 2.3 * cm, sign_y, right_x + 2.3 * cm, sign_y)

    # Signature names/titles are configurable from settings.
    event_coordinator_name = getattr(certificate.event, 'program_coordinator_name', '')
    left_sign_name = event_coordinator_name or getattr(settings, 'CERTIFICATE_LEFT_SIGN_NAME', 'A. Kumar')
    left_sign_title = getattr(settings, 'CERTIFICATE_LEFT_SIGN_TITLE', 'Program Coordinator')
    right_sign_name = getattr(settings, 'CERTIFICATE_RIGHT_SIGN_NAME', 'Admin')
    right_sign_title = getattr(settings, 'CERTIFICATE_RIGHT_SIGN_TITLE', 'Admin, BiharSeva')

    # Visible signature text above each signature line
    pdf.setFont('Times-Italic', 20)
    pdf.setFillColor(colors.HexColor('#0f766e'))
    pdf.drawCentredString(left_x, sign_y + 0.35 * cm, left_sign_name)
    pdf.drawCentredString(right_x, sign_y + 0.35 * cm, right_sign_name)

    pdf.setFont('Helvetica-Bold', 12)
    pdf.setFillColor(colors.HexColor('#1e293b'))
    pdf.drawCentredString(left_x, sign_y - 0.65 * cm, left_sign_title)
    pdf.drawCentredString(right_x, sign_y - 0.65 * cm, right_sign_title)

    # Footer verification strip
    pdf.setLineWidth(0.8)
    pdf.setStrokeColor(colors.HexColor('#cbd5e1'))
    pdf.line(2.0 * cm, 3.0 * cm, width - 2.0 * cm, 3.0 * cm)
    pdf.setFont('Helvetica-Oblique', 9)
    pdf.setFillColor(colors.HexColor('#64748b'))
    pdf.drawCentredString(width / 2, 2.35 * cm, 'Verified digital certificate issued by BiharSeva')
    pdf.drawCentredString(width / 2, 1.9 * cm, 'Authenticity can be verified using the Certificate ID')

    pdf.showPage()
    pdf.save()
    buffer.seek(0)

    response = HttpResponse(buffer.read(), content_type='application/pdf')
    disposition_type = 'attachment' if as_attachment else 'inline'
    response['Content-Disposition'] = f'{disposition_type}; filename="certificate-{certificate.certificate_id}.pdf"'
    return response


# Generate and download a printable PDF certificate for the logged-in volunteer.
@volunteer_login_required
def certificate_download(request, certificate_id):
    volunteer = get_logged_in_volunteer(request)
    certificate = get_object_or_404(Certificate, id=certificate_id, volunteer=volunteer)
    return build_certificate_pdf_response(certificate, as_attachment=True)


# Open a printable certificate PDF in the browser for preview.
@volunteer_login_required
def certificate_view(request, certificate_id):
    volunteer = get_logged_in_volunteer(request)
    certificate = get_object_or_404(Certificate, id=certificate_id, volunteer=volunteer)
    return build_certificate_pdf_response(certificate, as_attachment=False)