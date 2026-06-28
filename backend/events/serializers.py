from django.utils import timezone
from rest_framework import serializers

from events.models import Event, EventRegistration, Certificate, VolunteerHours, Badge
from authentication.serializers import VolunteerSerializer

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


class AdminAttendanceSerializer(serializers.Serializer):
    attended = serializers.BooleanField(default=True)


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


class AdminCertificateManageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Certificate
        fields = ["certificate_id", "volunteer", "event"]


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
