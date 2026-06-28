from rest_framework import serializers
from common.sanitize import sanitize_text, sanitize_name

class ContactMessageSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    subject = serializers.CharField(max_length=150)
    message = serializers.CharField(max_length=3000)

    def validate_name(self, value):
        return sanitize_name(value)

    def validate_subject(self, value):
        return sanitize_text(value)

    def validate_message(self, value):
        value = sanitize_text(value)
        if not value:
            raise serializers.ValidationError("Message cannot be empty")
        return value
