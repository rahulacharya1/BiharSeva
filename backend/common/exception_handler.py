import logging
from django.conf import settings
from rest_framework.views import exception_handler
from rest_framework.response import Response

logger = logging.getLogger("common")

def standardized_exception_handler(exc, context):
    """
    Custom exception handler for Django REST Framework that wraps error responses
    into the standard format: {"status": "error", "message": "...", "errors": {...}}
    """
    response = exception_handler(exc, context)

    if response is None:
        if settings.DEBUG:
            raise exc
        
        logger.exception("Unhandled server error: %s", exc)
        return Response(
            {
                "status": "error",
                "message": "A server error occurred. Please try again later.",
                "errors": {}
            },
            status=500
        )

    data = response.data
    
    if isinstance(data, dict) and data.get("status") == "error":
        return response

    message = "An error occurred."
    errors = {}

    if isinstance(data, dict):
        if "detail" in data:
            message = str(data.pop("detail"))
        elif "message" in data:
            message = str(data.pop("message"))
        elif "non_field_errors" in data:
            non_field_errors = data.get("non_field_errors")
            if isinstance(non_field_errors, list) and non_field_errors:
                message = str(non_field_errors[0])
            else:
                message = "Validation failed."
        else:
            message = "Validation failed."
        
        errors = data
    elif isinstance(data, list):
        message = "Validation failed."
        errors = {"non_field_errors": data}
    elif isinstance(data, str):
        message = data

    response.data = {
        "status": "error",
        "message": message,
        "errors": errors
    }

    return response
