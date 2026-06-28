import django_filters
from authentication.models import Volunteer

class VolunteerFilter(django_filters.FilterSet):
    """Filter class for Volunteers."""
    district = django_filters.CharFilter(lookup_expr='iexact')
    is_verified = django_filters.BooleanFilter()
    college = django_filters.NumberFilter(field_name='college__id')

    class Meta:
        model = Volunteer
        fields = ['district', 'is_verified', 'college']
