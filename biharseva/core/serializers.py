from django.utils import timezone
from rest_framework import serializers

from .models import Certificate, Event, EventRegistration, Report, Volunteer, DISTRICT_CHOICES


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
            "status",
            "created_at",
        ]
        read_only_fields = ["id", "status", "created_at"]

    def validate_photo(self, value):
        if value and value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("Image must be less than 5MB")
        return value


class VolunteerRegisterSerializer(serializers.ModelSerializer):
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
        volunteer = Volunteer(**validated_data)
        volunteer.set_password(password)
        volunteer.save()
        return volunteer


class VolunteerSerializer(serializers.ModelSerializer):
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


class VolunteerPasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()
    phone = serializers.CharField()
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate_phone(self, value):
        if not value.isdigit() or len(value) != 10:
            raise serializers.ValidationError("Enter a valid 10-digit mobile number")
        return value

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError("New password and confirm password must match")
        return attrs


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


class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = [
            "id",
            "title",
            "date",
            "location",
            "description",
            "program_coordinator_name",
            "is_completed",
            "created_at",
        ]


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
        fields = ["reporter_name", "district", "location", "description", "status"]


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
        fields = ["title", "date", "location", "description", "program_coordinator_name"]


class AdminEventManageSerializer(serializers.ModelSerializer):
    def validate_date(self, value):
        if value < timezone.localdate():
            raise serializers.ValidationError("Event date cannot be in the past")
        return value

    class Meta:
        model = Event
        fields = ["title", "date", "location", "description", "program_coordinator_name", "is_completed"]


class AdminVolunteerManageSerializer(serializers.ModelSerializer):
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


class AdminCertificateManageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Certificate
        fields = ["certificate_id", "volunteer", "event"]
