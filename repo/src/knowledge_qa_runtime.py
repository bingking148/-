import asyncio
import os
import unicodedata
from uuid import uuid4
from typing import Dict, List, Optional

from langchain_core.messages import HumanMessage

from data.ds_data.data_processing.index_builder import KnowledgeIndexSystem
from src.agents.models import has_model_access
from src.agents.workflow import create_workflow

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DS_INDICES_PATH = os.path.join(ROOT_DIR, "data", "ds_data", "ds_indices.pkl")


class KnowledgeQASystem:
    def __init__(
        self,
        indices_path: str = DS_INDICES_PATH,
        router_model_type: str = "deepseek",
        teacher_model_type: str = "deepseek",
        student_model_type: str = "deepseek",
    ):
        self.index_system = KnowledgeIndexSystem.load_indices(indices_path)
        self.router_model_type = router_model_type
        self.teacher_model_type = teacher_model_type
        self.student_model_type = student_model_type
        self.workflow = create_workflow(router_model_type, teacher_model_type, student_model_type)
        self.sessions: Dict[str, Dict] = {}

    def _workflow_available(self) -> bool:
        return all(
            [
                has_model_access(self.router_model_type),
                has_model_access(self.teacher_model_type),
                has_model_access(self.student_model_type),
            ]
        )

    def _chunk_text(self, text: str, max_len: int = 30) -> List[str]:
        text = (text or "").strip()
        if not text:
            return []

        chunks: List[str] = []
        current = ""
        split_tokens = "，。；：！？\n"

        for char in text:
            current += char
            if char in split_tokens or len(current) >= max_len:
                chunks.append(current)
                current = ""

        if current:
            chunks.append(current)

        return chunks

    def _contains_cjk(self, text: str) -> bool:
        return any("\u4e00" <= char <= "\u9fff" for char in text)

    def _is_punctuation_only(self, text: str) -> bool:
        stripped = (text or "").strip()
        if not stripped:
            return False

        return all(unicodedata.category(char).startswith("P") for char in stripped)

    def _should_skip_repeated_chunk(self, chunk: str, previous_chunk: str) -> bool:
        if not chunk or chunk != previous_chunk:
            return False

        return self._contains_cjk(chunk) or self._is_punctuation_only(chunk)

    def _build_student_fallback(self, answer: str, question: Dict) -> str:
        reference = question.get("reference_answer", {})
        correct_answer = str(reference.get("content", "")).strip()
        explanation = str(reference.get("explanation", "")).strip()
        user_answer = (answer or "").strip()

        if len(user_answer) <= max(len(correct_answer), 4):
            return (
                "你先给出了结论，但讲解还没有展开。"
                "试着继续补充三点：这道题在判断什么、你为什么排除其他选项、"
                "以及你用什么标准区分线性结构和非线性结构。"
            )

        if correct_answer and correct_answer.lower() in user_answer.lower():
            return (
                "你的方向基本是对的。"
                "现在再往前走一步：不要只说结果，试着把判断依据讲完整，"
                "特别是题目里各个选项分别属于什么结构、为什么。"
            )

        if explanation:
            return (
                "你这次的回答里有一些关键判断还没有对齐题目的核心。"
                "先别急着改答案，先回到题干本身，想一想："
                "这题真正考的是数据元素之间的哪一种关系？"
            )

        return (
            "先把你的思路再展开一点。"
            "这道题不是只看答案字母，而是要说清楚你依据什么结构特征做判断。"
        )

    def _build_teacher_fallback(self, question: Dict) -> str:
        reference = question.get("reference_answer", {})
        correct_answer = str(reference.get("content", "")).strip()
        explanation = str(reference.get("explanation", "")).strip()
        knowledge_titles: List[str] = []

        for knowledge_id in question.get("knowledge_points", []):
            try:
                knowledge = self.index_system.get_knowledge_point(knowledge_id)
            except Exception:
                continue

            title = knowledge.get("title")
            if title:
                knowledge_titles.append(title)

        parts: List[str] = []
        if correct_answer:
            parts.append(f"参考结论：这道题的正确答案是 {correct_answer}。")

        if explanation:
            parts.append(f"判断依据：{explanation}")

        parts.append(
            "做这类题时，可以先判断数据元素之间是不是一对一关系；"
            "如果存在一对多或多对多关系，通常就属于非线性结构。"
        )

        if knowledge_titles:
            parts.append(f"建议你顺手回看这几个知识点：{'、'.join(knowledge_titles[:3])}。")

        return "\n\n".join(parts)

    async def _fallback_stream(self, answer: str, question: Dict):
        fallback_messages = [
            ("student_agent", self._build_student_fallback(answer, question)),
            ("teacher_agent", self._build_teacher_fallback(question)),
        ]

        for node, text in fallback_messages:
            for chunk in self._chunk_text(text):
                yield chunk, node
                await asyncio.sleep(0.02)

    def get_chapters(self) -> List[Dict]:
        chapters = self.index_system.get_chapter_list()
        chapters.sort(key=lambda x: x["id"])
        return chapters

    def chapter_knowledge_points(self) -> Dict[str, List[str]]:
        chapters_knowledge_points = {}
        for chapter_id, chapter_info in self.index_system.chapter_index.items():
            chapters_knowledge_points[chapter_id] = chapter_info["knowledge_points"]
        return chapters_knowledge_points

    def knowledge_points_summary_by_knowledge_id(self, knowledge_id: str) -> str:
        return self.index_system.get_knowledge_point(knowledge_id)["summry"]

    def get_knowledge_name_by_knowledge_id(self, knowledge_id: str) -> str:
        return self.index_system.get_knowledge_point(knowledge_id)["title"]

    def get_questions_by_chapter(self, chapter_id: str) -> List[Dict]:
        questions = []
        for question in self.index_system.get_questions_by_chapter(chapter_id):
            questions.append(
                {
                    "id": question["id"],
                    "title": question["title"],
                    "type": question.get("type", "选择题"),
                    "difficulty": question.get("difficulty", "中等"),
                }
            )
        return questions

    def get_question_detail(self, question_id: str) -> Optional[Dict]:
        return self.index_system.get_question(question_id)

    def create_session(self, question_id: str) -> str:
        question = self.index_system.get_question(question_id)
        if not question:
            raise ValueError(f"找不到问题: {question_id}")

        session_id = str(uuid4())
        self.sessions[session_id] = {
            "question_id": question_id,
            "question": question,
            "status": "created",
            "last_evaluation": {},
        }
        return session_id

    async def process_answer(self, session_id: str, answer: str):
        session = self.sessions.get(session_id)
        if not session:
            raise ValueError(f"找不到会话: {session_id}")

        user_message = HumanMessage(content=answer)
        config = {"configurable": {"thread_id": session_id}}
        inputs = {
            "messages": [user_message],
            "question": [session["question"]],
            "evaluation": {},
            "log": "",
        }

        if self._workflow_available():
            yielded = False
            previous_chunk = ""
            try:
                async for msg, metadata in self.workflow.astream(inputs, config, stream_mode="messages"):
                    content = getattr(msg, "content", "")
                    node = metadata.get("langgraph_node", "system")
                    if node == "router_agent":
                        continue
                    if content:
                        if self._should_skip_repeated_chunk(content, previous_chunk):
                            continue
                        previous_chunk = content
                        yielded = True
                        yield content, node
                if yielded:
                    return
            except Exception as e:
                import logging
                logging.getLogger(__name__).error("Workflow execution failed, falling back: %s", str(e), exc_info=True)

        async for chunk, node in self._fallback_stream(answer, session["question"]):
            yield chunk, node

    def get_session_info(self, session_id: str) -> Dict:
        session = self.sessions.get(session_id)
        if not session:
            raise ValueError(f"找不到会话: {session_id}")

        return {
            "session_id": session_id,
            "question_id": session["question_id"],
            "status": session["status"],
            "last_evaluation": session["last_evaluation"],
        }

    def get_related_knowledge_points(self, question_id: str) -> List[Dict]:
        question = self.get_question_detail(question_id)
        if not question or "knowledge_points" not in question:
            return []

        knowledge_points = []
        for knowledge_id in question["knowledge_points"]:
            knowledge = self.index_system.get_knowledge_point(knowledge_id)
            if knowledge:
                knowledge_points.append(
                    {
                        "id": knowledge_id,
                        "title": knowledge.get("title", ""),
                        "summry": knowledge.get("summry", ""),
                    }
                )
        return knowledge_points

    def get_similar_questions(self, question_id: str, limit: int = 5) -> List[Dict]:
        question = self.get_question_detail(question_id)
        if not question or "knowledge_points" not in question:
            return []

        similar_questions = []
        seen_ids = {question_id}

        for knowledge_id in question["knowledge_points"]:
            questions = self.index_system.get_questions_by_knowledge(knowledge_id)
            for similar_question in questions:
                similar_id = similar_question["id"]
                if similar_id in seen_ids:
                    continue

                similar_questions.append(
                    {
                        "id": similar_id,
                        "title": similar_question["title"],
                        "type": similar_question.get("type", "选择题"),
                    }
                )
                seen_ids.add(similar_id)

                if len(similar_questions) >= limit:
                    return similar_questions

        return similar_questions

    def delete_session(self, session_id: str) -> bool:
        if session_id in self.sessions:
            del self.sessions[session_id]
            return True
        return False
