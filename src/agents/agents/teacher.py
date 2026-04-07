import os
from typing import Literal

from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langgraph.types import Command

from data.ds_data.data_processing.index_builder import KnowledgeIndexSystem

from ..base import State
from ..models import get_llm

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROMPTS_DIR = os.path.join(os.path.dirname(CURRENT_DIR), 'prompts')
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(CURRENT_DIR)))
DS_INDICES_PATH = os.path.join(ROOT_DIR, 'data', 'ds_data', 'ds_indices.pkl')


async def knowledge_summry_search(knowledge_points: list):
    """Look up summaries for a list of knowledge point ids."""
    try:
        system = await KnowledgeIndexSystem.load_indices_async(DS_INDICES_PATH)
        knowledge_summary = []
        for knowledge_point_id in knowledge_points:
            knowledge_point_info = await system.get_knowledge_point_async(knowledge_point_id)
            if knowledge_point_info:
                knowledge_summary.append(
                    {
                        'knowledge_point': knowledge_point_info['title'],
                        'summry': knowledge_point_info['summry'],
                    }
                )

        if not knowledge_summary:
            return 'No matching knowledge points found.'

        return '\n'.join(
            [f"{item['knowledge_point']}: {item['summry']}" for item in knowledge_summary]
        )
    except Exception as exc:
        return str(exc)


class TeacherAgent:
    def __init__(self, model_type: str = 'deepseek'):
        self.model_type = model_type

    async def __call__(self, state: State, config) -> Command[Literal['tool_node', '__end__']]:
        try:
            current_question = state.question[0]
            evaluation = state.evaluation

            prompt_path = os.path.join(PROMPTS_DIR, 'teacher_agent_prompt.txt')
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
                knowledge_points=current_question['knowledge_points'],
                explanation=current_question['reference_answer']['explanation'],
                is_right=evaluation['is_right'],
                is_complete=evaluation['is_complete'],
                reason=evaluation['reason'],
            )

            llm = get_llm(model_type=self.model_type, api_key=state.api_key)
            tools = [knowledge_summry_search]
            chain = system_prompt | llm.bind_tools(tools)
            teacher_feedback = await chain.ainvoke({'messages': state.messages}, config)
            goto = 'tool_node' if teacher_feedback.tool_calls else '__end__'
            return Command(update={'messages': teacher_feedback}, goto=goto)
        except Exception as exc:
            return Command(update={'log': str(exc)}, goto='__end__')
