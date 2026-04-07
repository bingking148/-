import asyncio
import json
import logging
from functools import wraps

from django.contrib.auth import authenticate, get_user_model
from django.http import JsonResponse, StreamingHttpResponse
from django.views.decorators.http import require_http_methods
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.api.models import UserPreference
from apps.core.services import get_qa_service
from src.runtime_settings import get_deepseek_config_status

logger = logging.getLogger(__name__)
User = get_user_model()
qa_service = get_qa_service()


def api_error_handler(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except ValueError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_404_NOT_FOUND)
        except Exception as exc:
            logger.exception('API error in %s: %s', func.__name__, str(exc))
            return Response({'detail': '服务器内部错误'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return wrapper


def build_user_payload(user):
    return {
        'id': user.id,
        'username': user.username,
        'is_staff': user.is_staff,
    }


def get_user_preference(user):
    preference, _ = UserPreference.objects.get_or_create(user=user)
    return preference


def parse_request_json(request):
    if not request.body:
        return {}

    try:
        return json.loads(request.body.decode('utf-8'))
    except (UnicodeDecodeError, json.JSONDecodeError):
        raise ValueError('Invalid JSON payload')


def get_token_from_request(request):
    auth_header = (request.META.get('HTTP_AUTHORIZATION') or '').strip()
    if not auth_header:
        return None

    if auth_header.startswith('Token '):
        return auth_header[6:].strip()
    if auth_header.startswith('Bearer '):
        return auth_header[7:].strip()
    return None


def authenticate_stream_request(request):
    token_key = get_token_from_request(request)
    if not token_key:
        return None

    token = Token.objects.select_related('user').filter(key=token_key).first()
    if token is None or not token.user.is_active:
        return None
    return token.user


@api_view(['POST'])
@permission_classes([AllowAny])
@api_error_handler
def register_user(request):
    username = str(request.data.get('username', '')).strip()
    password = str(request.data.get('password', '')).strip()

    if not username:
        return Response({'detail': 'username is required'}, status=status.HTTP_400_BAD_REQUEST)
    if len(password) < 8:
        return Response({'detail': 'password must be at least 8 characters'}, status=status.HTTP_400_BAD_REQUEST)
    if User.objects.filter(username__iexact=username).exists():
        return Response({'detail': 'username already exists'}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(username=username, password=password)
    get_user_preference(user)
    token, _ = Token.objects.get_or_create(user=user)

    return Response(
        {'token': token.key, 'user': build_user_payload(user)},
        status=status.HTTP_201_CREATED,
    )


@api_view(['POST'])
@permission_classes([AllowAny])
@api_error_handler
def login_user(request):
    username = str(request.data.get('username', '')).strip()
    password = str(request.data.get('password', '')).strip()

    if not username or not password:
        return Response({'detail': 'username and password are required'}, status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(request, username=username, password=password)
    if user is None:
        return Response({'detail': 'invalid username or password'}, status=status.HTTP_400_BAD_REQUEST)

    token, _ = Token.objects.get_or_create(user=user)
    get_user_preference(user)
    return Response({'token': token.key, 'user': build_user_payload(user)})


@api_view(['POST'])
@api_error_handler
def logout_user(request):
    if request.auth:
        request.auth.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@api_error_handler
def current_user(request):
    return Response({'user': build_user_payload(request.user)})


@api_view(['GET'])
@permission_classes([AllowAny])
@api_error_handler
def get_chapters(request):
    return Response(qa_service.get_chapters())


@api_view(['GET'])
@permission_classes([AllowAny])
@api_error_handler
def get_questions_by_chapter(request, chapter_id):
    return Response(qa_service.get_questions_by_chapter(chapter_id))


@api_view(['GET'])
@permission_classes([AllowAny])
@api_error_handler
def get_question_detail(request, question_id):
    question = qa_service.get_question_detail(question_id)
    if not question:
        return Response({'detail': f'Question not found: {question_id}'}, status=status.HTTP_404_NOT_FOUND)
    return Response(question)


@api_view(['GET'])
@permission_classes([AllowAny])
@api_error_handler
def get_knowledge_points(request, question_id):
    return Response(qa_service.get_related_knowledge_points(question_id))


@api_view(['GET'])
@permission_classes([AllowAny])
@api_error_handler
def get_similar_questions(request, question_id):
    return Response(qa_service.get_similar_questions(question_id))


@api_view(['POST'])
@api_error_handler
def create_session(request):
    question_id = request.data.get('question_id')
    if not question_id:
        return Response({'detail': 'question_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    session_id = qa_service.create_session(request.user, question_id)
    return Response({'session_id': session_id})


@api_view(['GET'])
@api_error_handler
def get_latest_session(request, question_id):
    session = qa_service.get_latest_session(request.user, question_id)
    if session is None:
        return Response({'detail': f'No saved session for question: {question_id}'}, status=status.HTTP_404_NOT_FOUND)
    return Response(session)


@api_view(['GET'])
@api_error_handler
def get_session_info(request, session_id):
    return Response(qa_service.get_session_info(request.user, session_id))


@api_view(['DELETE'])
@api_error_handler
def delete_session(request, session_id):
    success = qa_service.delete_session(request.user, session_id)
    if not success:
        return Response({'detail': f'Session not found: {session_id}'}, status=status.HTTP_404_NOT_FOUND)
    return Response({'message': 'Session deleted'})


@require_http_methods(['POST'])
def send_message(request, session_id):
    user = authenticate_stream_request(request)
    if user is None:
        return JsonResponse({'detail': 'Authentication credentials were not provided.'}, status=401)

    try:
        payload = parse_request_json(request)
    except ValueError as exc:
        return JsonResponse({'detail': str(exc)}, status=400)

    content = str(payload.get('content', '')).strip()
    if not content:
        return JsonResponse({'detail': 'content is required'}, status=400)

    preference = UserPreference.objects.filter(user=user).first()
    api_key = (preference.deepseek_api_key if preference else '').strip() or None
    logger.info('Message request session_id=%s content_len=%s user_id=%s', session_id, len(content), user.id)

    def event_generator():
        loop = None
        async_generator = None
        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            async_generator = qa_service.process_answer(user, session_id, content, api_key=api_key)

            while True:
                try:
                    chunk, node = loop.run_until_complete(async_generator.__anext__())
                    data = json.dumps({'content': chunk, 'node': node}, ensure_ascii=False)
                    yield f'data: {data}\n\n'
                except StopAsyncIteration:
                    break

            yield 'event: end\ndata: \n\n'
        except ValueError as exc:
            data = json.dumps({'content': str(exc), 'node': 'system'}, ensure_ascii=False)
            yield f'data: {data}\n\n'
            yield f"event: end\ndata: {json.dumps({'error': str(exc)}, ensure_ascii=False)}\n\n"
        except Exception as exc:
            logger.exception('Event generator error session_id=%s err=%s', session_id, str(exc))
            data = json.dumps({'content': '服务端处理消息时发生错误，请稍后重试。', 'node': 'system'}, ensure_ascii=False)
            yield f'data: {data}\n\n'
            yield f"event: end\ndata: {json.dumps({'error': '服务器内部错误'}, ensure_ascii=False)}\n\n"
        finally:
            if async_generator is not None and loop is not None:
                try:
                    loop.run_until_complete(async_generator.aclose())
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


@api_view(['GET'])
@permission_classes([AllowAny])
@api_error_handler
def get_chapter_knowledge_points(request):
    return Response(qa_service.chapter_knowledge_points())


@api_view(['GET'])
@permission_classes([AllowAny])
@api_error_handler
def get_knowledge_summary(request, knowledge_id):
    summary = qa_service.knowledge_points_summary_by_knowledge_id(knowledge_id)
    if not summary:
        return Response({'detail': f'Knowledge point not found: {knowledge_id}'}, status=status.HTTP_404_NOT_FOUND)
    return Response(summary)


@api_view(['GET'])
@permission_classes([AllowAny])
@api_error_handler
def get_knowledge_title(request, knowledge_id):
    title = qa_service.get_knowledge_title(knowledge_id)
    if not title:
        return Response({'detail': f'Knowledge title not found: {knowledge_id}'}, status=status.HTTP_404_NOT_FOUND)
    return Response({'id': knowledge_id, 'title': title})


@api_view(['GET'])
@permission_classes([AllowAny])
@api_error_handler
def get_all_knowledge_details(request):
    return Response(qa_service.get_all_knowledge_details())


@api_view(['GET', 'PUT', 'DELETE'])
@api_error_handler
def manage_model_settings(request):
    preference = get_user_preference(request.user)

    if request.method == 'GET':
        return Response(get_deepseek_config_status(preference.deepseek_api_key))

    if request.method == 'PUT':
        api_key = str(request.data.get('api_key', '')).strip()
        if not api_key:
            return Response({'detail': 'api_key is required'}, status=status.HTTP_400_BAD_REQUEST)

        preference.deepseek_api_key = api_key
        preference.save(update_fields=['deepseek_api_key', 'updated_at'])
        payload = get_deepseek_config_status(preference.deepseek_api_key)
        payload['message'] = 'DeepSeek API Key saved for current user'
        return Response(payload)

    preference.deepseek_api_key = ''
    preference.save(update_fields=['deepseek_api_key', 'updated_at'])
    payload = get_deepseek_config_status(preference.deepseek_api_key)
    payload['message'] = 'Personal DeepSeek API Key cleared'
    return Response(payload)
