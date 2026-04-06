"""
Development settings.
"""
from .settings_base import *  # noqa
import os

DEBUG = True

ALLOWED_HOSTS = [
    host.strip() for host in os.environ.get('DJANGO_ALLOWED_HOSTS', '127.0.0.1,localhost').split(',') if host.strip()
]

CORS_ALLOW_ALL_ORIGINS = os.environ.get('CORS_ALLOW_ALL_ORIGINS', 'True').lower() == 'true'
CORS_ALLOW_CREDENTIALS = True

# Local development convenience
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

# Backward-compatible DB env mapping for local development
if not os.environ.get('POSTGRES_PASSWORD') and os.environ.get('PGPASSWORD'):
    DATABASES['default']['PASSWORD'] = os.environ.get('PGPASSWORD')

if not os.environ.get('POSTGRES_USER') and os.environ.get('PGUSER'):
    DATABASES['default']['USER'] = os.environ.get('PGUSER')

# Force dev defaults so local startup works without env vars
DATABASES['default']['USER'] = os.environ.get('POSTGRES_USER') or os.environ.get('PGUSER') or 'postgres'
DATABASES['default']['PASSWORD'] = os.environ.get('POSTGRES_PASSWORD') or os.environ.get('PGPASSWORD') or '040814'
DATABASES['default']['HOST'] = os.environ.get('POSTGRES_HOST') or '127.0.0.1'
DATABASES['default']['PORT'] = os.environ.get('POSTGRES_PORT') or '5432'
