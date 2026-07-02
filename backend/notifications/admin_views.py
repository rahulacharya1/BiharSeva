from rest_framework.decorators import api_view
from rest_framework.response import Response
from notifications.models import Notification
from common.views.helpers import require_staff_api

@api_view(["GET"])
def api_admin_notifications(request):
    """List notifications for the logged-in staff administrator."""
    user = require_staff_api(request)
    if isinstance(user, Response):
        return user

    qs = Notification.objects.filter(user=user)

    if request.query_params.get("unread_only", "").lower() == "true":
        qs = qs.filter(is_read=False)

    notifications = qs[:50]
    unread_count = Notification.objects.filter(user=user, is_read=False).count()

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
def api_admin_notification_read(request, notification_id):
    """Mark a single admin notification as read."""
    user = require_staff_api(request)
    if isinstance(user, Response):
        return user

    notification = Notification.objects.filter(id=notification_id, user=user).first()
    if not notification:
        return Response({"detail": "Notification not found."}, status=404)

    notification.is_read = True
    notification.save(update_fields=["is_read"])
    return Response({"message": "Notification marked as read."})


@api_view(["POST"])
def api_admin_notifications_read_all(request):
    """Mark all admin notifications as read for the logged-in user."""
    user = require_staff_api(request)
    if isinstance(user, Response):
        return user

    count = Notification.objects.filter(user=user, is_read=False).update(is_read=True)
    return Response({"message": f"{count} notifications marked as read."})
