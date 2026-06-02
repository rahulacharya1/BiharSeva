"""Volunteer notification views — list, read, read-all."""
from rest_framework.decorators import api_view
from rest_framework.response import Response

from ..models import Notification
from .helpers import volunteer_auth_required


@api_view(["GET"])
def api_notifications(request):
    """List notifications for the logged-in volunteer.
    Query params:
        ?unread_only=true  — only unread
    """
    volunteer, error = volunteer_auth_required(request)
    if error:
        return error

    qs = Notification.objects.filter(volunteer=volunteer)

    if request.query_params.get("unread_only", "").lower() == "true":
        qs = qs.filter(is_read=False)

    notifications = qs[:50]
    unread_count = Notification.objects.filter(volunteer=volunteer, is_read=False).count()

    data = []
    for n in notifications:
        data.append({
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "type": n.notification_type,
            "is_read": n.is_read,
            "link": n.link,
            "created_at": n.created_at.isoformat(),
        })

    return Response({"notifications": data, "unread_count": unread_count})


@api_view(["PATCH"])
def api_notification_read(request, notification_id):
    """Mark a single notification as read."""
    volunteer, error = volunteer_auth_required(request)
    if error:
        return error

    notification = Notification.objects.filter(id=notification_id, volunteer=volunteer).first()
    if not notification:
        return Response({"detail": "Notification not found."}, status=404)

    notification.is_read = True
    notification.save(update_fields=["is_read"])
    return Response({"message": "Notification marked as read."})


@api_view(["POST"])
def api_notifications_read_all(request):
    """Mark all notifications as read for the logged-in volunteer."""
    volunteer, error = volunteer_auth_required(request)
    if error:
        return error

    count = Notification.objects.filter(volunteer=volunteer, is_read=False).update(is_read=True)
    return Response({"message": f"{count} notifications marked as read."})
