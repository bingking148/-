import os
from typing import Dict, Optional


def mask_secret(secret: Optional[str]) -> Optional[str]:
    if not secret:
        return None
    if len(secret) <= 8:
        return '*' * len(secret)
    return f"{secret[:4]}{'*' * (len(secret) - 8)}{secret[-4:]}"


def get_deepseek_api_key() -> Optional[str]:
    env_value = (os.getenv('DEEPSEEK_API_KEY') or '').strip()
    return env_value or None


def get_deepseek_config_status(custom_key: Optional[str] = None) -> Dict[str, Optional[str]]:
    custom_value = (custom_key or '').strip()
    env_value = (os.getenv('DEEPSEEK_API_KEY') or '').strip()

    if custom_value:
        secret = custom_value
        source = 'personal'
    elif env_value:
        secret = env_value
        source = 'env'
    else:
        secret = None
        source = 'none'

    return {
        'provider': 'deepseek',
        'configured': bool(secret),
        'source': source,
        'masked_key': mask_secret(secret),
    }
