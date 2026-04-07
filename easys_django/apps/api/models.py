import uuid

from django.conf import settings
from django.db import models


class UserPreference(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='api_preference',
    )
    deepseek_api_key = models.CharField(max_length=512, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f'UserPreference(user={self.user_id})'


class ConversationSession(models.Model):
    STATUS_CREATED = 'created'
    STATUS_STREAMING = 'streaming'
    STATUS_COMPLETED = 'completed'
    STATUS_FAILED = 'failed'

    STATUS_CHOICES = [
        (STATUS_CREATED, 'Created'),
        (STATUS_STREAMING, 'Streaming'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_FAILED, 'Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='conversation_sessions',
    )
    question_id = models.CharField(max_length=64, db_index=True)
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default=STATUS_CREATED)
    last_evaluation = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at', '-created_at']

    def __str__(self) -> str:
        return f'ConversationSession(id={self.id}, user={self.user_id}, question={self.question_id})'


class ConversationMessage(models.Model):
    ROLE_USER = 'user'
    ROLE_AGENT = 'agent'

    ROLE_CHOICES = [
        (ROLE_USER, 'User'),
        (ROLE_AGENT, 'Agent'),
    ]

    session = models.ForeignKey(
        ConversationSession,
        on_delete=models.CASCADE,
        related_name='messages',
    )
    role = models.CharField(max_length=16, choices=ROLE_CHOICES)
    node = models.CharField(max_length=64, blank=True, default='')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at', 'id']

    def __str__(self) -> str:
        return f'ConversationMessage(session={self.session_id}, role={self.role})'
