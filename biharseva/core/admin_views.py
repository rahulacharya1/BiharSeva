from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.admin.views.decorators import staff_member_required
from django.contrib import messages
from django.db.models import Count
import uuid

from .models import Report, Volunteer, Event, EventRegistration, Certificate

# -----------------------------
# Admin Dashboard
# -----------------------------
@staff_member_required
def admin_dashboard(request):
    stats = {
        'total_reports': Report.objects.count(),
        'cleaned_reports': Report.objects.filter(status='cleaned').count(),
        'total_volunteers': Volunteer.objects.count(),
        'verified_volunteers': Volunteer.objects.filter(is_verified=True).count(),
        'total_events': Event.objects.count(),
        'total_certificates': Certificate.objects.count(),
    }
    return render(request, 'admin/dashboard.html', {'stats': stats})


# -----------------------------
# Reports Management
# -----------------------------
@staff_member_required
def admin_reports(request):
    if request.method == 'POST':
        report_id = request.POST.get('report_id')
        new_status = request.POST.get('status')
        if report_id and new_status:
            report = get_object_or_404(Report, id=report_id)
            report.status = new_status
            report.save()
            messages.success(request, f'Report status updated to {new_status}.')
            return redirect('admin_reports')

    reports = Report.objects.all().order_by('-created_at')
    return render(request, 'admin/reports_manage.html', {'reports': reports})


# -----------------------------
# Volunteers Management
# -----------------------------
@staff_member_required
def admin_volunteers(request):
    if request.method == 'POST':
        volunteer_id = request.POST.get('volunteer_id')
        action = request.POST.get('action')
        
        if volunteer_id and action:
            volunteer = get_object_or_404(Volunteer, id=volunteer_id)
            if action == 'verify':
                volunteer.is_verified = True
                messages.success(request, 'Volunteer verified successfully.')
            elif action == 'unverify':
                volunteer.is_verified = False
                messages.warning(request, 'Volunteer unverified.')
            volunteer.save()
            return redirect('admin_volunteers')

    volunteers = Volunteer.objects.all().order_by('-created_at')
    return render(request, 'admin/volunteers_manage.html', {'volunteers': volunteers})


# -----------------------------
# Events Management
# -----------------------------
@staff_member_required
def admin_events(request):
    if request.method == 'POST':
        # Create new event
        title = request.POST.get('title')
        date = request.POST.get('date')
        location = request.POST.get('location')
        description = request.POST.get('description')
        program_coordinator_name = request.POST.get('program_coordinator_name', '').strip()
        
        if title and date and location:
            Event.objects.create(
                title=title,
                date=date,
                location=location,
                description=description,
                program_coordinator_name=program_coordinator_name,
            )
            messages.success(request, 'Event created successfully!')
            return redirect('admin_events')

    events = Event.objects.all().order_by('-date')
    return render(request, 'admin/events_manage.html', {'events': events})


# -----------------------------
# Event Attendance & Certificates
# -----------------------------
@staff_member_required
def admin_event_attendance(request, event_id):
    event = get_object_or_404(Event, id=event_id)
    
    if request.method == 'POST':
        # Admin marked someone as attended
        registration_id = request.POST.get('registration_id')
        if registration_id:
            registration = get_object_or_404(EventRegistration, id=registration_id)
            registration.attended = True
            registration.save()
            
            # Generate Certificate if verified
            if registration.volunteer.is_verified:
                cert, created = Certificate.objects.get_or_create(
                    volunteer=registration.volunteer,
                    event=event,
                    defaults={'certificate_id': "BS-" + str(uuid.uuid4())[:8].upper()}
                )
                if created:
                    messages.success(request, f'Attendance marked and certificate generated for {registration.volunteer.name}!')
                else:
                    messages.info(request, f'Attendance marked. Certificate already exists for {registration.volunteer.name}.')
            else:
                messages.warning(request, f'Attendance marked, but {registration.volunteer.name} is NOT verified. No certificate generated.')
                
            return redirect('admin_event_attendance', event_id=event.id)

    registrations = EventRegistration.objects.filter(event=event).select_related('volunteer')
    return render(request, 'admin/event_attendance.html', {
        'event': event, 
        'registrations': registrations
    })


# -----------------------------
# Certificates Management
# -----------------------------
@staff_member_required
def admin_certificates(request):
    certificates = Certificate.objects.all().select_related('volunteer', 'event').order_by('-issued_date')
    return render(request, 'admin/certificates_manage.html', {'certificates': certificates})
