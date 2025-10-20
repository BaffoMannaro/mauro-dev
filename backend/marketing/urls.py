from django.urls import path

from .views import BrochureFormView, ContactFormView


urlpatterns = [
    path("contact-form/", ContactFormView.as_view(), name="contact-form"),
    path("brochure-form/", BrochureFormView.as_view(), name="brochure-form"),
]
