import django_filters
from reports.models import Report

class ReportFilter(django_filters.FilterSet):
    """Filter class for Reports."""
    district = django_filters.CharFilter(lookup_expr='iexact')
    status = django_filters.CharFilter(lookup_expr='iexact')
    assigned_college = django_filters.NumberFilter(field_name='assigned_college__id')

    class Meta:
        model = Report
        fields = ['district', 'status', 'assigned_college']
