# src/agents/models.py
import os
from dotenv import load_dotenv
load_dotenv()

from langchain_openai import ChatOpenAI
from langchain_community.chat_models.tongyi import ChatTongyi
from src.runtime_settings import get_deepseek_api_key

def get_qwen_base_url():
    return (
        os.getenv("QWEN2.5_API_BASE")
        or os.getenv("QWEN2_5_API_BASE")
        or os.getenv("QWEN25_API_BASE")
        or "http://0.0.0.0:6003/v1"
    )

def has_model_access(model_type: str = "deepseek") -> bool:
    if model_type == "deepseek":
        return bool(get_deepseek_api_key())
    if model_type == "qwen2.5":
        return bool(get_qwen_base_url())
    if model_type == "tongyi":
        return bool(os.getenv("TONGYI_API_KEY") and os.getenv("TONGYI_API_BASE"))
    return False

def get_llm(model_type: str = "deepseek", **kwargs):
    """直接获取 LLM 模型实例"""
    
    # 默认参数
    default_params = {
        "temperature": 0.3,
        "max_tokens": 4096,
        "streaming": True
    }
    # 合并用户传入的参数
    params = {**default_params, **kwargs}
    
    if model_type == "deepseek":
        return ChatOpenAI(
            model=params.get("model_name", "deepseek-chat"),
            openai_api_key=params.get("api_key") or get_deepseek_api_key(),
            base_url='https://api.deepseek.com',
            temperature=params.get("temperature", 0.3),
            max_tokens=params.get("max_tokens", 4096),
            streaming=params.get("streaming", True)
        )
    elif model_type == "qwen2.5":
        return ChatOpenAI(
            model=params.get("model_name", "qwen2.5"),
            openai_api_key=params.get("api_key") or "EMPTY",
            base_url=get_qwen_base_url(),
            temperature=params.get("temperature", 0.3),
            max_tokens=params.get("max_tokens", 4096),
            streaming=params.get("streaming", True)
        )
    elif model_type == "tongyi":
        return ChatOpenAI(
            model=os.getenv("TONGYI_MODEL"),
            openai_api_key=os.getenv("TONGYI_API_KEY"),
            base_url=os.getenv("TONGYI_API_BASE"),
            temperature=params.get("temperature", 0.3),
            max_tokens=params.get("max_tokens", 4096),
            streaming=params.get("streaming", True)
        )
    else:
        raise ValueError(f"不支持的模型类型: {model_type}")
