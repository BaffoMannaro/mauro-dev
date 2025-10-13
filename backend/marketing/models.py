from django.db import models
from django.utils import timezone


class Contact(models.Model):
    company_name = models.CharField(max_length=255)
    email = models.EmailField()
    applications = models.CharField(max_length=255, blank=True)
    message = models.TextField(blank=True)
    privacy_consent = models.BooleanField(default=False)
    marketing_consent = models.BooleanField(default=False)
    language = models.CharField(max_length=5, default="IT")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self) -> str:
        return f"{self.company_name} ({self.email})"


class GDPRConsent(models.Model):
    contact = models.ForeignKey(Contact, related_name="gdpr_consents", on_delete=models.CASCADE)
    consent_timestamp = models.DateTimeField(default=timezone.now)
    legal_document_version = models.CharField(max_length=32)
    form_snapshot = models.JSONField(default=dict)

    def __str__(self) -> str:
        return f"GDPR consent for {self.contact.email} @ {self.consent_timestamp}"

