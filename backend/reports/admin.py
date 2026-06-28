from django.contrib import admin
from reports.models import Report

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
