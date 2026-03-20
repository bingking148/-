"""
核心URL配置 - 页面路由
"""
from django.urls import path
from . import views

urlpatterns = [
    path('', views.index_view, name='index'),
    path('problems/', views.problems_view, name='problems'),
    path('knowledge/', views.knowledge_view, name='knowledge'),
    path('chat/<str:question_id>/', views.chat_view, name='chat'),
]
