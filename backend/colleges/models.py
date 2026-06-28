from django.db import models
from common.constants import DISTRICT_CHOICES

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
