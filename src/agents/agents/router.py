import os
from typing import Literal

from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langgraph.types import Command
from typing_extensions import TypedDict

from ..base import State
from ..models import get_llm

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROMPTS_DIR = os.path.join(os.path.dirname(CURRENT_DIR), 'prompts')


class Evaluation(TypedDict):
    is_right: bool
    is_complete: bool
    reason: str
    next_agent: Literal['teacher', 'student']


class RouterAgent:
    def __init__(self, model_type: str = 'qwen2.5'):
        self.model_type = model_type

    async def __call__(self, state: State, config) -> Command[Literal['teacher_agent', 'student_agent']]:
        try:
            current_question = state.question[0]
            prompt_path = os.path.join(PROMPTS_DIR, 'router_agent_prompt.txt')
            with open(prompt_path, 'r', encoding='utf-8') as prompt_file:
                prompt = prompt_file.read()

            prompt_template = ChatPromptTemplate(
                [
                    ('system', prompt),
                    MessagesPlaceholder(variable_name='messages'),
                ]
            )

            system_prompt = prompt_template.partial(
                title=current_question['title'],
                content=current_question['content'],
                answer=current_question['reference_answer']['content'],
                explanation=current_question['reference_answer']['explanation'],
            )

            llm = get_llm(model_type=self.model_type, api_key=state.api_key)
            if self.model_type == 'deepseek':
                chain = system_prompt | llm.with_structured_output(Evaluation, method='function_calling')
            else:
                chain = system_prompt | llm.with_structured_output(Evaluation)

            router_result = await chain.ainvoke({'messages': state.messages}, config)
            goto = 'teacher_agent' if router_result['next_agent'] == 'teacher' else 'student_agent'

            return Command(update={'evaluation': router_result}, goto=goto)
        except Exception as exc:
            return Command(update={'log': str(exc)}, goto='teacher_agent')
