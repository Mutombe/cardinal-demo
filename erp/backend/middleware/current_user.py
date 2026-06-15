"""Thread-local current user + request metadata for audit trails (single-tenant).

Replaces the user/meta capture that used to live in the tenant middleware.
Lets model save() / signals attribute changes to the acting user without
threading the request object through every call.
"""
import threading

_thread_locals = threading.local()


def get_current_user():
    return getattr(_thread_locals, 'user', None)


def get_current_request_meta():
    return {
        'ip_address': getattr(_thread_locals, 'ip_address', None),
        'user_agent': getattr(_thread_locals, 'user_agent', ''),
    }


def get_current_tenant():
    """Single-tenant — there is no per-request tenant object."""
    return None


def _client_ip(request):
    xff = request.META.get('HTTP_X_FORWARDED_FOR')
    if xff:
        return xff.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


class CurrentUserMiddleware:
    """Stash request.user + ip/user-agent in thread-locals for the duration of
    the request. Place AFTER AuthenticationMiddleware so request.user is set."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        _thread_locals.user = getattr(request, 'user', None)
        _thread_locals.ip_address = _client_ip(request)
        _thread_locals.user_agent = request.META.get('HTTP_USER_AGENT', '')
        try:
            return self.get_response(request)
        finally:
            for attr in ('user', 'ip_address', 'user_agent'):
                if hasattr(_thread_locals, attr):
                    delattr(_thread_locals, attr)
