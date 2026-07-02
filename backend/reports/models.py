from django.db import models
from django.conf import settings
from common.constants import DISTRICT_CHOICES

class Report(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('assigned', 'Assigned'),
        ('in_progress', 'In Progress'),
        ('cleaned', 'Cleaned'),
        ('duplicate', 'Duplicate'),
        ('cancelled', 'Cancelled'),
    ]
    
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('emergency', 'Emergency'),
    ]
    
    ASSIGNMENT_METHOD_CHOICES = [
        ('claimed', 'Claimed'),
        ('auto_assigned', 'Auto Assigned'),
        ('manual', 'Manual Override'),
    ]
    
    reporter_name = models.CharField(max_length=100)
    district = models.CharField(max_length=50, choices=DISTRICT_CHOICES, db_index=True)
    location = models.CharField(max_length=200)
    description = models.TextField()
    photo = models.ImageField(upload_to='reports_images/')
    after_photo = models.ImageField(upload_to='reports_images/', blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium', db_index=True)
    assignment_method = models.CharField(max_length=20, choices=ASSIGNMENT_METHOD_CHOICES, blank=True, null=True)
    claim_deadline = models.DateTimeField(null=True, blank=True, db_index=True)
    is_locked = models.BooleanField(default=False)
    is_overdue = models.BooleanField(default=False, db_index=True)
    
    # Assignment fields
    assigned_college = models.ForeignKey('colleges.College', on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_reports')
    assigned_admin = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_reports')
    assigned_at = models.DateTimeField(null=True, blank=True)
    claimed_at = models.DateTimeField(null=True, blank=True)
    target_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.location} ({self.district})"


class ReportAuditLog(models.Model):
    report = models.ForeignKey(Report, on_delete=models.CASCADE, related_name='audit_logs')
    timestamp = models.DateTimeField(auto_now_add=True, db_index=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=50)
    remarks = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.report.id} - {self.action} at {self.timestamp}"
