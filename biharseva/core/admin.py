from django.contrib import admin
from .models import Report, Volunteer, Event, EventRegistration, Certificate

# -----------------------------

# Report Admin

# -----------------------------

@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ['reporter_name', 'district', 'status', 'created_at']
    list_filter = ['status', 'district', 'created_at']
    search_fields = ['reporter_name', 'description']
    actions = ['verify_reports', 'mark_in_progress', 'mark_cleaned']

def verify_reports(self, request, queryset):
    queryset.update(status='verified')
verify_reports.short_description = "Mark as Verified"

def mark_in_progress(self, request, queryset):
    queryset.update(status='in_progress')
mark_in_progress.short_description = "Mark as In Progress"

def mark_cleaned(self, request, queryset):
    queryset.update(status='cleaned')
mark_cleaned.short_description = "Mark as Cleaned"

# -----------------------------

# Volunteer Admin

# -----------------------------

@admin.register(Volunteer)
class VolunteerAdmin(admin.ModelAdmin):
    list_display = ['name', 'college', 'district', 'is_verified', 'created_at']
    list_filter = ['is_verified', 'district']
    search_fields = ['name', 'email', 'college']
    actions = ['verify_volunteers', 'unverify_volunteers']

def verify_volunteers(self, request, queryset):
    queryset.update(is_verified=True)
verify_volunteers.short_description = "Verify Volunteers"

def unverify_volunteers(self, request, queryset):
    queryset.update(is_verified=False)
unverify_volunteers.short_description = "Unverify Volunteers"

# -----------------------------

# Event Admin

# -----------------------------

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ['title', 'date', 'location', 'is_completed']
    list_filter = ['date', 'is_completed']
    search_fields = ['title', 'location']

# -----------------------------

# Event Registration Admin

# -----------------------------

@admin.register(EventRegistration)
class EventRegistrationAdmin(admin.ModelAdmin):
    list_display = ['volunteer', 'event', 'attended', 'registered_at']
    list_filter = ['attended', 'event']
actions = ['mark_attended']

def mark_attended(self, request, queryset):
    queryset.update(attended=True)
mark_attended.short_description = "Mark as Attended"

# -----------------------------

# Certificate Admin

# -----------------------------

@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ['volunteer', 'event', 'certificate_id', 'issued_date']
    search_fields = ['certificate_id', 'volunteer__name']


