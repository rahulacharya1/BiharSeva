from django.db import models
from common.constants import ACTIVITY_TYPE_CHOICES, BADGE_LEVEL_CHOICES

class Event(models.Model):
    title = models.CharField(max_length=200)
    date = models.DateField(db_index=True)
    location = models.CharField(max_length=200)
    description = models.TextField()
    program_coordinator_name = models.CharField(max_length=120, blank=True)
    nss_unit = models.ForeignKey('colleges.NSSUnit', on_delete=models.CASCADE, null=True, blank=True, related_name='events')
    activity_type = models.CharField(max_length=50, choices=ACTIVITY_TYPE_CHOICES, default='other')
    hours_per_volunteer = models.DecimalField(max_digits=5, decimal_places=2, default=2)
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date']
    
    def __str__(self):
        return self.title


class EventRegistration(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE)
    volunteer = models.ForeignKey('authentication.Volunteer', on_delete=models.CASCADE)
    attended = models.BooleanField(default=False)
    registered_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['event', 'volunteer']
        
    def __str__(self):
        return f"{self.volunteer.name} → {self.event.title}"


class Certificate(models.Model):
    volunteer = models.ForeignKey('authentication.Volunteer', on_delete=models.CASCADE)
    certificate_id = models.CharField(max_length=20, unique=True, db_index=True)
    issued_date = models.DateField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    event = models.ForeignKey(Event, on_delete=models.CASCADE)
    
    class Meta:
        unique_together = ['volunteer', 'event']
        ordering = ['-issued_date']
    
    def __str__(self):
        return f"{self.volunteer.name} - {self.certificate_id}"


class VolunteerHours(models.Model):
    volunteer = models.ForeignKey('authentication.Volunteer', on_delete=models.CASCADE, related_name='service_hours')
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='hour_records')
    hours = models.DecimalField(max_digits=5, decimal_places=2)
    recorded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    recorded_by = models.CharField(max_length=100, blank=True)
    
    class Meta:
        unique_together = ['volunteer', 'event']
        ordering = ['-recorded_at']
    
    def __str__(self):
        return f"{self.volunteer.name}: {self.hours}h - {self.event.title}"


class Badge(models.Model):
    volunteer = models.ForeignKey('authentication.Volunteer', on_delete=models.CASCADE, related_name='badges')
    level = models.CharField(max_length=20, choices=BADGE_LEVEL_CHOICES)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    hours_required = models.DecimalField(max_digits=6, decimal_places=2)
    earned_date = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-earned_date']
    
    def __str__(self):
        return f"{self.volunteer.name} - {self.name}"
