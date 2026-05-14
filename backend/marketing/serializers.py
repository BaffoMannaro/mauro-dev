from rest_framework import serializers

from .models import Contact


class ContactFormSerializer(serializers.ModelSerializer):
    email = serializers.EmailField()
    recaptcha_token = serializers.CharField(write_only=True, allow_blank=True, required=False)

    class Meta:
        model = Contact
        fields = (
            "company_name",
            "email",
            "applications",
            "message",
            "privacy_consent",
            "marketing_consent",
            "language",
            "recaptcha_token",
        )

    def validate(self, attrs):
        if not attrs.get("privacy_consent"):
            raise serializers.ValidationError({"privacy_consent": "Consent is required to submit the form."})
        return attrs


class BrochureFormSerializer(serializers.Serializer):
    name = serializers.CharField()
    email = serializers.EmailField()
    privacy = serializers.BooleanField()
    marketing = serializers.BooleanField(required=False, default=False)
    recaptcha_token = serializers.CharField(write_only=True, allow_blank=True, required=False)

    def validate_privacy(self, value):
        if not value:
            raise serializers.ValidationError("Consent is required to download the brochure.")
        return value
