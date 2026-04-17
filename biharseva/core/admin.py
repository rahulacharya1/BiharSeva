from django.contrib import admin
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
import uuid

# -----------------------------
# Report Admin
# -----------------------------

@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ['reporter_name', 'district', 'location', 'status', 'created_at']
    list_filter = ['status', 'district', 'created_at']
    search_fields = ['reporter_name', 'description', 'location']
    actions = ['verify_reports', 'mark_in_progress', 'mark_cleaned']

    @admin.action(description="Mark as Verified")
    def verify_reports(self, request, queryset):
        queryset.update(status='verified')

    @admin.action(description="Mark as In Progress")
    def mark_in_progress(self, request, queryset):
        queryset.update(status='in_progress')

    @admin.action(description="Mark as Cleaned")
    def mark_cleaned(self, request, queryset):
        queryset.update(status='cleaned')

# -----------------------------
# Volunteer Admin
# -----------------------------

@admin.register(Volunteer)
class VolunteerAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'phone', 'college', 'district', 'is_verified', 'created_at']
    list_filter = ['is_verified', 'district', 'created_at']
    search_fields = ['name', 'email', 'phone', 'college__name', 'college_name']
    actions = ['verify_volunteers', 'unverify_volunteers']
    ordering = ['is_verified', '-created_at']

    @admin.action(description="Verify Volunteers")
    def verify_volunteers(self, request, queryset):
        queryset.update(is_verified=True)

    @admin.action(description="Unverify Volunteers")
    def unverify_volunteers(self, request, queryset):
        queryset.update(is_verified=False)

# -----------------------------
# Event Admin
# -----------------------------

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ['title', 'date', 'location', 'is_completed', 'created_at']
    list_filter = ['date', 'is_completed']
    search_fields = ['title', 'location', 'description']
    actions = ['mark_completed']

    @admin.action(description="Mark Event as Completed")
    def mark_completed(self, request, queryset):
        queryset.update(is_completed=True)

# -----------------------------
# Event Registration Admin
# -----------------------------

@admin.register(EventRegistration)
class EventRegistrationAdmin(admin.ModelAdmin):
    list_display = ['volunteer', 'event', 'attended', 'registered_at']
    list_filter = ['attended', 'event', 'event__date']
    search_fields = ['volunteer__name', 'volunteer__email', 'event__title']
    actions = ['mark_attended_and_certify']

    @admin.action(description="Mark as Attended & Generate Certificate")
    def mark_attended_and_certify(self, request, queryset):
        # Update attended status
        queryset.update(attended=True)
        
        # Generate certificates for verified volunteers who attended
        certificates_created = 0
        for registration in queryset:
            volunteer = registration.volunteer
            event = registration.event
            
            if volunteer.is_verified:
                cert, created = Certificate.objects.get_or_create(
                    volunteer=volunteer,
                    event=event,
                    defaults={'certificate_id': "BS-" + str(uuid.uuid4())[:8].upper()}
                )
                if created:
                    certificates_created += 1
                    
        self.message_user(request, f"Marked as attended and successfully generated {certificates_created} new certificates.")

# -----------------------------
# Certificate Admin
# -----------------------------

@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ['certificate_id', 'volunteer', 'event', 'issued_date']
    list_filter = ['issued_date', 'event']
    search_fields = ['certificate_id', 'volunteer__name', 'volunteer__email', 'event__title']
    readonly_fields = ['certificate_id', 'issued_date']


@admin.register(College)
class CollegeAdmin(admin.ModelAdmin):
    list_display = ['name', 'city', 'district', 'code', 'created_at']
    list_filter = ['district', 'created_at']
    search_fields = ['name', 'city', 'code', 'email']


@admin.register(NSSUnit)
class NSSUnitAdmin(admin.ModelAdmin):
    list_display = ['college', 'unit_number', 'name', 'created_at']
    list_filter = ['college', 'created_at']
    search_fields = ['college__name', 'name']


@admin.register(ProgramOfficer)
class ProgramOfficerAdmin(admin.ModelAdmin):
    list_display = ['name', 'nss_unit', 'email', 'phone', 'designation', 'is_active']
    list_filter = ['is_active', 'designation', 'nss_unit__college']
    search_fields = ['name', 'email', 'phone', 'nss_unit__college__name']


@admin.register(VolunteerHours)
class VolunteerHoursAdmin(admin.ModelAdmin):
    list_display = ['volunteer', 'event', 'hours', 'recorded_by', 'recorded_at']
    list_filter = ['event', 'recorded_at']
    search_fields = ['volunteer__name', 'event__title', 'recorded_by']


@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display = ['volunteer', 'level', 'name', 'hours_required', 'earned_date']
    list_filter = ['level', 'earned_date']
    search_fields = ['volunteer__name', 'name', 'description']


@admin.register(ActivityProposal)
class ActivityProposalAdmin(admin.ModelAdmin):
    list_display = ['title', 'nss_unit', 'activity_type', 'status', 'proposed_date', 'created_at']
    list_filter = ['status', 'activity_type', 'proposed_date']
    search_fields = ['title', 'description', 'nss_unit__college__name']


@admin.register(AdminProfile)
class AdminProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'college', 'created_at']
    list_filter = ['role', 'college']
    search_fields = ['user__username', 'user__email', 'college__name']
