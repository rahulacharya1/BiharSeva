from django.db import models
from django.conf import settings
from django.contrib.auth.hashers import make_password, check_password
from common.constants import DISTRICT_CHOICES, ADMIN_ROLE_CHOICES

class Volunteer(models.Model):
    name = models.CharField(max_length=100)
    college_name = models.CharField(max_length=200, blank=True)  # Legacy field for backward compatibility
    college = models.ForeignKey('colleges.College', on_delete=models.SET_NULL, null=True, blank=True, related_name='volunteers')
    nss_unit = models.ForeignKey('colleges.NSSUnit', on_delete=models.SET_NULL, null=True, blank=True, related_name='members')
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
    total_hours = models.DecimalField(max_digits=6, decimal_places=2, default=0)
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


class AdminProfile(models.Model):
    """Maps staff users to scoped admin roles."""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="admin_profile")
    role = models.CharField(max_length=30, choices=ADMIN_ROLE_CHOICES, default="college_admin")
    college = models.ForeignKey('colleges.College', on_delete=models.SET_NULL, null=True, blank=True, related_name="admin_profiles")
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


class BlacklistedToken(models.Model):
    """Stores hashed values of blacklisted access and refresh tokens after logout."""
    token_hash = models.CharField(max_length=64, unique=True, db_index=True)
    blacklisted_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def __str__(self):
        return f"Blacklisted at {self.blacklisted_at} (expires {self.expires_at})"
