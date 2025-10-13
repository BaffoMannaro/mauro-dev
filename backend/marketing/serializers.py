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
