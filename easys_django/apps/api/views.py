"""
API视图 - RESTful API接口
"""
import json
import logging
import asyncio
from functools import wraps
from django.http import StreamingHttpResponse, JsonResponse
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from apps.core.services import get_qa_service

logger = logging.getLogger(__name__)

# 获取服务实例
qa_service = get_qa_service()


def api_error_handler(func):
    """统一处理API异常，减少重复代码。"""

    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except ValueError as e:
            return Response({'detail': str(e)}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.exception('API error in %s: %s', func.__name__, str(e))
            return Response({'detail': '服务器内部错误'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return wrapper


# ==================== 章节相关API ====================

@api_view(['GET'])
@api_error_handler
def get_chapters(request):
    """获取所有章节"""
    chapters = qa_service.get_chapters()
    return Response(chapters)


# ==================== 问题相关API ====================

@api_view(['GET'])
@api_error_handler
def get_questions_by_chapter(request, chapter_id):
    """获取章节下的问题列表"""
    questions = qa_service.get_questions_by_chapter(chapter_id)
    return Response(questions)


@api_view(['GET'])
@api_error_handler
def get_question_detail(request, question_id):
    """获取问题详情"""
    question = qa_service.get_question_detail(question_id)
    if not question:
        return Response({'detail': f'问题未找到: {question_id}'}, status=status.HTTP_404_NOT_FOUND)
    return Response(question)


@api_view(['GET'])
@api_error_handler
def get_knowledge_points(request, question_id):
    """获取问题相关知识点"""
    kps = qa_service.get_related_knowledge_points(question_id)
    return Response(kps)


@api_view(['GET'])
@api_error_handler
def get_similar_questions(request, question_id):
    """获取相似问题"""
    questions = qa_service.get_similar_questions(question_id)
    return Response(questions)


# ==================== 会话相关API ====================

@api_view(['POST'])
@api_error_handler
def create_session(request):
    """创建新会话"""
    question_id = request.data.get('question_id')
    if not question_id:
        return Response({'detail': 'question_id是必需的'}, status=status.HTTP_400_BAD_REQUEST)

    session_id = qa_service.create_session(question_id)
    return Response({'session_id': session_id})


@api_view(['GET'])
@api_error_handler
def get_session_info(request, session_id):
    """获取会话信息"""
    info = qa_service.get_session_info(session_id)
    return Response(info)


@api_view(['DELETE'])
@api_error_handler
def delete_session(request, session_id):
    """删除会话"""
    success = qa_service.delete_session(session_id)
    if not success:
        return Response({'detail': f'会话未找到: {session_id}'}, status=status.HTTP_404_NOT_FOUND)
    return Response({'message': '会话已删除'})


@require_http_methods(['GET'])
def send_message(request, session_id):
    """发送消息并获取流式响应 (SSE)"""
    content = request.GET.get('content')
    if not content:
        return JsonResponse({'detail': 'content is required'}, status=400)

    logger.info('Message request - session_id: %s, content_len: %s', session_id, len(content))

    def event_generator():
        logger.info('Starting event stream for session_id=%s', session_id)
        loop = None
        async_gen = None
        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            async_gen = qa_service.process_answer(session_id, content)

            while True:
                try:
                    chunk, node = loop.run_until_complete(async_gen.__anext__())
                    data = json.dumps({'content': chunk, 'node': node}, ensure_ascii=False)
                    yield f'data: {data}\n\n'
                except StopAsyncIteration:
                    break

            logger.info('Message generation completed for session_id=%s', session_id)
            yield 'event: end\ndata: \n\n'
        except ValueError as e:
            logger.warning('Send message value error session_id=%s err=%s', session_id, str(e))
            yield f"event: end\ndata: {json.dumps({'error': str(e)}, ensure_ascii=False)}\n\n"
        except Exception as e:
            logger.exception('Event generator error session_id=%s err=%s', session_id, str(e))
            yield f"event: end\ndata: {json.dumps({'error': '服务器内部错误'}, ensure_ascii=False)}\n\n"
        finally:
            if async_gen is not None:
                try:
                    loop.run_until_complete(async_gen.aclose())
                except Exception:
                    pass
            if loop is not None:
                try:
                    loop.close()
                except Exception:
                    pass

    response = StreamingHttpResponse(event_generator(), content_type='text/event-stream; charset=utf-8')
    response['Cache-Control'] = 'no-cache, no-transform'
    response['X-Accel-Buffering'] = 'no'
    return response


# ==================== 知识点相关API ====================

@api_view(['GET'])
@api_error_handler
def get_chapter_knowledge_points(request):
    """获取所有章节的知识点"""
    knowledge_points = qa_service.chapter_knowledge_points()
    return Response(knowledge_points)


@api_view(['GET'])
@api_error_handler
def get_knowledge_summary(request, knowledge_id):
    """获取指定知识点的概要"""
    summary = qa_service.knowledge_points_summary_by_knowledge_id(knowledge_id)
    if not summary:
        return Response({'detail': f'知识点未找到: {knowledge_id}'}, status=status.HTTP_404_NOT_FOUND)
    return Response(summary)


@api_view(['GET'])
@api_error_handler
def get_knowledge_title(request, knowledge_id):
    """获取指定知识点的标题"""
    title = qa_service.get_knowledge_title(knowledge_id)
    if not title:
        return Response({'detail': f'知识点标题未找到: {knowledge_id}'}, status=status.HTTP_404_NOT_FOUND)
    return Response({'id': knowledge_id, 'title': title})


@api_view(['GET'])
@api_error_handler
def get_all_knowledge_details(request):
    """获取所有知识点的详细信息（ID和标题）"""
    details = qa_service.get_all_knowledge_details()
    return Response(details)
