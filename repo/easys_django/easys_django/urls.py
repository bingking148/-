"""
URL configuration for easys_django project - API Only (前后端分离)
"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def api_root(request):
    """API根路径，返回可用API列表"""
    return JsonResponse({
        'message': 'EasyDS API Server',
        'version': '1.0.0',
        'apis': {
            'chapters': '/api/chapters',
            'questions': '/api/chapters/<id>/questions',
            'knowledge': '/api/knowledge/chapters',
            'sessions': '/api/sessions',
        }
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', api_root),
    path('api/', include('apps.api.urls')),
]
