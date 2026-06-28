from django.db import models
from django.conf import settings
from common.constants import DISTRICT_CHOICES

class Report(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('verified', 'Verified'),
        ('in_progress', 'In Progress'),
        ('cleaned', 'Cleaned')
    ]
    
    reporter_name = models.CharField(max_length=100)
    district = models.CharField(max_length=50, choices=DISTRICT_CHOICES, db_index=True)
    location = models.CharField(max_length=200)
    description = models.TextField()
    photo = models.ImageField(upload_to='reports_images/')
    after_photo = models.ImageField(upload_to='reports_images/', blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Assignment fields: which college/admin will handle cleanup
    assigned_college = models.ForeignKey('colleges.College', on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_reports')
    assigned_admin = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_reports')
    assigned_at = models.DateTimeField(null=True, blank=True)
    target_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.location} ({self.district})"
