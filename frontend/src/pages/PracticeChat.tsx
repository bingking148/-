import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';

import ChatComposer from '../components/practice/ChatComposer';
import ChatMessageList from '../components/practice/ChatMessageList';
import {
  APIService,
  getApiErrorMessage,
  type Question,
  type SessionMessage,
  type StreamChunkPayload,
} from '../services/api';

type ChatMessage = { role: 'user' | 'agent'; content: string; node?: string };

const PracticeChat = () => {
  const { chapterId, questionId } = useParams();
  const navigate = useNavigate();
  const [question, setQuestion] = useState<Question | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [streamStatus, setStreamStatus] = useState<{ active: boolean; key: string | null }>({
    active: false,
    key: null,
  });
  const [chatByQuestion, setChatByQuestion] = useState<
    Record<string, { chatHistory: ChatMessage[]; sessionId: string | null }>
  >({});
  const [inputByQuestion, setInputByQuestion] = useState<Record<string, string>>({});
  const streamAbortRef = useRef<AbortController | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const pendingChunkRef = useRef('');
  const flushTimerRef = useRef<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const stickToBottomRef = useRef(true);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const currentNodeRef = useRef<string | undefined>(undefined);

  const chatKey = chapterId && questionId ? `${chapterId}:${questionId}` : '';
  const chatState = chatKey ? chatByQuestion[chatKey] : undefined;
  const chatHistory = chatState?.chatHistory || [];
  const sessionId = chatState?.sessionId || null;
  const input = chatKey ? inputByQuestion[chatKey] || '' : '';
  const isStreaming = streamStatus.active && streamStatus.key === chatKey;

  const questionIndex = useMemo(() => {
    if (!questionId) {
      return -1;
    }
    return questions.findIndex((item) => item.question_id === questionId);
  }, [questionId, questions]);

  const prevQuestionId = useMemo(() => {
    if (questionIndex <= 0) {
      return null;
    }
    return questions[questionIndex - 1]?.question_id || null;
  }, [questionIndex, questions]);

  const nextQuestionId = useMemo(() => {
    if (questionIndex < 0 || questionIndex >= questions.length - 1) {
      return null;
    }
    return questions[questionIndex + 1]?.question_id || null;
  }, [questionIndex, questions]);

  const closeStream = () => {
    if (streamAbortRef.current) {
      streamAbortRef.current.abort();
      streamAbortRef.current = null;
    }
  };

  const flushPendingChunks = () => {
    if (!pendingChunkRef.current) {
      return;
    }
    const value = pendingChunkRef.current;
    pendingChunkRef.current = '';
    appendToLastAgentMessage(value);
  };

  const scheduleFlush = () => {
    if (flushTimerRef.current != null) {
      return;
    }
    flushTimerRef.current = window.setTimeout(() => {
      flushTimerRef.current = null;
      flushPendingChunks();
    }, 50);
  };

  useEffect(() => {
    return () => {
      if (flushTimerRef.current != null) {
        window.clearTimeout(flushTimerRef.current);
        flushTimerRef.current = null;
      }
      closeStream();
    };
  }, []);

  const handleChatScroll = () => {
    const container = chatContainerRef.current;
    if (!container) {
      return;
    }

    const threshold = 80;
    const distanceToBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    stickToBottomRef.current = distanceToBottom <= threshold;
  };

  const hydrateSessionState = (messages: SessionMessage[] = []): ChatMessage[] =>
    messages.map((message) => ({
      role: message.role === 'user' ? 'user' : 'agent',
      content: message.content || '',
      node: message.node,
    }));

  useEffect(() => {
    if (!chapterId || !questionId) {
      navigate('/practice', { replace: true });
      return;
    }

    let cancelled = false;
    setLoading(true);

    Promise.all([
      APIService.getQuestionDetail(questionId),
      APIService.getQuestionsByChapter(chapterId),
      APIService.getLatestSessionByQuestion(questionId),
    ])
      .then(([detail, list, latestSession]) => {
        if (cancelled) {
          return;
        }

        setError(null);
        setQuestion(detail);
        setQuestions(list);
        setChatByQuestion((prev) => {
          if (!chatKey) {
            return prev;
          }

          if (latestSession) {
            return {
              ...prev,
              [chatKey]: {
                chatHistory: hydrateSessionState(latestSession.messages),
                sessionId: latestSession.session_id,
              },
            };
          }

          if (prev[chatKey]) {
            return prev;
          }

          return {
            ...prev,
            [chatKey]: {
              chatHistory: [],
              sessionId: null,
            },
          };
        });
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(getApiErrorMessage(loadError, '题目加载失败'));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [chapterId, chatKey, navigate, questionId]);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) {
      return;
    }

    if (stickToBottomRef.current) {
      container.scrollTop = container.scrollHeight;
    }
  }, [chatHistory]);

  const appendToLastAgentMessage = (chunk: string) => {
    if (!chunk) {
      return;
    }

    setChatByQuestion((prev) => {
      if (!chatKey) {
        return prev;
      }

      const current = prev[chatKey] || { chatHistory: [], sessionId: null };
      if (current.chatHistory.length === 0) {
        return prev;
      }

      const lastMessage = current.chatHistory[current.chatHistory.length - 1];
      if (lastMessage.role !== 'agent') {
        return prev;
      }

      return {
        ...prev,
        [chatKey]: {
          ...current,
          chatHistory: [
            ...current.chatHistory.slice(0, -1),
            {
              ...lastMessage,
              content: `${lastMessage.content}${chunk}`,
              node: currentNodeRef.current || lastMessage.node,
            },
          ],
        },
      };
    });
  };

  const handleSubmit = async () => {
    if (!chapterId || !questionId || !question || !input.trim() || isStreaming) {
      return;
    }

    stickToBottomRef.current = true;
    currentNodeRef.current = undefined;
    const userMessage = input.trim();

    setInputByQuestion((prev) => ({ ...prev, [chatKey]: '' }));
    setChatByQuestion((prev) => {
      const current = prev[chatKey] || { chatHistory: [], sessionId: null };
      return {
        ...prev,
        [chatKey]: {
          ...current,
          chatHistory: [...current.chatHistory, { role: 'user', content: userMessage }],
        },
      };
    });
    setStreamStatus({ active: true, key: chatKey });
    setError(null);

    try {
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        const sessionData = await APIService.createSession(question.question_id);
        currentSessionId = sessionData.session_id;
        setChatByQuestion((prev) => {
          const current = prev[chatKey] || { chatHistory: [], sessionId: null };
          return {
            ...prev,
            [chatKey]: {
              ...current,
              sessionId: currentSessionId,
            },
          };
        });
      }

      setChatByQuestion((prev) => {
        const current = prev[chatKey] || { chatHistory: [], sessionId: null };
        return {
          ...prev,
          [chatKey]: {
            ...current,
            chatHistory: [...current.chatHistory, { role: 'agent', content: '', node: currentNodeRef.current }],
          },
        };
      });

      const controller = new AbortController();
      streamAbortRef.current = controller;

      await APIService.streamSessionMessage(
        currentSessionId,
        userMessage,
        {
          onChunk: (payload: StreamChunkPayload) => {
            if (payload?.content) {
              pendingChunkRef.current += String(payload.content);
              scheduleFlush();
            }
            if (payload?.node) {
              currentNodeRef.current = payload.node;
            }
          },
        },
        controller.signal,
      );

      flushPendingChunks();
      streamAbortRef.current = null;
      setStreamStatus({ active: false, key: null });
    } catch (submitError) {
      flushPendingChunks();
      streamAbortRef.current = null;
      setStreamStatus({ active: false, key: null });

      if (submitError instanceof DOMException && submitError.name === 'AbortError') {
        return;
      }

      const message = getApiErrorMessage(submitError, '网络连接异常，无法连接到智能导师系统');
      setError(message);
      appendToLastAgentMessage(`\n\n[Error: ${message}]`);
    }
  };

  const handleJump = (targetId: string | null) => {
    if (!chapterId || !targetId || isStreaming) {
      return;
    }
    stickToBottomRef.current = true;
    startTransition(() => {
      navigate(`/practice/${chapterId}/${targetId}`);
    });
  };

  const handleClearSession = async () => {
    if (!sessionId || clearing) {
      return;
    }
    setClearing(true);
    try {
      await APIService.deleteSession(sessionId);
      setChatByQuestion((prev) => ({
        ...prev,
        [chatKey]: { chatHistory: [], sessionId: null },
      }));
      setShowClearConfirm(false);
    } catch (err) {
      setError(getApiErrorMessage(err, '清空会话失败'));
    } finally {
      setClearing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent drop-shadow-[0_0_15px_var(--color-accent-dim)]" />
      </div>
    );
  }

  if (!chapterId || !questionId) {
    return null;
  }

  return (
    <div className="mx-auto flex h-[80vh] min-h-[600px] w-full max-w-[1400px] flex-col gap-6">
      <div className="glass-card shrink-0 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              to={`/practice/${chapterId}`}
              className="inline-flex items-center gap-2 rounded-full bg-[rgba(15,23,42,0.03)] px-4 py-2 text-sm transition-colors hover:bg-[rgba(15,23,42,0.05)]"
            >
              <ArrowLeft className="h-4 w-4" />
              返回题目列表
            </Link>
            <div className="text-xs text-[var(--color-text-subtle)]">
              {questionIndex >= 0 ? `${questionIndex + 1}/${questions.length}` : ''}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowClearConfirm(true)}
              disabled={!sessionId || isStreaming || isPending || clearing}
              className="inline-flex items-center gap-1 rounded-full bg-[rgba(15,23,42,0.03)] px-3 py-2 text-sm transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
              title="清空会话"
            >
              <Trash2 className="h-4 w-4" />
              清空
            </button>
            <button
              onClick={() => handleJump(prevQuestionId)}
              disabled={!prevQuestionId || isStreaming || isPending}
              className="inline-flex items-center gap-1 rounded-full bg-[rgba(15,23,42,0.03)] px-3 py-2 text-sm transition-colors hover:bg-[rgba(15,23,42,0.05)] disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              上一题
            </button>
            <button
              onClick={() => handleJump(nextQuestionId)}
              disabled={!nextQuestionId || isStreaming || isPending}
              className="inline-flex items-center gap-1 rounded-full bg-[rgba(15,23,42,0.03)] px-3 py-2 text-sm transition-colors hover:bg-[rgba(15,23,42,0.05)] disabled:opacity-40"
            >
              下一题
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        {error ? <div className="mt-3 text-xs text-red-600">{error}</div> : null}
      </div>

      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="glass-card max-w-sm p-6">
            <h3 className="mb-2 text-lg font-medium text-[var(--color-text)]">确认清空会话</h3>
            <p className="mb-4 text-sm text-[var(--color-text-muted)]">
              确定要清空当前会话吗？此操作不可恢复。
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                disabled={clearing}
                className="rounded-full bg-[rgba(15,23,42,0.03)] px-4 py-2 text-sm transition-colors hover:bg-[rgba(15,23,42,0.05)]"
              >
                取消
              </button>
              <button
                onClick={handleClearSession}
                disabled={clearing}
                className="inline-flex items-center gap-1 rounded-full bg-red-500 px-4 py-2 text-sm text-white transition-colors hover:bg-red-600 disabled:opacity-60"
              >
                {clearing ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                确认
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex min-h-0 flex-1 gap-6">
        <div className="flex min-h-0 w-[420px] shrink-0 flex-col">
          <div className="glass-card flex min-h-0 flex-col border-l-4 border-l-[var(--color-accent)] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.08)]">
            <div className="mb-3 flex shrink-0 items-start">
              <h2 className="text-xl font-medium text-[var(--color-text)]">当前题目</h2>
            </div>
            <div className="glass-scrollbar min-h-0 overflow-y-auto pr-2">
              <div className="whitespace-pre-wrap text-base leading-relaxed text-slate-900" style={{ color: '#0f172a' }}>
                {question?.content || '题目不存在或加载失败。'}
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4">
          <ChatMessageList
            chatHistory={chatHistory}
            containerRef={chatContainerRef}
            onScroll={handleChatScroll}
          />

          <ChatComposer
            input={input}
            setInput={(value) => setInputByQuestion((prev) => ({ ...prev, [chatKey]: value }))}
            disabled={!input.trim() || isStreaming || !question}
            isStreaming={isStreaming}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
};

export default PracticeChat;
