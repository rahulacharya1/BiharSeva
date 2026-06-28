from django.contrib import admin
from authentication.models import Volunteer, AdminProfile

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


@admin.register(AdminProfile)
class AdminProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'college', 'mfa_enabled', 'created_at']
    list_filter = ['role', 'college', 'mfa_enabled']
    search_fields = ['user__username', 'user__email']
