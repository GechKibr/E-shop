from django.conf import settings
from django.utils.cache import patch_cache_control


class MediaCacheControlMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if request.path.startswith(settings.MEDIA_URL):
            patch_cache_control(response, public=True, max_age=settings.MEDIA_CACHE_SECONDS)
        return response
