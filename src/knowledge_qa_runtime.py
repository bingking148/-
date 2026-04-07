import asyncio
import logging
import os
import unicodedata
from typing import Dict, List, Optional

from asgiref.sync import sync_to_async
from langchain_core.messages import AIMessage, HumanMessage

from apps.api.models import ConversationMessage, ConversationSession
from data.ds_data.data_processing.index_builder import KnowledgeIndexSystem
from src.agents.models import has_model_access
from src.agents.workflow import create_workflow

logger = logging.getLogger(__name__)

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DS_INDICES_PATH = os.path.join(ROOT_DIR, 'data', 'ds_data', 'ds_indices.pkl')


class KnowledgeQASystem:
    def __init__(
        self,
        indices_path: str = DS_INDICES_PATH,
        router_model_type: str = 'deepseek',
        teacher_model_type: str = 'deepseek',
        student_model_type: str = 'deepseek',
    ):
        self.index_system = KnowledgeIndexSystem.load_indices(indices_path)
        self.router_model_type = router_model_type
        self.teacher_model_type = teacher_model_type
        self.student_model_type = student_model_type
        self.workflow = create_workflow(router_model_type, teacher_model_type, student_model_type)

    def _normalize_question(self, question: Optional[Dict]) -> Dict:
        if not question:
            raise ValueError('Question not found')

        normalized = dict(question)
        normalized['content'] = normalized.get('content') or normalized.get('stem') or normalized.get('title') or ''
        normalized['title'] = normalized.get('title') or normalized['content'][:80] or normalized.get('id', '')

        reference_answer = normalized.get('reference_answer') or {}
        normalized['reference_answer'] = {
            'content': reference_answer.get('content', ''),
            'explanation': reference_answer.get('explanation', ''),
        }
        normalized['knowledge_points'] = list(normalized.get('knowledge_points') or [])
        return normalized

    def _require_authenticated_user(self, user):
        if user is None or not getattr(user, 'is_authenticated', False):
            raise ValueError('Authentication required')

    def _workflow_available(self, api_key: str | None = None) -> bool:
        return all(
            [
                has_model_access(self.router_model_type, api_key=api_key),
                has_model_access(self.teacher_model_type, api_key=api_key),
                has_model_access(self.student_model_type, api_key=api_key),
            ]
        )

    def _chunk_text(self, text: str, max_len: int = 30) -> List[str]:
        text = (text or '').strip()
        if not text:
            return []

        chunks: List[str] = []
        current = ''
        split_tokens = '，。；：！？\n'

        for char in text:
            current += char
            if char in split_tokens or len(current) >= max_len:
                chunks.append(current)
                current = ''

        if current:
            chunks.append(current)

        return chunks

    def _contains_cjk(self, text: str) -> bool:
        return any('\u4e00' <= char <= '\u9fff' for char in text)

    def _is_punctuation_only(self, text: str) -> bool:
        stripped = (text or '').strip()
        if not stripped:
            return False
        return all(unicodedata.category(char).startswith('P') for char in stripped)

    def _should_skip_repeated_chunk(self, chunk: str, previous_chunk: str) -> bool:
        if not chunk or chunk != previous_chunk:
            return False
        return self._contains_cjk(chunk) or self._is_punctuation_only(chunk)

    def _build_student_fallback(self, answer: str, question: Dict) -> str:
        reference = question.get('reference_answer', {})
        correct_answer = str(reference.get('content', '')).strip()
        explanation = str(reference.get('explanation', '')).strip()
        user_answer = (answer or '').strip()

        if len(user_answer) <= max(len(correct_answer), 4):
            return (
                '你先给出了结论，但讲解还没有展开。'
                '请继续补充三点：这道题在判断什么、你为什么排除其他选项、'
                '以及你是用什么标准区分线性结构和非线性结构。'
            )

        if correct_answer and correct_answer.lower() in user_answer.lower():
            return (
                '你的方向基本是对的。'
                '现在再往前走一步：不要只说结果，试着把判断依据讲完整，'
                '特别是题目里各个选项分别属于什么结构、为什么。'
            )

        if explanation:
            return (
                '你这次的回答里有一些关键判断还没有对齐题目的核心。'
                '先别急着改答案，先回到题干本身想一想：'
                '这题真正考的是数据元素之间的哪一种关系？'
            )

        return '先把你的思路再展开一点。这道题不是只看答案字母，而是要说明你依据什么结构特征做判断。'

    def _build_teacher_fallback(self, question: Dict) -> str:
        reference = question.get('reference_answer', {})
        correct_answer = str(reference.get('content', '')).strip()
        explanation = str(reference.get('explanation', '')).strip()
        knowledge_titles: List[str] = []

        for knowledge_id in question.get('knowledge_points', []):
            try:
                knowledge = self.index_system.get_knowledge_point(knowledge_id)
            except Exception:
                continue

            title = knowledge.get('title')
            if title:
                knowledge_titles.append(title)

        parts: List[str] = []
        if correct_answer:
            parts.append(f'参考结论：这道题的正确答案是 {correct_answer}。')

        if explanation:
            parts.append(f'判断依据：{explanation}')

        parts.append(
            '做这类题时，可以先判断数据元素之间是不是一对一关系。'
            '如果存在一对多或多对多关系，通常就属于非线性结构。'
        )

        if knowledge_titles:
            parts.append(f"建议你顺手回看这几个知识点：{'、'.join(knowledge_titles[:3])}。")

        return '\n\n'.join(parts)

    async def _fallback_stream(self, answer: str, question: Dict):
        text = '请先配置 API Key 后再开始对话。你可以在「模型设置」页面中填写你的 DeepSeek API Key。'
        for chunk in self._chunk_text(text):
            yield chunk, 'system'
            await asyncio.sleep(0.02)

    def _get_session(self, user, session_id: str) -> ConversationSession:
        self._require_authenticated_user(user)
        try:
            return ConversationSession.objects.get(id=session_id, user=user)
        except ConversationSession.DoesNotExist as exc:
            raise ValueError(f'Session not found: {session_id}') from exc

    def _session_payload(self, session: ConversationSession) -> Dict:
        return {
            'session_id': str(session.id),
            'question_id': session.question_id,
            'status': session.status,
            'last_evaluation': session.last_evaluation,
            'messages': [
                {
                    'role': message.role,
                    'content': message.content,
                    'node': message.node,
                    'created_at': message.created_at.isoformat(),
                }
                for message in session.messages.all()
            ],
        }

    def _build_message_history(self, session: ConversationSession):
        history = []
        for message in session.messages.all():
            if message.role == ConversationMessage.ROLE_USER:
                history.append(HumanMessage(content=message.content))
            else:
                history.append(AIMessage(content=message.content))
        return history

    def _append_user_message(self, session_id: str, answer: str) -> ConversationSession:
        session = ConversationSession.objects.prefetch_related('messages').get(id=session_id)
        ConversationMessage.objects.create(
            session=session,
            role=ConversationMessage.ROLE_USER,
            content=answer,
            node='user',
        )

        session.status = ConversationSession.STATUS_STREAMING
        session.last_evaluation = {}
        session.save(update_fields=['status', 'last_evaluation', 'updated_at'])

        return ConversationSession.objects.prefetch_related('messages').get(id=session_id)

    def _finalize_session(
        self,
        session_id: str,
        agent_content: str,
        last_node: str,
        completed: bool,
    ) -> None:
        session = ConversationSession.objects.get(id=session_id)
        if agent_content:
            ConversationMessage.objects.create(
                session=session,
                role=ConversationMessage.ROLE_AGENT,
                content=agent_content,
                node=last_node,
            )

        session.status = (
            ConversationSession.STATUS_COMPLETED if completed else ConversationSession.STATUS_FAILED
        )
        session.save(update_fields=['status', 'updated_at'])

    def get_chapters(self) -> List[Dict]:
        chapters = self.index_system.get_chapter_list()
        chapters.sort(key=lambda item: item['id'])
        return chapters

    def chapter_knowledge_points(self) -> Dict[str, List[str]]:
        chapters_knowledge_points = {}
        for chapter_id, chapter_info in self.index_system.chapter_index.items():
            chapters_knowledge_points[chapter_id] = chapter_info['knowledge_points']
        return chapters_knowledge_points

    def knowledge_points_summary_by_knowledge_id(self, knowledge_id: str) -> str:
        return self.index_system.get_knowledge_point(knowledge_id)['summry']

    def get_knowledge_name_by_knowledge_id(self, knowledge_id: str) -> str:
        return self.index_system.get_knowledge_point(knowledge_id)['title']

    def get_questions_by_chapter(self, chapter_id: str) -> List[Dict]:
        questions = []
        for question in self.index_system.get_questions_by_chapter(chapter_id):
            normalized = self._normalize_question(question)
            questions.append(
                {
                    'id': normalized['id'],
                    'title': normalized['title'],
                    'content': normalized['content'],
                    'type': normalized.get('type', '选择题'),
                    'difficulty': normalized.get('difficulty', '中等'),
                }
            )
        return questions

    def get_question_detail(self, question_id: str) -> Optional[Dict]:
        question = self.index_system.get_question(question_id)
        if not question:
            return None
        return self._normalize_question(question)

    def create_session(self, user, question_id: str) -> str:
        self._require_authenticated_user(user)
        question = self.get_question_detail(question_id)
        if not question:
            raise ValueError(f'Question not found: {question_id}')

        session = ConversationSession.objects.create(user=user, question_id=question_id)
        return str(session.id)

    def get_latest_session(self, user, question_id: str) -> Optional[Dict]:
        self._require_authenticated_user(user)
        session = (
            ConversationSession.objects.filter(user=user, question_id=question_id)
            .prefetch_related('messages')
            .first()
        )
        if session is None:
            return None
        return self._session_payload(session)

    async def process_answer(self, user, session_id: str, answer: str, api_key: str | None = None):
        session = await sync_to_async(self._get_session)(user, session_id)
        question = self.get_question_detail(session.question_id)
        if not question:
            raise ValueError(f'Question not found: {session.question_id}')

        session = await sync_to_async(self._append_user_message)(str(session.id), answer)
        history = self._build_message_history(session)

        inputs = {
            'messages': history,
            'question': [question],
            'evaluation': session.last_evaluation or {},
            'api_key': api_key,
            'log': '',
        }

        agent_chunks: List[str] = []
        last_node = 'system'
        completed = False

        try:
            if self._workflow_available(api_key):
                yielded = False
                previous_chunk = ''
                try:
                    async for message, metadata in self.workflow.astream(inputs, stream_mode='messages'):
                        content = getattr(message, 'content', '')
                        node = metadata.get('langgraph_node', 'system')
                        if node == 'router_agent':
                            continue
                        if not content:
                            continue
                        if self._should_skip_repeated_chunk(content, previous_chunk):
                            continue

                        previous_chunk = content
                        yielded = True
                        last_node = node
                        agent_chunks.append(content)
                        yield content, node

                    if yielded:
                        completed = True
                        return
                except Exception as exc:
                    logger.error('Workflow execution failed, falling back: %s', str(exc), exc_info=True)

            async for chunk, node in self._fallback_stream(answer, question):
                last_node = node
                agent_chunks.append(chunk)
                yield chunk, node

            completed = True
        finally:
            agent_content = ''.join(agent_chunks).strip()
            await sync_to_async(self._finalize_session)(
                str(session.id),
                agent_content,
                last_node,
                completed,
            )

    def get_session_info(self, user, session_id: str) -> Dict:
        session = ConversationSession.objects.prefetch_related('messages').get(
            id=self._get_session(user, session_id).id
        )
        return self._session_payload(session)

    def get_related_knowledge_points(self, question_id: str) -> List[Dict]:
        question = self.get_question_detail(question_id)
        if not question or 'knowledge_points' not in question:
            return []

        knowledge_points = []
        for knowledge_id in question['knowledge_points']:
            knowledge = self.index_system.get_knowledge_point(knowledge_id)
            if knowledge:
                knowledge_points.append(
                    {
                        'id': knowledge_id,
                        'title': knowledge.get('title', ''),
                        'summry': knowledge.get('summry', ''),
                    }
                )
        return knowledge_points

    def get_similar_questions(self, question_id: str, limit: int = 5) -> List[Dict]:
        question = self.get_question_detail(question_id)
        if not question or 'knowledge_points' not in question:
            return []

        similar_questions = []
        seen_ids = {question_id}

        for knowledge_id in question['knowledge_points']:
            questions = self.index_system.get_questions_by_knowledge(knowledge_id)
            for similar_question in questions:
                similar_id = similar_question['id']
                if similar_id in seen_ids:
                    continue

                normalized = self._normalize_question(similar_question)
                similar_questions.append(
                    {
                        'id': similar_id,
                        'title': normalized['title'],
                        'content': normalized['content'],
                        'type': normalized.get('type', '选择题'),
                    }
                )
                seen_ids.add(similar_id)

                if len(similar_questions) >= limit:
                    return similar_questions

        return similar_questions

    def delete_session(self, user, session_id: str) -> bool:
        session = self._get_session(user, session_id)
        deleted_count, _ = session.delete()
        return deleted_count > 0
