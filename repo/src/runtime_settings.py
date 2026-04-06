import json
import os
from typing import Dict, Optional


ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SETTINGS_PATH = os.path.join(ROOT_DIR, "config", "runtime_settings.json")


def _read_settings() -> Dict[str, str]:
    if not os.path.exists(SETTINGS_PATH):
        return {}

    try:
        with open(SETTINGS_PATH, "r", encoding="utf-8") as settings_file:
            data = json.load(settings_file)
            return data if isinstance(data, dict) else {}
    except (OSError, json.JSONDecodeError):
        return {}


def _write_settings(settings: Dict[str, str]) -> None:
    os.makedirs(os.path.dirname(SETTINGS_PATH), exist_ok=True)

    with open(SETTINGS_PATH, "w", encoding="utf-8") as settings_file:
        json.dump(settings, settings_file, ensure_ascii=False, indent=2)


def _mask_secret(secret: Optional[str]) -> Optional[str]:
    if not secret:
        return None

    if len(secret) <= 8:
        return "*" * len(secret)

    return f"{secret[:4]}{'*' * (len(secret) - 8)}{secret[-4:]}"


def get_deepseek_api_key() -> Optional[str]:
    settings = _read_settings()
    configured = (settings.get("deepseek_api_key") or "").strip()
    if configured:
        return configured

    env_value = (os.getenv("DEEPSEEK_API_KEY") or "").strip()
    return env_value or None


def set_deepseek_api_key(api_key: str) -> None:
    value = (api_key or "").strip()
    if not value:
        raise ValueError("DeepSeek API Key is required")

    settings = _read_settings()
    settings["deepseek_api_key"] = value
    _write_settings(settings)


def clear_deepseek_api_key() -> None:
    settings = _read_settings()
    if "deepseek_api_key" in settings:
        del settings["deepseek_api_key"]

    _write_settings(settings)


def get_deepseek_config_status() -> Dict[str, Optional[str]]:
    settings = _read_settings()
    configured = (settings.get("deepseek_api_key") or "").strip()
    env_value = (os.getenv("DEEPSEEK_API_KEY") or "").strip()

    if configured:
        secret = configured
        source = "custom"
    elif env_value:
        secret = env_value
        source = "env"
    else:
        secret = None
        source = "none"

    return {
        "provider": "deepseek",
        "configured": bool(secret),
        "source": source,
        "masked_key": _mask_secret(secret),
    }
