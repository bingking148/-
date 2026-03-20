"""
API URL配置
"""
from django.urls import path
from . import views

urlpatterns = [
    # 章节API
    path('chapters', views.get_chapters, name='chapters'),

    # 问题API
    path('chapters/<str:chapter_id>/questions', views.get_questions_by_chapter, name='questions_by_chapter'),
    path('questions/<str:question_id>', views.get_question_detail, name='question_detail'),
    path('questions/<str:question_id>/knowledge-points', views.get_knowledge_points, name='knowledge_points'),
    path('questions/<str:question_id>/similar', views.get_similar_questions, name='similar_questions'),

    # 会话API
    path('sessions', views.create_session, name='create_session'),
    path('sessions/<str:session_id>/messages', views.send_message, name='send_message'),
    path('sessions/<str:session_id>/info', views.get_session_info, name='session_info'),
    path('sessions/<str:session_id>', views.delete_session, name='delete_session'),

    # 知识点API
    path('knowledge/chapters', views.get_chapter_knowledge_points, name='chapter_knowledge_points'),
    path('knowledge/<str:knowledge_id>', views.get_knowledge_summary, name='knowledge_summary'),
    path('knowledge/<str:knowledge_id>/title', views.get_knowledge_title, name='knowledge_title'),
    path('knowledge/details/all', views.get_all_knowledge_details, name='all_knowledge_details'),
]
