import os

from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

from src.runtime_settings import get_deepseek_api_key

load_dotenv()


def get_qwen_base_url():
    return (
        os.getenv('QWEN2.5_API_BASE')
        or os.getenv('QWEN2_5_API_BASE')
        or os.getenv('QWEN25_API_BASE')
        or 'http://0.0.0.0:6003/v1'
    )


def has_model_access(model_type: str = 'deepseek', api_key: str | None = None) -> bool:
    if model_type == 'deepseek':
        return bool((api_key or '').strip() or get_deepseek_api_key())
    if model_type == 'qwen2.5':
        return bool(get_qwen_base_url())
    if model_type == 'tongyi':
        return bool(os.getenv('TONGYI_API_KEY') and os.getenv('TONGYI_API_BASE'))
    return False


def get_llm(model_type: str = 'deepseek', **kwargs):
    default_params = {
        'temperature': 0.3,
        'max_tokens': 4096,
        'streaming': True,
    }
    params = {**default_params, **kwargs}

    if model_type == 'deepseek':
        return ChatOpenAI(
            model=params.get('model_name', 'deepseek-chat'),
            openai_api_key=(params.get('api_key') or get_deepseek_api_key()),
            base_url='https://api.deepseek.com',
            temperature=params.get('temperature', 0.3),
            max_tokens=params.get('max_tokens', 4096),
            streaming=params.get('streaming', True),
        )
    if model_type == 'qwen2.5':
        return ChatOpenAI(
            model=params.get('model_name', 'qwen2.5'),
            openai_api_key=params.get('api_key') or 'EMPTY',
            base_url=get_qwen_base_url(),
            temperature=params.get('temperature', 0.3),
            max_tokens=params.get('max_tokens', 4096),
            streaming=params.get('streaming', True),
        )
    if model_type == 'tongyi':
        return ChatOpenAI(
            model=os.getenv('TONGYI_MODEL'),
            openai_api_key=os.getenv('TONGYI_API_KEY'),
            base_url=os.getenv('TONGYI_API_BASE'),
            temperature=params.get('temperature', 0.3),
            max_tokens=params.get('max_tokens', 4096),
            streaming=params.get('streaming', True),
        )

    raise ValueError(f'Unsupported model type: {model_type}')
