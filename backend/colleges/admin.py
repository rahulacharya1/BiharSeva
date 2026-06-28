from django.contrib import admin
from colleges.models import College, NSSUnit, ProgramOfficer

@admin.register(College)
class CollegeAdmin(admin.ModelAdmin):
    list_display = ['name', 'city', 'district', 'code', 'created_at']
    list_filter = ['district', 'created_at']
    search_fields = ['name', 'city', 'code', 'email']


@admin.register(NSSUnit)
class NSSUnitAdmin(admin.ModelAdmin):
    list_display = ['college', 'unit_number', 'name', 'created_at']
    list_filter = ['college', 'created_at']
    search_fields = ['college__name', 'name']


@admin.register(ProgramOfficer)
class ProgramOfficerAdmin(admin.ModelAdmin):
    list_display = ['name', 'nss_unit', 'email', 'phone', 'designation', 'is_active']
    list_filter = ['is_active', 'designation', 'nss_unit__college']
    search_fields = ['name', 'email', 'phone', 'nss_unit__college__name']
