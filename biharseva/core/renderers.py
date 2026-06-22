from rest_framework.renderers import JSONRenderer

class StandardizedJSONRenderer(JSONRenderer):
    """
    Custom JSON renderer that standardizes all API responses into a unified envelope:
    Success (2xx): {"status": "success", "data": ..., "message": "..."}
    Error (non-2xx): {"status": "error", "message": "...", "errors": {...}}
    """
    def render(self, data, accepted_media_type=None, renderer_context=None):
        response = renderer_context.get('response') if renderer_context else None
        
        # Respect 204 No Content
        if response is not None and response.status_code == 204:
            return super().render(data, accepted_media_type, renderer_context)

        # Respect standard file downloads/streams that do not return dictionary/list JSON structure
        # (Though those usually use different renderers, we should be safe)
        if isinstance(data, (bytes, str)) and (response is not None and 'Content-Disposition' in response):
            return super().render(data, accepted_media_type, renderer_context)

        # Handle Success Responses (2xx)
        if response is not None and 200 <= response.status_code < 300:
            # If already enveloped, return as-is
            if isinstance(data, dict) and data.get('status') == 'success' and 'data' in data:
                return super().render(data, accepted_media_type, renderer_context)

            message = "Operation completed successfully"
            payload = data

            if isinstance(data, dict):
                # Work on a copy to avoid mutating the original response.data object in tests/views
                data_copy = dict(data)
                if 'message' in data_copy:
                    message = data_copy.pop('message')
                
                # If popping message leaves the dict empty, make payload None
                if not data_copy:
                    payload = None
                else:
                    payload = data_copy

            standardized_response = {
                "status": "success",
                "data": payload,
                "message": message
            }
            return super().render(standardized_response, accepted_media_type, renderer_context)

        # Handle Error Responses (non-2xx)
        # If already enveloped by exception handler, return as-is
        if isinstance(data, dict) and data.get('status') == 'error' and 'message' in data:
            return super().render(data, accepted_media_type, renderer_context)

        message = "An error occurred."
        errors = {}

        if isinstance(data, dict):
            # Work on a copy to avoid mutating the original response.data object
            data_copy = dict(data)
            if 'detail' in data_copy:
                message = data_copy.pop('detail')
            elif 'message' in data_copy:
                message = data_copy.pop('message')
            elif 'non_field_errors' in data_copy:
                message = data_copy['non_field_errors'][0] if data_copy['non_field_errors'] else "Validation failed."
            else:
                message = "Validation failed."
            errors = data_copy
        elif isinstance(data, list):
            message = "Validation failed."
            errors = {"non_field_errors": data}
        elif isinstance(data, str):
            message = data

        standardized_error = {
            "status": "error",
            "message": str(message),
            "errors": errors
        }
        return super().render(standardized_error, accepted_media_type, renderer_context)
