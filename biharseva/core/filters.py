import django_filters
from .models import Event, Report, Volunteer

class EventFilter(django_filters.FilterSet):
    """Filter class for Events."""
    district = django_filters.CharFilter(field_name='nss_unit__college__district', lookup_expr='iexact')
    activity_type = django_filters.CharFilter(lookup_expr='iexact')
    is_completed = django_filters.BooleanFilter()

    class Meta:
        model = Event
        fields = ['district', 'activity_type', 'is_completed']


class ReportFilter(django_filters.FilterSet):
    """Filter class for Reports."""
    district = django_filters.CharFilter(lookup_expr='iexact')
    status = django_filters.CharFilter(lookup_expr='iexact')
    assigned_college = django_filters.NumberFilter(field_name='assigned_college__id')

    class Meta:
        model = Report
        fields = ['district', 'status', 'assigned_college']


class VolunteerFilter(django_filters.FilterSet):
    """Filter class for Volunteers."""
    district = django_filters.CharFilter(lookup_expr='iexact')
    is_verified = django_filters.BooleanFilter()
    college = django_filters.NumberFilter(field_name='college__id')

    class Meta:
        model = Volunteer
        fields = ['district', 'is_verified', 'college']
