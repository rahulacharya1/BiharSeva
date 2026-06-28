import uuid
from django.contrib import admin
from events.models import Event, EventRegistration, Certificate, VolunteerHours, Badge

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ['title', 'date', 'location', 'is_completed', 'created_at']
    list_filter = ['date', 'is_completed']
    search_fields = ['title', 'location', 'description']
    actions = ['mark_completed']

    @admin.action(description="Mark Event as Completed")
    def mark_completed(self, request, queryset):
        queryset.update(is_completed=True)


@admin.register(EventRegistration)
class EventRegistrationAdmin(admin.ModelAdmin):
    list_display = ['volunteer', 'event', 'attended', 'registered_at']
    list_filter = ['attended', 'event', 'event__date']
    search_fields = ['volunteer__name', 'volunteer__email', 'event__title']
    actions = ['mark_attended_and_certify']

    @admin.action(description="Mark as Attended & Generate Certificate")
    def mark_attended_and_certify(self, request, queryset):
        queryset.update(attended=True)
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


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = ['certificate_id', 'volunteer', 'event', 'issued_date']
    list_filter = ['issued_date', 'event']
    search_fields = ['certificate_id', 'volunteer__name', 'volunteer__email', 'event__title']
    readonly_fields = ['certificate_id', 'issued_date']


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
