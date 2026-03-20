"""
Production settings.
"""
from .settings_base import *  # noqa
import os

DEBUG = False

if os.environ.get('DJANGO_SECRET_KEY', 'django-insecure-dev-only-change-me') == 'django-insecure-dev-only-change-me':
    raise ValueError('DJANGO_SECRET_KEY is required in production')

ALLOWED_HOSTS = [
    host.strip() for host in os.environ.get('DJANGO_ALLOWED_HOSTS', '').split(',') if host.strip()
]
if not ALLOWED_HOSTS:
    raise ValueError('DJANGO_ALLOWED_HOSTS is required in production')

CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOW_CREDENTIALS = os.environ.get('CORS_ALLOW_CREDENTIALS', 'False').lower() == 'true'

SECURE_SSL_REDIRECT = os.environ.get('SECURE_SSL_REDIRECT', 'True').lower() == 'true'
SECURE_HSTS_SECONDS = int(os.environ.get('SECURE_HSTS_SECONDS', '31536000'))
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
