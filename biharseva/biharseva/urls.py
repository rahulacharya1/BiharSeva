from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from core.views import *

urlpatterns = [
    path('admin/', admin.site.urls),

    # Static Pages
    path('', home, name='home'),
    path('about/', about, name='about'),
    path('civic-sense/', static_page, {'page': 'civic_sense'}, name='civic_sense'),
    path('traffic-rules/', static_page, {'page': 'traffic_rules'}, name='traffic_rules'),
    path('clean-bihar/', static_page, {'page': 'clean_bihar'}, name='clean_bihar'),
    path('services/', static_page, {'page': 'services'}, name='services'),
    path('contact/', static_page, {'page': 'contact'}, name='contact'),
    path('privacy/', static_page, {'page': 'privacy'}, name='privacy'),
    
    # Report System
    path('report-issue/', report_issue, name='report_issue'),
    path('report-success/', report_success, name='report_success'),
    path('report-gallery/', report_gallery, name='report_gallery'),
    
    # Volunteer System
    path('volunteer/', volunteer_form, name='volunteer_form'),
    path('volunteers/', volunteers_list, name='volunteers'),
    path('volunteer-success/', volunteer_success, name='volunteer_success'),
    
    # Event System
    path('events/', events_list, name='events'),
    path('event/<int:pk>/register/', event_register, name='event_register'),
    
    # Certificate System
    path('certificates/', certificates, name='certificates'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    
