import os

from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

from ..base import State
from ..models import get_llm

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROMPTS_DIR = os.path.join(os.path.dirname(CURRENT_DIR), 'prompts')


class StudentAgent:
    def __init__(self, model_type: str = 'deepseek'):
        self.model_type = model_type

    async def __call__(self, state: State, config) -> State:
        try:
            current_question = state.question[0]
            evaluation = state.evaluation

            prompt_path = os.path.join(PROMPTS_DIR, 'student_agent_prompt2.txt')
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
                is_right=evaluation['is_right'],
                is_complete=evaluation['is_complete'],
                reason=evaluation['reason'],
            )

            llm = get_llm(model_type=self.model_type, api_key=state.api_key)
            chain = system_prompt | llm
            student_feedback = await chain.ainvoke({'messages': state.messages}, config)
            return {'messages': student_feedback}
        except Exception as exc:
            return {'log': str(exc)}
