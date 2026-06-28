from django.db import models as django_models
from django.utils import timezone
from rest_framework import serializers

from authentication.models import Volunteer, AdminProfile
from colleges.models import College

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
        return ""


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
        if not value.isdigit() or len(value) != 10 or value[0] not in "6789":
            raise serializers.ValidationError("Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9")
        return value

    def validate_email(self, value):
        if Volunteer.objects.filter(email=value).exists():
            raise serializers.ValidationError("This email is already registered")
        return value

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        if not any(c.isdigit() for c in value):
            raise serializers.ValidationError("Password must contain at least one number.")
        if not any(c.isalpha() for c in value):
            raise serializers.ValidationError("Password must contain at least one letter.")
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
            matched_college = College.objects.filter(name__iexact=college_label).first()
            if matched_college:
                volunteer.college = matched_college
            else:
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
            "avatar",
            "is_verified",
            "has_participated",
            "total_hours",
            "created_at",
        ]
        read_only_fields = ["id", "email", "is_verified", "has_participated", "total_hours", "created_at"]

    def validate_phone(self, value):
        if not value.isdigit() or len(value) != 10 or value[0] not in "6789":
            raise serializers.ValidationError("Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9")
        return value

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["college"] = instance.college.name if instance.college else (instance.college_name or "")
        return data

    def update(self, instance, validated_data):
        college_label = validated_data.pop("college", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if college_label is not None:
            college_label = (college_label or "").strip()
            matched_college = College.objects.filter(name__iexact=college_label).first()
            if matched_college:
                instance.college = matched_college
                instance.college_name = ""
            elif college_label:
                instance.college_name = college_label
                instance.college = None
            else:
                instance.college_name = ""
                instance.college = None

        instance.save()
        return instance


class VolunteerOtpRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()
    phone = serializers.CharField()

    def validate_phone(self, value):
        if not value.isdigit() or len(value) != 10 or value[0] not in "6789":
            raise serializers.ValidationError("Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9")
        return value


class VolunteerOtpVerifySerializer(serializers.Serializer):
    otp = serializers.CharField(max_length=6)
    new_password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate_otp(self, value):
        if not value.isdigit() or len(value) != 6:
            raise serializers.ValidationError("OTP must be a 6-digit number")
        return value

    def validate_new_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        if not any(c.isdigit() for c in value):
            raise serializers.ValidationError("Password must contain at least one number.")
        if not any(c.isalpha() for c in value):
            raise serializers.ValidationError("Password must contain at least one letter.")
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

    def validate_new_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        if not any(c.isdigit() for c in value):
            raise serializers.ValidationError("Password must contain at least one number.")
        if not any(c.isalpha() for c in value):
            raise serializers.ValidationError("Password must contain at least one letter.")
        return value

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError("New password and confirm password must match")
        return attrs


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
        if not value.isdigit() or len(value) != 10 or value[0] not in "6789":
            raise serializers.ValidationError("Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9")
        return value

    def update(self, instance, validated_data):
        college_label = validated_data.pop("college", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if college_label is not None:
            college_label = (college_label or "").strip()
            matched_college = College.objects.filter(name__iexact=college_label).first()
            if matched_college:
                instance.college = matched_college
                instance.college_name = ""
            elif college_label:
                instance.college_name = college_label
                instance.college = None
            else:
                instance.college_name = ""
                instance.college = None

        instance.save()
        return instance


class AdminVolunteerActionSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=[("verify", "verify"), ("unverify", "unverify")])


class VolunteerDetailedSerializer(serializers.ModelSerializer):
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
        return float(obj.service_hours.aggregate(total=django_models.Sum('hours'))['total'] or 0)
    
    def get_badges_earned(self, obj):
        from events.serializers import BadgeSerializer
        badges = obj.badges.all()
        return BadgeSerializer(badges, many=True).data
