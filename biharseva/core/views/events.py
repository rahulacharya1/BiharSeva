"""Event listing, registration, and certificate download views."""
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view
from rest_framework.response import Response

from ..auth_utils import get_volunteer_from_request
from ..models import Certificate, Event, EventRegistration
from ..serializers import CertificateSerializer, EventSerializer
from ..filters import EventFilter
from .certificates import build_certificate_pdf_response
from .helpers import volunteer_auth_required


@api_view(["GET"])
def api_events_list(request):
    events = Event.objects.all().order_by("-date")
    
    # Filter query parameters: district, activity_type, is_completed
    filter_set = EventFilter(request.GET, queryset=events)
    if filter_set.is_valid():
        events = filter_set.qs

    registered_event_ids = []
    volunteer = get_volunteer_from_request(request)
    if volunteer:
        registered_event_ids = list(
            EventRegistration.objects.filter(volunteer=volunteer).values_list("event_id", flat=True)
        )
    return Response(
        {
            "events": EventSerializer(events, many=True).data,
            "registered_event_ids": registered_event_ids,
        }
    )


@api_view(["POST"])
def api_event_register(request, pk):
    volunteer, error = volunteer_auth_required(request)
    if error:
        return error

    event = get_object_or_404(Event, pk=pk)
    registration, created = EventRegistration.objects.get_or_create(event=event, volunteer=volunteer)
    if created:
        return Response({"message": "Successfully registered for the event!"}, status=201)
    return Response({"message": "Already registered for this event."})


@api_view(["GET"])
def api_certificates(request):
    volunteer, error = volunteer_auth_required(request)
    if error:
        return error
    certificates = Certificate.objects.filter(volunteer=volunteer).select_related("event").order_by("-issued_date")
    return Response(CertificateSerializer(certificates, many=True).data)


@api_view(["GET"])
def api_certificate_download(request, certificate_id):
    volunteer, error = volunteer_auth_required(request)
    if error:
        return error
    certificate = get_object_or_404(Certificate, id=certificate_id, volunteer=volunteer)
    return build_certificate_pdf_response(certificate, as_attachment=True)


@api_view(["GET"])
def api_certificate_view(request, certificate_id):
    volunteer, error = volunteer_auth_required(request)
    if error:
        return error
    certificate = get_object_or_404(Certificate, id=certificate_id, volunteer=volunteer)
    return build_certificate_pdf_response(certificate, as_attachment=False)
