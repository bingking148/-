from django.contrib import admin

from .models import ConversationMessage, ConversationSession, UserPreference


@admin.register(UserPreference)
class UserPreferenceAdmin(admin.ModelAdmin):
    list_display = ('user', 'updated_at')
    search_fields = ('user__username',)


@admin.register(ConversationSession)
class ConversationSessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'question_id', 'status', 'updated_at')
    list_filter = ('status', 'created_at', 'updated_at')
    search_fields = ('id', 'user__username', 'question_id')


@admin.register(ConversationMessage)
class ConversationMessageAdmin(admin.ModelAdmin):
    list_display = ('session', 'role', 'node', 'created_at')
    list_filter = ('role', 'node', 'created_at')
    search_fields = ('session__id', 'session__user__username', 'content')
