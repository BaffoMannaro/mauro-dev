from django.contrib import admin

from .models import Contact, GDPRConsent


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ("company_name", "email", "language", "created_at")
    search_fields = ("company_name", "email")
    list_filter = ("language", "privacy_consent", "marketing_consent")


@admin.register(GDPRConsent)
class GDPRConsentAdmin(admin.ModelAdmin):
    list_display = ("contact", "legal_document_version", "consent_timestamp")
    search_fields = ("contact__email", "legal_document_version")
