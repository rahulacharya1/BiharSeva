import django_filters
from events.models import Event

class EventFilter(django_filters.FilterSet):
    """Filter class for Events."""
    district = django_filters.CharFilter(field_name='nss_unit__college__district', lookup_expr='iexact')
    activity_type = django_filters.CharFilter(lookup_expr='iexact')
    is_completed = django_filters.BooleanFilter()

    class Meta:
        model = Event
        fields = ['district', 'activity_type', 'is_completed']
