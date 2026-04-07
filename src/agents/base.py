from typing import Annotated, List

from langgraph.graph.message import AnyMessage, add_messages
from pydantic import BaseModel, Field


class State(BaseModel):
    messages: Annotated[List[AnyMessage], add_messages] = Field(default_factory=list, title='messages')
    question: list = Field(default_factory=list, title='question')
    evaluation: dict = Field(default_factory=dict, title='evaluation')
    api_key: str | None = Field(default=None, title='api_key')
    log: str = Field(default='', title='log')
