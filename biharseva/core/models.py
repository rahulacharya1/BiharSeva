from django.db import models
from django.contrib.auth.hashers import make_password, check_password

DISTRICT_CHOICES = [
    ("Purnea", "Purnea"),
    ("Katihar", "Katihar"),
    ("Araria", "Araria"),
    ("Kishanganj", "Kishanganj"),
    ("Madhepura", "Madhepura"),
    ("Saharsa", "Saharsa")
]

class Report(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('verified', 'Verified'),
        ('in_progress', 'In Progress'),
        ('cleaned', 'Cleaned')
    ]
    
    reporter_name = models.CharField(max_length=100)
    district = models.CharField(max_length=50, choices=DISTRICT_CHOICES)
    location = models.CharField(max_length=200)
    description = models.TextField()
    photo = models.ImageField(upload_to='reports_images/')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.location} ({self.district})"

class Volunteer(models.Model):
    name = models.CharField(max_length=100)
    college = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    google_sub = models.CharField(max_length=255, blank=True, null=True, unique=True)
    password_hash = models.CharField(max_length=128, blank=True)
    phone = models.CharField(max_length=15)
    district = models.CharField(max_length=50, choices=DISTRICT_CHOICES)
    is_verified = models.BooleanField(default=False)
    has_participated = models.BooleanField(default=False)
    otp_code = models.CharField(max_length=6, blank=True, null=True)
    otp_expiry = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        status = "Verified" if self.is_verified else "Not Verified"
        return f"{self.name} - {status}"

    def set_password(self, raw_password):
        self.password_hash = make_password(raw_password)

    def verify_password(self, raw_password):
        if not self.password_hash:
            return False
        return check_password(raw_password, self.password_hash)

class Event(models.Model):
    title = models.CharField(max_length=200)
    date = models.DateField()
    location = models.CharField(max_length=200)
    description = models.TextField()
    program_coordinator_name = models.CharField(max_length=120, blank=True)
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-date']
    
    def __str__(self):
        return self.title

class EventRegistration(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE)
    volunteer = models.ForeignKey(Volunteer, on_delete=models.CASCADE)
    attended = models.BooleanField(default=False)
    registered_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['event', 'volunteer']
        
    def __str__(self):
        return f"{self.volunteer.name} → {self.event.title}"

class Certificate(models.Model):
    volunteer = models.ForeignKey(Volunteer, on_delete=models.CASCADE)
    certificate_id = models.CharField(max_length=20, unique=True)
    issued_date = models.DateField(auto_now_add=True)
    event = models.ForeignKey(Event, on_delete=models.CASCADE)
    
    class Meta:
        unique_together = ['volunteer', 'event']
        ordering = ['-issued_date']
    
    def __str__(self):
        return f"{self.volunteer.name} - {self.certificate_id}"
    
