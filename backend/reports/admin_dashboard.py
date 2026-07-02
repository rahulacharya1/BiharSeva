from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta, date
from django.db.models import Q, Count

from reports.models import Report
from colleges.models import College
from events.models import Event, Certificate
from authentication.models import Volunteer
from common.views.helpers import require_staff_api, is_platform_admin

@api_view(["GET"])
def api_platform_admin_dashboard(request):
    """SaaS v3 Platform Admin Analytics overview dashboard endpoint."""
    user = require_staff_api(request)
    if isinstance(user, Response):
        return user
        
    if not is_platform_admin(user):
        return Response({"detail": "Only Platform Administrators have access to this dashboard."}, status=403)

    # 1. LIVE OVERVIEW KPIs
    total_reports = Report.objects.count()
    pending_reports = Report.objects.filter(status="pending").count()
    assigned_reports = Report.objects.filter(status="assigned").count()
    in_progress_reports = Report.objects.filter(status="in_progress").count()
    completed_reports = Report.objects.filter(status="cleaned").count()
    duplicate_reports = Report.objects.filter(status="duplicate").count()
    cancelled_reports = Report.objects.filter(status="cancelled").count()
    overdue_reports = Report.objects.filter(is_overdue=True).count()

    # Assignment method counts
    claimed_reports = Report.objects.filter(assignment_method="claimed").count()
    auto_assigned_reports = Report.objects.filter(assignment_method="auto_assigned").count()
    manual_reports = Report.objects.filter(assignment_method="manual").count()

    # 2. SYSTEM METRICS
    all_assigned = Report.objects.filter(assigned_at__isnull=False)
    all_resp = [(r.assigned_at - r.created_at).total_seconds() for r in all_assigned]
    avg_response_time = round(sum(all_resp) / len(all_resp) / 3600.0, 1) if all_resp else 0.0  # in hours

    all_claimed = Report.objects.filter(claimed_at__isnull=False, assignment_method="claimed")
    all_claim = [(r.claimed_at - r.created_at).total_seconds() for r in all_claimed]
    avg_claim_time = round(sum(all_claim) / len(all_claim) / 3600.0, 1) if all_claim else 0.0  # in hours

    all_cleaned = Report.objects.filter(status="cleaned", assigned_at__isnull=False)
    all_clean = [(r.updated_at - r.assigned_at).total_seconds() for r in all_cleaned]
    avg_cleanup_time = round(sum(all_clean) / len(all_clean) / 3600.0, 1) if all_clean else 0.0  # in hours

    total_assigned_methods = claimed_reports + auto_assigned_reports + manual_reports
    ratio_claimed = round((claimed_reports / total_assigned_methods) * 100, 1) if total_assigned_methods else 0.0
    ratio_auto = round((auto_assigned_reports / total_assigned_methods) * 100, 1) if total_assigned_methods else 0.0

    # 3. COLLEGE PERFORMANCE
    colleges = College.objects.all()
    college_performance = []
    for c in colleges:
        active = Report.objects.filter(assigned_college=c, status__in=["assigned", "in_progress"]).count()
        completed = Report.objects.filter(assigned_college=c, status="cleaned").count()
        
        # average response time for this college
        c_assigned = Report.objects.filter(assigned_college=c, assigned_at__isnull=False)
        c_resp = [(r.assigned_at - r.created_at).total_seconds() for r in c_assigned]
        c_avg_resp = round(sum(c_resp) / len(c_resp) / 3600.0, 1) if c_resp else 0.0
        
        # average cleanup time for this college
        c_cleaned = Report.objects.filter(assigned_college=c, status="cleaned", assigned_at__isnull=False)
        c_clean = [(r.updated_at - r.assigned_at).total_seconds() for r in c_cleaned]
        c_avg_clean = round(sum(c_clean) / len(c_clean) / 3600.0, 1) if c_clean else 0.0
        
        volunteers_count = Volunteer.objects.filter(college=c).count()
        nss_units_count = c.nss_units.count()
        events_count = Event.objects.filter(nss_unit__college=c).count()
        certificates_count = Certificate.objects.filter(event__nss_unit__college=c).count()

        college_performance.append({
            "id": c.id,
            "name": c.name,
            "district": c.district,
            "active_reports": active,
            "completed_reports": completed,
            "avg_response_time": c_avg_resp,
            "avg_cleanup_duration": c_avg_clean,
            "volunteers_count": volunteers_count,
            "nss_units_count": nss_units_count,
            "events_count": events_count,
            "certificates_count": certificates_count
        })

    # 4. DISTRICT ANALYTICS
    districts_summary = []
    unique_districts = set(College.objects.values_list("district", flat=True)) | set(Report.objects.values_list("district", flat=True))
    for dist in unique_districts:
        if not dist:
            continue
        dist_reports_total = Report.objects.filter(district=dist).count()
        dist_reports_cleaned = Report.objects.filter(district=dist, status="cleaned").count()
        dist_colleges = College.objects.filter(district=dist).count()
        dist_volunteers = Volunteer.objects.filter(district=dist).count()
        
        success_rate = round((dist_reports_cleaned / dist_reports_total) * 100, 1) if dist_reports_total else 0.0

        districts_summary.append({
            "district": dist,
            "total_reports": dist_reports_total,
            "cleaned_reports": dist_reports_cleaned,
            "active_colleges": dist_colleges,
            "volunteer_count": dist_volunteers,
            "success_rate": success_rate
        })

    # 5. RECENT ACTIVITY TRENDS (Last 30 Days)
    from django.db.models.functions import TruncDay
    thirty_days_ago = timezone.now() - timedelta(days=30)
    trends_qs = Report.objects.filter(created_at__gte=thirty_days_ago) \
        .annotate(day=TruncDay("created_at")) \
        .values("day") \
        .annotate(count=Count("id")) \
        .order_by("day")
        
    trends = []
    for item in trends_qs:
        trends.append({
            "date": item["day"].strftime("%Y-%m-%d"),
            "count": item["count"]
        })

    return Response({
        "kpis": {
            "total_reports": total_reports,
            "pending_reports": pending_reports,
            "assigned_reports": assigned_reports,
            "in_progress_reports": in_progress_reports,
            "completed_reports": completed_reports,
            "duplicate_reports": duplicate_reports,
            "cancelled_reports": cancelled_reports,
            "overdue_reports": overdue_reports,
            "claimed_reports": claimed_reports,
            "auto_assigned_reports": auto_assigned_reports,
            "manual_reports": manual_reports,
        },
        "system_metrics": {
            "avg_response_time": avg_response_time,
            "avg_claim_time": avg_claim_time,
            "avg_cleanup_time": avg_cleanup_time,
            "ratio_claimed": ratio_claimed,
            "ratio_auto": ratio_auto,
        },
        "college_performance": college_performance,
        "districts_summary": districts_summary,
        "trends": trends
    })
