from langgraph.graph import START, StateGraph
from langgraph.prebuilt import ToolNode

from .agents.router import RouterAgent
from .agents.student import StudentAgent
from .agents.teacher import TeacherAgent, knowledge_summry_search
from .base import State


def create_workflow(
    router_model_type: str = 'deepseek',
    teacher_model_type: str = 'deepseek',
    student_model_type: str = 'deepseek',
):
    workflow = StateGraph(State)

    router_agent = RouterAgent(model_type=router_model_type)
    student_agent = StudentAgent(model_type=student_model_type)
    teacher_agent = TeacherAgent(model_type=teacher_model_type)

    workflow.add_node('router_agent', router_agent)
    workflow.add_node('student_agent', student_agent)
    workflow.add_node('teacher_agent', teacher_agent)
    workflow.add_node('tool_node', ToolNode([knowledge_summry_search]))

    workflow.add_edge(START, 'router_agent')
    workflow.add_edge('tool_node', 'teacher_agent')
    workflow.add_edge('student_agent', '__end__')
    workflow.add_edge('teacher_agent', '__end__')

    return workflow.compile()
