import logging
from typing import Any, Dict, Optional

import requests
from django.conf import settings
from simple_salesforce import Salesforce, SalesforceAuthenticationFailed

logger = logging.getLogger(__name__)

RECAPTCHA_ENDPOINT = "https://www.google.com/recaptcha/api/siteverify"


def verify_recaptcha(token: str) -> bool:
    """Validate a reCAPTCHA token against Google's API."""
    if not token:
        logger.warning("Missing reCAPTCHA token in submission.")
        return settings.DEBUG

    if token == settings.RECAPTCHA_PUBLIC_KEY:
        logger.warning(
            "Received reCAPTCHA token matching configured public key; skipping verification."  # noqa: E501
        )
        return True

    if not settings.RECAPTCHA_PRIVATE_KEY:
        logger.warning("RECAPTCHA_PRIVATE_KEY not configured; skipping validation.")
        return settings.DEBUG

    try:
        response = requests.post(
            RECAPTCHA_ENDPOINT,
            data={
                "secret": settings.RECAPTCHA_PRIVATE_KEY,
                "response": token,
            },
            timeout=10,
        )
        response.raise_for_status()
        payload = response.json()
        score = payload.get("score", 0.0)
        success = payload.get("success", False) and score >= 0.5
        if not success:
            logger.warning("Failed reCAPTCHA validation: %s", payload)
        return success
    except requests.RequestException as exc:
        logger.error("Error verifying reCAPTCHA: %s", exc)
        return settings.DEBUG


def post_to_zapier(event_type: str, payload: Dict[str, Any]) -> bool:
    """Send payload to the Zapier webhook configured for the given event."""
    webhook_urls = getattr(settings, "ZAPIER_WEBHOOK_URLS", {}) or {}
    webhook_url = webhook_urls.get(event_type) or getattr(settings, "ZAPIER_WEBHOOK_URL", "")

    if not webhook_url:
        logger.debug("No Zapier webhook configured for event %s; skipping notification.", event_type)
        return False

    body = {"event_type": event_type, "payload": payload}
    try:
        response = requests.post(webhook_url, json=body, timeout=10)
        response.raise_for_status()
        logger.info("Zapier webhook delivered for %s.", event_type)
        return True
    except requests.RequestException as exc:
        logger.error("Failed to notify Zapier for %s: %s", event_type, exc)
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("Unexpected error notifying Zapier for %s: %s", event_type, exc)
    return False


def send_to_salesforce(event_type: str, payload: Dict[str, Any]) -> bool:
    """Send payload to Salesforce endpoint if credentials are configured."""

    sf_client = _get_salesforce_client()
    if not sf_client:
        return False

    lead_payload = _build_salesforce_lead(payload)
    if not lead_payload:
        logger.debug("Salesforce payload empty; skipping Salesforce sync.")
        return False

    try:
        result = sf_client.Lead.create(lead_payload)
        if not result.get("success"):
            logger.error("Salesforce lead creation failed: %s", result)
            return False
        logger.info("Salesforce lead created for %s.", payload.get("email"))
        return True
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("Failed to sync with Salesforce: %s", exc)
    return False


_salesforce_client: Optional[Salesforce] = None
_salesforce_creds: Optional[tuple[str, str, str]] = None


def _get_salesforce_client() -> Optional[Salesforce]:
    username = getattr(settings, "SALESFORCE_USERNAME", "")
    password = getattr(settings, "SALESFORCE_PASSWORD", "")
    security_token = getattr(settings, "SALESFORCE_SECURITY_TOKEN", "")

    if not all([username, password, security_token]):
        logger.debug("Salesforce credentials incomplete; skipping Salesforce sync.")
        return None

    global _salesforce_client, _salesforce_creds
    creds = (username, password, security_token)
    if _salesforce_client and _salesforce_creds == creds:
        return _salesforce_client

    try:
        client = Salesforce(
            username=username,
            password=password,
            security_token=security_token,
        )
    except SalesforceAuthenticationFailed as exc:
        logger.error("Salesforce authentication failed: %s", exc)
        return None
    except Exception as exc:
        logger.exception("Unexpected error connecting to Salesforce: %s", exc)
        return None

    _salesforce_client = client
    _salesforce_creds = creds
    return client


def _build_salesforce_lead(payload: Dict[str, Any]) -> Dict[str, Any]:
    company = payload.get("company_name") or "Website Contact"
    email = payload.get("email")
    applications = payload.get("applications")
    message = payload.get("message")

    description_parts = []
    if message:
        description_parts.append(message)
    if applications:
        description_parts.append(f"Applications: {applications}")
    if payload.get("privacy_consent") is not None:
        description_parts.append(f"Privacy consent: {'Yes' if payload['privacy_consent'] else 'No'}")
    if payload.get("marketing_consent") is not None:
        description_parts.append(f"Marketing consent: {'Yes' if payload['marketing_consent'] else 'No'}")
    if payload.get("language"):
        description_parts.append(f"Language: {payload['language']}")

    description = "\n".join(description_parts) or "Website form submission"

    last_name = (
        company
        or (email.split("@")[0] if isinstance(email, str) and "@" in email else "")
        or "Website Lead"
    )

    lead_payload: Dict[str, Any] = {
        "Company": company,
        "LastName": last_name,
        "LeadSource": "Website",
        "Description": description,
    }

    if email:
        lead_payload["Email"] = email

    return lead_payload
