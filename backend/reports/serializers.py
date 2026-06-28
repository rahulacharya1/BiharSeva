from rest_framework import serializers
from reports.models import Report
from common.sanitize import sanitize_text, sanitize_name

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
            "assigned_college",
            "assigned_admin",
            "assigned_at",
            "target_date",
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

    def validate_reporter_name(self, value):
        return sanitize_name(value)

    def validate_description(self, value):
        return sanitize_text(value)

    def validate_location(self, value):
        return sanitize_text(value)


class AdminReportStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Report.STATUS_CHOICES)


class AdminReportManageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = [
            "reporter_name",
            "district",
            "location",
            "description",
            "status",
            "after_photo",
            "assigned_college",
            "assigned_admin",
            "assigned_at",
            "target_date"
        ]
