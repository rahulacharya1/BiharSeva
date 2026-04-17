from django.utils import timezone
from django.db import models as django_models
from rest_framework import serializers

from .models import (
    Certificate, Event, EventRegistration, Report, Volunteer, DISTRICT_CHOICES,
    College, NSSUnit, ProgramOfficer, VolunteerHours, Badge, ActivityProposal
)

class PublicVolunteerSerializer(serializers.ModelSerializer):
    """Serializer for public volunteer directory - excludes sensitive contact info."""
    college = serializers.SerializerMethodField()

    class Meta:
        model = Volunteer
        fields = [
            "id",
            "name",
            "college",
            "district",
            "is_verified",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def get_college(self, obj):
        if obj.college:
            return obj.college.name
        return obj.college_name

class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = [
            "id",
            "reporter_name",
            "district",
            "location",
            "description",
            "photo",
            "after_photo",
            "status",
            "created_at",
        ]
        read_only_fields = ["id", "status", "created_at"]

    def validate_photo(self, value):
        if value and value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("Image must be less than 5MB")
        return value

    def validate_after_photo(self, value):
        if value and value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("After image must be less than 5MB")
        return value


class VolunteerRegisterSerializer(serializers.ModelSerializer):
    college = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = Volunteer
        fields = [
            "id",
            "name",
            "college",
            "email",
            "phone",
            "district",
            "password",
            "password_confirm",
        ]
        read_only_fields = ["id"]

    def validate_phone(self, value):
        if not value.isdigit() or len(value) != 10:
            raise serializers.ValidationError("Enter a valid 10-digit mobile number")
        return value

    def validate_email(self, value):
        if Volunteer.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already registered")
        return value

    def validate(self, attrs):
        if attrs.get("password") != attrs.get("password_confirm"):
            raise serializers.ValidationError("Password and confirm password must match")
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        validated_data.pop("password_confirm", None)
        college_label = (validated_data.pop("college", "") or "").strip()
        volunteer = Volunteer(**validated_data)
        if college_label:
            volunteer.college_name = college_label
        volunteer.set_password(password)
        volunteer.save()
        return volunteer


class VolunteerSerializer(serializers.ModelSerializer):
    college = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Volunteer
        fields = [
            "id",
            "name",
            "college",
            "email",
            "phone",
            "district",
            "is_verified",
            "has_participated",
            "created_at",
        ]
        read_only_fields = ["id", "email", "is_verified", "has_participated", "created_at"]

    def validate_phone(self, value):
        if not value.isdigit() or len(value) != 10:
            raise serializers.ValidationError("Enter a valid 10-digit mobile number")
        return value

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["college"] = instance.college.name if instance.college else instance.college_name
        return data

    def update(self, instance, validated_data):
        college_label = validated_data.pop("college", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if college_label is not None:
            instance.college_name = (college_label or "").strip()
            if instance.college_name:
                instance.college = None

        instance.save()
        return instance


class VolunteerOtpRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()
    phone = serializers.CharField()

    def validate_phone(self, value):
        if not value.isdigit() or len(value) != 10:
            raise serializers.ValidationError("Enter a valid 10-digit mobile number")
        return value


class VolunteerOtpVerifySerializer(serializers.Serializer):
    otp = serializers.CharField(max_length=6)
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate_otp(self, value):
        if not value.isdigit() or len(value) != 6:
            raise serializers.ValidationError("OTP must be a 6-digit number")
        return value

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError("New password and confirm password must match")
        return attrs


class AdminOtpRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class AdminOtpVerifySerializer(serializers.Serializer):
    otp = serializers.CharField(max_length=6)
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate_otp(self, value):
        if not value.isdigit() or len(value) != 6:
            raise serializers.ValidationError("OTP must be a 6-digit number")
        return value

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError("New password and confirm password must match")
        return attrs


class EventSerializer(serializers.ModelSerializer):
    nss_unit = serializers.PrimaryKeyRelatedField(read_only=True)
    nss_unit_name = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            "id",
            "title",
            "date",
            "location",
            "description",
            "program_coordinator_name",
            "nss_unit",
            "nss_unit_name",
            "is_completed",
            "created_at",
        ]

    def get_nss_unit_name(self, obj):
        if not obj.nss_unit:
            return None
        return f"{obj.nss_unit.college.name} / Unit {obj.nss_unit.unit_number}"


class EventRegistrationSerializer(serializers.ModelSerializer):
    event = EventSerializer(read_only=True)

    class Meta:
        model = EventRegistration
        fields = ["id", "event", "attended", "registered_at"]


class EventRegistrationAdminSerializer(serializers.ModelSerializer):
    volunteer = VolunteerSerializer(read_only=True)

    class Meta:
        model = EventRegistration
        fields = ["id", "volunteer", "attended", "registered_at"]


class CertificateSerializer(serializers.ModelSerializer):
    event = EventSerializer(read_only=True)

    class Meta:
        model = Certificate
        fields = ["id", "certificate_id", "issued_date", "event"]


class AdminReportStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Report.STATUS_CHOICES)


class AdminReportManageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ["reporter_name", "district", "location", "description", "status", "after_photo"]


class AdminVolunteerActionSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=[("verify", "verify"), ("unverify", "unverify")])


class AdminAttendanceSerializer(serializers.Serializer):
    attended = serializers.BooleanField(default=True)


class ContactMessageSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    subject = serializers.CharField(max_length=150)
    message = serializers.CharField(max_length=3000)

    def validate_message(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Message cannot be empty")
        return value


class AdminEventCreateSerializer(serializers.ModelSerializer):
    def validate_date(self, value):
        if value < timezone.localdate():
            raise serializers.ValidationError("Event date cannot be in the past")
        return value

    class Meta:
        model = Event
        fields = ["title", "date", "location", "description", "program_coordinator_name", "nss_unit", "activity_type", "hours_per_volunteer"]


class AdminEventManageSerializer(serializers.ModelSerializer):
    def validate_date(self, value):
        if value < timezone.localdate():
            raise serializers.ValidationError("Event date cannot be in the past")
        return value

    class Meta:
        model = Event
        fields = ["title", "date", "location", "description", "program_coordinator_name", "nss_unit", "activity_type", "hours_per_volunteer", "is_completed"]


class AdminVolunteerManageSerializer(serializers.ModelSerializer):
    college = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Volunteer
        fields = [
            "name",
            "college",
            "email",
            "phone",
            "district",
            "is_verified",
            "has_participated",
        ]

    def validate_phone(self, value):
        if not value.isdigit() or len(value) != 10:
            raise serializers.ValidationError("Enter a valid 10-digit mobile number")
        return value

    def update(self, instance, validated_data):
        college_label = validated_data.pop("college", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if college_label is not None:
            instance.college_name = (college_label or "").strip()
            if instance.college_name:
                instance.college = None

        instance.save()
        return instance


class AdminCertificateManageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Certificate
        fields = ["certificate_id", "volunteer", "event"]


# ============================================================================
# NEW SERIALIZERS FOR PHASE 2: MULTI-COLLEGE INFRASTRUCTURE
# ============================================================================

class CollegeSerializer(serializers.ModelSerializer):
    """Serializer for College institutional data."""
    nss_units_count = serializers.SerializerMethodField()
    
    class Meta:
        model = College
        fields = [
            "id",
            "name",
            "city",
            "district",
            "code",
            "email",
            "phone",
            "website",
            "nss_units_count",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]
    
    def get_nss_units_count(self, obj):
        return obj.nss_units.count()


class NSSUnitSerializer(serializers.ModelSerializer):
    """Serializer for NSS Unit within a College."""
    college_name = serializers.CharField(source='college.name', read_only=True)
    members_count = serializers.SerializerMethodField()
    
    class Meta:
        model = NSSUnit
        fields = [
            "id",
            "college",
            "college_name",
            "unit_number",
            "name",
            "members_count",
            "created_at",
        ]
        read_only_fields = ["id", "college_name", "created_at"]
    
    def get_members_count(self, obj):
        return obj.members.count()


class ProgramOfficerSerializer(serializers.ModelSerializer):
    """Serializer for NSS Program Officer/Coordinator."""
    unit_info = serializers.SerializerMethodField()
    
    class Meta:
        model = ProgramOfficer
        fields = [
            "id",
            "nss_unit",
            "unit_info",
            "name",
            "email",
            "phone",
            "designation",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["id", "unit_info", "created_at"]
    
    def get_unit_info(self, obj):
        return {
            "unit_id": obj.nss_unit.id,
            "college": obj.nss_unit.college.name,
            "unit_number": obj.nss_unit.unit_number,
        }


class VolunteerHoursSerializer(serializers.ModelSerializer):
    """Serializer for volunteer service hour tracking."""
    volunteer_name = serializers.CharField(source='volunteer.name', read_only=True)
    event_title = serializers.CharField(source='event.title', read_only=True)
    
    class Meta:
        model = VolunteerHours
        fields = [
            "id",
            "volunteer",
            "volunteer_name",
            "event",
            "event_title",
            "hours",
            "recorded_at",
            "recorded_by",
        ]
        read_only_fields = ["id", "volunteer_name", "event_title", "recorded_at"]


class BadgeSerializer(serializers.ModelSerializer):
    """Serializer for achievement badges."""
    volunteer_name = serializers.CharField(source='volunteer.name', read_only=True)
    
    class Meta:
        model = Badge
        fields = [
            "id",
            "volunteer",
            "volunteer_name",
            "level",
            "name",
            "description",
            "hours_required",
            "earned_date",
        ]
        read_only_fields = ["id", "volunteer_name", "earned_date"]


class ActivityProposalSerializer(serializers.ModelSerializer):
    """Serializer for event activity proposals."""
    nss_unit_info = serializers.SerializerMethodField()
    submitted_by_name = serializers.CharField(source='submitted_by.name', read_only=True, allow_null=True)
    approved_by_name = serializers.CharField(source='approved_by.name', read_only=True, allow_null=True)
    linked_event_title = serializers.CharField(source='linked_event.title', read_only=True, allow_null=True)
    
    class Meta:
        model = ActivityProposal
        fields = [
            "id",
            "nss_unit",
            "nss_unit_info",
            "title",
            "description",
            "activity_type",
            "proposed_date",
            "proposed_location",
            "status",
            "estimated_volunteers",
            "estimated_hours",
            "estimated_budget",
            "submitted_by",
            "submitted_by_name",
            "approved_by",
            "approved_by_name",
            "approval_notes",
            "linked_event",
            "linked_event_title",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id", "nss_unit_info", "submitted_by_name", "approved_by_name",
            "linked_event_title", "created_at", "updated_at"
        ]
    
    def get_nss_unit_info(self, obj):
        return {
            "unit_id": obj.nss_unit.id,
            "college": obj.nss_unit.college.name,
            "unit_number": obj.nss_unit.unit_number,
        }


class VolunteerDetailedSerializer(serializers.ModelSerializer):
    """Enhanced volunteer serializer with college and unit information."""
    college_name = serializers.CharField(source='college.name', read_only=True, allow_null=True)
    nss_unit_info = serializers.SerializerMethodField()
    total_service_hours = serializers.SerializerMethodField()
    badges_earned = serializers.SerializerMethodField()
    
    class Meta:
        model = Volunteer
        fields = [
            "id",
            "name",
            "email",
            "phone",
            "college",
            "college_name",
            "nss_unit",
            "nss_unit_info",
            "district",
            "is_verified",
            "has_participated",
            "total_hours",
            "total_service_hours",
            "badges_earned",
            "created_at",
        ]
        read_only_fields = [
            "id", "email", "college_name", "nss_unit_info",
            "total_service_hours", "badges_earned", "created_at"
        ]
    
    def get_nss_unit_info(self, obj):
        if obj.nss_unit:
            return {
                "unit_id": obj.nss_unit.id,
                "college": obj.nss_unit.college.name,
                "unit_number": obj.nss_unit.unit_number,
                "unit_name": obj.nss_unit.name,
            }
        return None
    
    def get_total_service_hours(self, obj):
        """Calculate total hours from VolunteerHours records."""
        return float(obj.service_hours.aggregate(total=django_models.Sum('hours'))['total'] or 0)
    
    def get_badges_earned(self, obj):
        """Return list of badges with levels."""
        badges = obj.badges.all()
        return BadgeSerializer(badges, many=True).data
