"""
核心视图 - 页面渲染
"""
from django.shortcuts import render


def index_view(request):
    """首页"""
    return render(request, 'index.html')


def problems_view(request):
    """题目列表页"""
    return render(request, 'problems.html')


def knowledge_view(request):
    """知识库页"""
    return render(request, 'knowledge.html')


def chat_view(request, question_id):
    """聊天页"""
    return render(request, 'chat.html', {'question_id': question_id})
