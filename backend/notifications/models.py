from django.db import models
from django.conf import settings
from common.constants import NOTIFICATION_TYPE_CHOICES

class Notification(models.Model):
    volunteer = models.ForeignKey('authentication.Volunteer', on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name='admin_notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPE_CHOICES, default='general')
    is_read = models.BooleanField(default=False, db_index=True)
    link = models.CharField(max_length=300, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        target = self.volunteer.name if self.volunteer else (self.user.username if self.user else "System")
        return f"{target}: {self.title}"
