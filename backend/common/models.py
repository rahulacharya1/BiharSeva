from django.db import models
from django.conf import settings

class AuditLog(models.Model):
    """Tracks admin actions for accountability."""
    admin_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='audit_logs'
    )
    action = models.CharField(max_length=100, db_index=True)  # e.g., "volunteer.verify", "event.create"
    target_model = models.CharField(max_length=50)  # e.g., "Volunteer", "Event"
    target_id = models.IntegerField(null=True, blank=True)
    details = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        user = self.admin_user.username if self.admin_user else "Unknown"
        return f"[{self.created_at:%Y-%m-%d %H:%M}] {user}: {self.action}"
