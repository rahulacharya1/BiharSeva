from django.db import models
from django.conf import settings
from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone

DISTRICT_CHOICES = [
    ("Araria", "Araria"),
    ("Arwal", "Arwal"),
    ("Aurangabad", "Aurangabad"),
    ("Banka", "Banka"),
    ("Begusarai", "Begusarai"),
    ("Bhagalpur", "Bhagalpur"),
    ("Bhojpur", "Bhojpur"),
    ("Buxar", "Buxar"),
    ("Darbhanga", "Darbhanga"),
    ("East Champaran", "East Champaran"),
    ("Gaya", "Gaya"),
    ("Gopalganj", "Gopalganj"),
    ("Jamui", "Jamui"),
    ("Jehanabad", "Jehanabad"),
    ("Kaimur", "Kaimur"),
    ("Katihar", "Katihar"),
    ("Khagaria", "Khagaria"),
    ("Kishanganj", "Kishanganj"),
    ("Lakhisarai", "Lakhisarai"),
    ("Madhepura", "Madhepura"),
    ("Madhubani", "Madhubani"),
    ("Munger", "Munger"),
    ("Muzaffarpur", "Muzaffarpur"),
    ("Nalanda", "Nalanda"),
    ("Nawada", "Nawada"),
    ("Patna", "Patna"),
    ("Purnia", "Purnia"),
    ("Rohtas", "Rohtas"),
    ("Saharsa", "Saharsa"),
    ("Samastipur", "Samastipur"),
    ("Saran", "Saran"),
    ("Sheikhpura", "Sheikhpura"),
    ("Sheohar", "Sheohar"),
    ("Sitamarhi", "Sitamarhi"),
    ("Siwan", "Siwan"),
    ("Supaul", "Supaul"),
    ("Vaishali", "Vaishali"),
    ("West Champaran", "West Champaran"),
]


ACTIVITY_TYPE_CHOICES = [
    ("cleanliness", "Cleanliness Drive"),
    ("awareness", "Awareness Campaign"),
    ("health", "Health & Nutrition"),
    ("education", "Education Support"),
    ("traffic", "Traffic & Safety"),
    ("environment", "Environment Conservation"),
    ("disaster", "Disaster Relief"),
    ("other", "Other"),
]

PROPOSAL_STATUS_CHOICES = [
    ("draft", "Draft"),
    ("submitted", "Submitted for Approval"),
    ("approved", "Approved"),
    ("rejected", "Rejected"),
    ("in_progress", "In Progress"),
    ("completed", "Completed"),
]

BADGE_LEVEL_CHOICES = [
    ("bronze", "Bronze"),
    ("silver", "Silver"),
    ("gold", "Gold"),
    ("platinum", "Platinum"),
]

ADMIN_ROLE_CHOICES = [
    ("platform_admin", "Platform Admin"),
    ("college_admin", "College Admin"),
]


NOTIFICATION_TYPE_CHOICES = [
    ("certificate", "Certificate Issued"),
    ("badge", "Badge Earned"),
    ("verification", "Verification Status"),
    ("event", "New Event"),
    ("general", "General"),
]


class College(models.Model):
    """Represents a college or educational institution."""
    name = models.CharField(max_length=200, unique=True)
    city = models.CharField(max_length=100)
    district = models.CharField(max_length=50, choices=DISTRICT_CHOICES)
    code = models.CharField(max_length=50, unique=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=15, blank=True)
    website = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['name']
    
    def __str__(self):
        return self.name


class NSSUnit(models.Model):
    """Represents an NSS unit within a college."""
    college = models.ForeignKey(College, on_delete=models.CASCADE, related_name='nss_units')
    unit_number = models.IntegerField()
    name = models.CharField(max_length=100, blank=True)  # e.g., "NSS Unit-1"
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['college', 'unit_number']
        ordering = ['college', 'unit_number']
    
    def __str__(self):
        return f"{self.college.name} - Unit {self.unit_number}"


class ProgramOfficer(models.Model):
    """NSS Program Officer/Coordinator."""
    nss_unit = models.ForeignKey(NSSUnit, on_delete=models.CASCADE, related_name='officers')
    name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=15)
    designation = models.CharField(max_length=100)  # e.g., "NSS Program Officer"
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['nss_unit', 'name']
    
    def __str__(self):
        return f"{self.name} - {self.nss_unit.college.name}"


class AdminProfile(models.Model):
    """Maps staff users to scoped admin roles."""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="admin_profile")
    role = models.CharField(max_length=30, choices=ADMIN_ROLE_CHOICES, default="college_admin")
    college = models.ForeignKey(College, on_delete=models.SET_NULL, null=True, blank=True, related_name="admin_profiles")
    mfa_secret = models.CharField(max_length=32, blank=True, null=True)
    mfa_enabled = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["role", "user__username"]

    def __str__(self):
        if self.role == "platform_admin":
            return f"{self.user.username} (Platform Admin)"
        college_name = self.college.name if self.college else "No College"
        return f"{self.user.username} (College Admin - {college_name})"


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
    assigned_college = models.ForeignKey(College, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_reports')
    assigned_admin = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_reports')
    assigned_at = models.DateTimeField(null=True, blank=True)
    target_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.location} ({self.district})"

class Volunteer(models.Model):
    name = models.CharField(max_length=100)
    college_name = models.CharField(max_length=200, blank=True)  # Legacy field for backward compatibility
    college = models.ForeignKey(College, on_delete=models.SET_NULL, null=True, blank=True, related_name='volunteers')
    nss_unit = models.ForeignKey(NSSUnit, on_delete=models.SET_NULL, null=True, blank=True, related_name='members')
    email = models.EmailField(unique=True, db_index=True)
    google_sub = models.CharField(max_length=255, blank=True, null=True, unique=True)
    password_hash = models.CharField(max_length=128, blank=True)
    phone = models.CharField(max_length=15)
    district = models.CharField(max_length=50, choices=DISTRICT_CHOICES)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    is_verified = models.BooleanField(default=False)
    has_participated = models.BooleanField(default=False)
    otp_code = models.CharField(max_length=6, blank=True, null=True)
    otp_expiry = models.DateTimeField(blank=True, null=True)
    total_hours = models.DecimalField(max_digits=6, decimal_places=2, default=0)  # Total service hours
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
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
    date = models.DateField(db_index=True)
    location = models.CharField(max_length=200)
    description = models.TextField()
    program_coordinator_name = models.CharField(max_length=120, blank=True)
    nss_unit = models.ForeignKey(NSSUnit, on_delete=models.CASCADE, null=True, blank=True, related_name='events')
    activity_type = models.CharField(max_length=50, choices=ACTIVITY_TYPE_CHOICES, default='other')
    hours_per_volunteer = models.DecimalField(max_digits=5, decimal_places=2, default=2)  # Hours credited per volunteer
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-date']
    
    def __str__(self):
        return self.title

class EventRegistration(models.Model):
    event = models.ForeignKey(Event, on_delete=models.CASCADE)
    volunteer = models.ForeignKey(Volunteer, on_delete=models.CASCADE)
    attended = models.BooleanField(default=False)
    registered_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['event', 'volunteer']
        
    def __str__(self):
        return f"{self.volunteer.name} → {self.event.title}"

class Certificate(models.Model):
    volunteer = models.ForeignKey(Volunteer, on_delete=models.CASCADE)
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
    """Tracks service hours for each volunteer from events."""
    volunteer = models.ForeignKey(Volunteer, on_delete=models.CASCADE, related_name='service_hours')
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name='hour_records')
    hours = models.DecimalField(max_digits=5, decimal_places=2)
    recorded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    recorded_by = models.CharField(max_length=100, blank=True)  # NSS officer name
    
    class Meta:
        unique_together = ['volunteer', 'event']
        ordering = ['-recorded_at']
    
    def __str__(self):
        return f"{self.volunteer.name}: {self.hours}h - {self.event.title}"


class Badge(models.Model):
    """Achievement badges for volunteers based on milestones."""
    volunteer = models.ForeignKey(Volunteer, on_delete=models.CASCADE, related_name='badges')
    level = models.CharField(max_length=20, choices=BADGE_LEVEL_CHOICES)
    name = models.CharField(max_length=100)  # e.g., "Bronze Member", "Silver Star"
    description = models.TextField(blank=True)
    hours_required = models.DecimalField(max_digits=6, decimal_places=2)  # Minimum hours for this badge
    earned_date = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-earned_date']
    
    def __str__(self):
        return f"{self.volunteer.name} - {self.name}"


class ActivityProposal(models.Model):
    """Event proposal workflow - plan before execution."""
    nss_unit = models.ForeignKey(NSSUnit, on_delete=models.CASCADE, related_name='proposals')
    title = models.CharField(max_length=200)
    description = models.TextField()
    activity_type = models.CharField(max_length=50, choices=ACTIVITY_TYPE_CHOICES)
    proposed_date = models.DateField()
    proposed_location = models.CharField(max_length=200)
    status = models.CharField(max_length=20, choices=PROPOSAL_STATUS_CHOICES, default='draft')
    
    # Estimated details
    estimated_volunteers = models.IntegerField(default=10)
    estimated_hours = models.DecimalField(max_digits=5, decimal_places=2, default=2)
    estimated_budget = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Approval workflow
    submitted_by = models.ForeignKey(Volunteer, on_delete=models.SET_NULL, null=True, blank=True, related_name='proposals_submitted')
    approved_by = models.ForeignKey(ProgramOfficer, on_delete=models.SET_NULL, null=True, blank=True, related_name='proposals_approved')
    approval_notes = models.TextField(blank=True)
    
    # Linked event after approval
    linked_event = models.OneToOneField(Event, on_delete=models.SET_NULL, null=True, blank=True, related_name='proposal')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.get_status_display()}"


class Notification(models.Model):
    """In-app notifications for volunteers."""
    volunteer = models.ForeignKey(Volunteer, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPE_CHOICES, default='general')
    is_read = models.BooleanField(default=False, db_index=True)
    link = models.CharField(max_length=300, blank=True)  # Frontend route to navigate to
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.volunteer.name}: {self.title}"


class AuditLog(models.Model):
    """Tracks admin actions for accountability."""
    admin_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='audit_logs'
    )
    action = models.CharField(max_length=100, db_index=True)  # e.g., "volunteer.verify", "event.create"
    target_model = models.CharField(max_length=50)  # e.g., "Volunteer", "Event"
    target_id = models.IntegerField(null=True, blank=True)
    details = models.TextField(blank=True)  # JSON or free-text description
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        user = self.admin_user.username if self.admin_user else "Unknown"
        return f"[{self.created_at:%Y-%m-%d %H:%M}] {user}: {self.action}"


class BlacklistedToken(models.Model):
    """Stores hashed values of blacklisted access and refresh tokens after logout."""
    token_hash = models.CharField(max_length=64, unique=True, db_index=True)
    blacklisted_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def __str__(self):
        return f"Blacklisted at {self.blacklisted_at} (expires {self.expires_at})"

