"""
Django settings entrypoint.
"""

import os

environment = (os.environ.get('DJANGO_ENV') or 'dev').strip().lower()

if environment in {'prod', 'production'}:
    from .settings_prod import *  # noqa
else:
    from .settings_dev import *  # noqa
