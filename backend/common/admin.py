from django.contrib import admin
from common.models import AuditLog

@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['created_at', 'admin_user', 'action', 'target_model', 'target_id', 'ip_address']
    list_filter = ['action', 'target_model', 'created_at']
    search_fields = ['admin_user__username', 'details', 'ip_address']
    readonly_fields = ['created_at', 'admin_user', 'action', 'target_model', 'target_id', 'details', 'ip_address']
