import logging
import os
import sys

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

logger = logging.getLogger(__name__)


class QAService:
    _instance = None
    _qa_system = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if QAService._qa_system is None:
            disable_qa = (os.environ.get('DISABLE_QA_SYSTEM') or '').strip().lower() in {'1', 'true', 'yes'}
            if disable_qa:
                QAService._qa_system = _MockKnowledgeQASystem()
            else:
                try:
                    from src.knowledge_qa_runtime import KnowledgeQASystem

                    logger.info('Initializing KnowledgeQASystem...')
                    QAService._qa_system = KnowledgeQASystem(
                        router_model_type='deepseek',
                        teacher_model_type='deepseek',
                        student_model_type='deepseek',
                    )
                    logger.info('KnowledgeQASystem initialized')
                except Exception as exc:
                    logger.warning('KnowledgeQASystem unavailable, using mock implementation: %s', exc)
                    QAService._qa_system = _MockKnowledgeQASystem()
        self.qa_system = QAService._qa_system

    def get_chapters(self):
        return self.qa_system.get_chapters()

    def get_questions_by_chapter(self, chapter_id):
        return self.qa_system.get_questions_by_chapter(chapter_id)

    def get_question_detail(self, question_id):
        return self.qa_system.get_question_detail(question_id)

    def create_session(self, user, question_id):
        return self.qa_system.create_session(user, question_id)

    def get_latest_session(self, user, question_id):
        return self.qa_system.get_latest_session(user, question_id)

    async def process_answer(self, user, session_id, answer, api_key=None):
        logger.info('QAService.process_answer session_id=%s', session_id)
        try:
            async for chunk, node in self.qa_system.process_answer(
                user,
                session_id,
                answer,
                api_key=api_key,
            ):
                yield chunk, node
        except Exception as exc:
            logger.error('process_answer error: %s', str(exc))
            yield f'处理你的回答时发生错误: {str(exc)}', 'system'

    def get_session_info(self, user, session_id):
        return self.qa_system.get_session_info(user, session_id)

    def get_related_knowledge_points(self, question_id):
        return self.qa_system.get_related_knowledge_points(question_id)

    def get_similar_questions(self, question_id):
        return self.qa_system.get_similar_questions(question_id)

    def delete_session(self, user, session_id):
        return self.qa_system.delete_session(user, session_id)

    def chapter_knowledge_points(self):
        return self.qa_system.chapter_knowledge_points()

    def knowledge_points_summary_by_knowledge_id(self, knowledge_id):
        return self.qa_system.knowledge_points_summary_by_knowledge_id(knowledge_id)

    def get_knowledge_title(self, knowledge_id):
        try:
            return self.qa_system.get_knowledge_name_by_knowledge_id(knowledge_id)
        except Exception as exc:
            logger.error('get_knowledge_title error: %s', str(exc))
            return ''

    def get_all_knowledge_details(self):
        try:
            result = {}
            all_chapter_knowledge_points = self.chapter_knowledge_points()
            for _, knowledge_ids in all_chapter_knowledge_points.items():
                for knowledge_id in knowledge_ids:
                    if knowledge_id not in result:
                        result[knowledge_id] = {
                            'id': knowledge_id,
                            'title': self.get_knowledge_title(knowledge_id),
                        }
            return result
        except Exception as exc:
            logger.error('get_all_knowledge_details error: %s', str(exc))
            return {}


def get_qa_service():
    return QAService()


class _MockKnowledgeQASystem:
    def __init__(self):
        self._chapters = [
            {'id': 'ch1', 'title': '第一章', 'description': '示例章节（后端 Mock）'},
            {'id': 'ch2', 'title': '第二章', 'description': '示例章节（后端 Mock）'},
        ]
        self._questions_by_chapter = {
            'ch1': [
                {'id': 'q1-ch1', 'title': '示例题目 1', 'difficulty': 'easy'},
                {'id': 'q2-ch1', 'title': '示例题目 2', 'difficulty': 'medium'},
            ],
            'ch2': [
                {'id': 'q1-ch2', 'title': '示例题目 1', 'difficulty': 'easy'},
            ],
        }
        self._knowledge_points_by_chapter = {
            'ch1': ['k1', 'k2'],
            'ch2': ['k3'],
        }
        self._knowledge_titles = {
            'k1': '示例知识点 1',
            'k2': '示例知识点 2',
            'k3': '示例知识点 3',
        }

    def get_chapters(self):
        return self._chapters

    def get_questions_by_chapter(self, chapter_id):
        return self._questions_by_chapter.get(chapter_id, [])

    def get_question_detail(self, question_id):
        return {
            'id': question_id,
            'title': f'题目 {question_id}',
            'content': '后端 Mock 模式下的题干示例。',
            'reference_answer': {'content': '', 'explanation': ''},
            'knowledge_points': [],
        }

    def create_session(self, user, question_id):
        return f'session-{question_id}'

    def get_latest_session(self, user, question_id):
        return None

    async def process_answer(self, user, session_id, answer, api_key=None):
        yield f'Mock 反馈：收到答案（{answer}），会话（{session_id}）。', 'assistant'

    def get_session_info(self, user, session_id):
        return {'session_id': session_id, 'status': 'mock', 'messages': []}

    def get_related_knowledge_points(self, question_id):
        return []

    def get_similar_questions(self, question_id):
        return []

    def delete_session(self, user, session_id):
        return True

    def chapter_knowledge_points(self):
        return self._knowledge_points_by_chapter

    def knowledge_points_summary_by_knowledge_id(self, knowledge_id):
        return {'id': knowledge_id, 'summary': '后端 Mock 模式下的知识点概要示例。'}

    def get_knowledge_name_by_knowledge_id(self, knowledge_id):
        return self._knowledge_titles.get(knowledge_id, '')
