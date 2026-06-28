from rest_framework import serializers
from colleges.models import College, NSSUnit, ProgramOfficer

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

    def validate_phone(self, value):
        if value:
            if not value.isdigit() or len(value) != 10 or value[0] not in "6789":
                raise serializers.ValidationError("Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9")
        return value


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

    def validate_phone(self, value):
        if not value.isdigit() or len(value) != 10 or value[0] not in "6789":
            raise serializers.ValidationError("Enter a valid 10-digit mobile number starting with 6, 7, 8, or 9")
        return value

    def get_unit_info(self, obj):
        return {
            "unit_id": obj.nss_unit.id,
            "college": obj.nss_unit.college.name,
            "unit_number": obj.nss_unit.unit_number,
        }
