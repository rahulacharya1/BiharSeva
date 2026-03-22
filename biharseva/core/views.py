from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.db.models import Count
import uuid

from .models import Report, Volunteer, Event, EventRegistration, Certificate
from .forms import ReportForm, VolunteerForm

# -----------------------------

# Static Pages

# -----------------------------

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
        'top_districts': top_districts
    }

    return render(request, 'home.html', context)

def about(request):
    stats = {
        'total_reports': Report.objects.filter(status='cleaned').count(),
        'total_volunteers': Volunteer.objects.filter(is_verified=True).count(),
        'total_events': Event.objects.count(),
    }
    
    context = {
        'stats': stats,
        'title': 'About BiharSeva'
    }
    return render(request, 'about.html', context)

def static_page(request, page):
    context = {'title': page.replace('-', ' ').title()}
    return render(request, f'{page}.html', context)

# -----------------------------

# Report System

# -----------------------------

def report_issue(request):

    if request.method == 'POST':
        form = ReportForm(request.POST, request.FILES)

        if form.is_valid():
            form.save()
            messages.success(request, 'Issue reported successfully! Admin will review it.')
            return redirect('report_success')

    else:
        form = ReportForm()

    return render(request, 'report_issue.html', {'form': form})


def report_success(request):
    return render(request, 'report_success.html')

def report_gallery(request):
    reports = Report.objects.filter(
        status__in=['verified', 'in_progress', 'cleaned']
    ).order_by('-created_at')

    return render(request, 'report_gallery.html', {'reports': reports})


# -----------------------------

# Volunteer System

# -----------------------------

def volunteer_form(request):

    if request.method == 'POST':
        form = VolunteerForm(request.POST)

        if form.is_valid():
            volunteer = form.save()
            request.session['volunteer_email'] = volunteer.email

            messages.success(request, 'Registered successfully!')
            return redirect('events')

    else:
        form = VolunteerForm()

    return render(request, 'volunteer_form.html', {'form': form})


def volunteer_success(request):
    return render(request, 'volunteer_success.html')

def volunteers_list(request):
    volunteers = Volunteer.objects.filter(is_verified=True)
    return render(request, 'volunteers.html', {'volunteers': volunteers})

# -----------------------------

# Event System

# -----------------------------

def events_list(request):
    events = Event.objects.all().order_by('-date')
    registered_event_ids = []
    
    # URL parameter se check karein, agar nahi hai toh Session se uthayein
    email = request.GET.get('email') or request.session.get('volunteer_email')
    
    if email:
        volunteer = Volunteer.objects.filter(email=email).first()
        if volunteer:
            # Registration list nikalne ke liye
            registered_event_ids = EventRegistration.objects.filter(
                volunteer=volunteer
            ).values_list('event_id', flat=True)
    
    context = {
        'events': events,
        'registered_event_ids': registered_event_ids,
        'volunteer_email': email # Isse template mein use kar sakte hain
    }
    
    return render(request, 'events.html', context)

def event_register(request, pk):
    event = get_object_or_404(Event, pk=pk)
    
    if request.method == "POST":
    
        email = request.POST.get('email')
    
        volunteer = Volunteer.objects.filter(email=email).first()
    
        if not volunteer:
            messages.error(request, "You are not registered as a volunteer!")
            return redirect('volunteer_form')
    
        if not volunteer.is_verified:
            messages.error(request, "You are not verified yet!")
            return redirect('events')
    
        EventRegistration.objects.get_or_create(
            event=event,
            volunteer=volunteer
        )
    
        messages.success(request, "Successfully registered for the event!")
        return redirect('events')
    
    return render(request, 'event_register.html', {'event': event})



# -----------------------------

# Certificate Logic

# -----------------------------

def generate_certificate(registration):
    volunteer = registration.volunteer
    event = registration.event

    if registration.attended and volunteer.is_verified:

        existing = Certificate.objects.filter(
            volunteer=volunteer,
            event=event
        ).first()

        if not existing:
            Certificate.objects.create(
                volunteer=volunteer,
                event=event,
                certificate_id="BS-" + str(uuid.uuid4())[:8].upper()
            )

# -----------------------------

# Mark Attendance (Admin/Manual)

# -----------------------------

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

def certificates(request):
    email = request.session.get('volunteer_email')
    volunteer = Volunteer.objects.filter(email=email).first()
    
    if not volunteer:
        messages.error(request, 'Please register as a volunteer first!')
        return redirect('volunteer_form')
    
    certificates = Certificate.objects.filter(
        volunteer=volunteer
    ).order_by('-issued_date')
    
    return render(request, 'certificates.html', {'certificates': certificates})

