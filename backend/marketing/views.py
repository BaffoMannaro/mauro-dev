import re
from typing import Any, Dict, Tuple

from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from django.conf import settings

from .models import Contact, GDPRConsent
from .serializers import ContactFormSerializer
from .services import post_to_zapier, send_to_salesforce, verify_recaptcha


class ContactFormView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        normalized_data, snapshot = normalize_contact_payload(request.data)

        serializer = ContactFormSerializer(data=normalized_data)
        serializer.is_valid(raise_exception=True)

        validated_data = serializer.validated_data.copy()
        recaptcha_token = validated_data.pop("recaptcha_token", "")

        if not verify_recaptcha(recaptcha_token):
            return Response({"detail": "reCAPTCHA validation failed."}, status=status.HTTP_400_BAD_REQUEST)

        contact = Contact.objects.create(**validated_data)

        form_snapshot = {**snapshot, **validated_data}

        GDPRConsent.objects.create(
            contact=contact,
            legal_document_version=settings.GDPR_LEGAL_VERSION,
            form_snapshot=form_snapshot,
            consent_timestamp=timezone.now(),
        )

        payload = {
            "id": contact.id,
            "company_name": contact.company_name,
            "email": contact.email,
            "applications": contact.applications,
            "message": contact.message,
            "privacy_consent": contact.privacy_consent,
            "marketing_consent": contact.marketing_consent,
            "language": contact.language,
            "form_snapshot": form_snapshot,
            "created_at": contact.created_at.isoformat(),
        }

        post_to_zapier("contact_form", payload)
        send_to_salesforce("contact_form", payload)

        return Response({"message": "Contact request received.", "language": contact.language}, status=status.HTTP_200_OK)
def normalize_contact_payload(payload: Dict[str, Any]) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    """
    Map frontend field names (camelCase / booleans per service, etc.) to serializer fields.
    Returns normalized data for the serializer and a snapshot for auditing.
    """

    def get_value(key: str, default: Any = "") -> Any:
        snake_key = to_snake_case(key)
        return payload.get(key, payload.get(snake_key, default))

    def to_bool(value: Any) -> bool:
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            return value.strip().lower() in {"true", "1", "yes", "on"}
        if isinstance(value, (int, float)):
            return value != 0
        return False

    service_labels = {
        "sanding": "Sanding",
        "polishing": "Polishing",
        "painting": "Painting",
        "other": "Other",
    }

    selected_services = [
        label for key, label in service_labels.items() if to_bool(get_value(key, False))
    ]

    product_types = (get_value("productTypes", "") or "").strip()

    message = (get_value("message", "") or "").strip()
    if product_types:
        suffix = f"Product types: {product_types}"
        message = f"{message}\n{suffix}".strip() if message else suffix

    normalized = {
        "company_name": (get_value("companyName", "") or "").strip(),
        "email": (get_value("email", "") or "").strip(),
        "applications": ", ".join(selected_services),
        "message": message,
        "privacy_consent": to_bool(get_value("privacy", False)),
        "marketing_consent": to_bool(get_value("marketing", False)),
        "language": (get_value("language", "IT") or "IT").upper(),
        "recaptcha_token": get_value("recaptchaToken", ""),
    }

    snapshot = {
        "raw_payload": serialize_payload(payload),
        "services_requested": selected_services,
        "product_types": product_types,
        "applications": normalized["applications"],
        "privacy": normalized["privacy_consent"],
        "marketing": normalized["marketing_consent"],
        "language": normalized["language"],
        "source": (get_value("source", "contact-form") or "contact-form").strip(),
    }

    return normalized, snapshot
def to_snake_case(name: str) -> str:
    name = name.replace("-", "_").replace(" ", "_")
    return re.sub(r"(?<!^)(?=[A-Z])", "_", name).lower()


def serialize_payload(payload: Any) -> Dict[str, Any]:
    if isinstance(payload, dict):
        return payload
    if hasattr(payload, "dict"):
        try:
            return payload.dict()
        except Exception:
            pass
    try:
        return dict(payload)  # type: ignore[arg-type]
    except Exception:
        return {"value": str(payload)}
