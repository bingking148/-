import axios from 'axios';

import { getStoredAuthToken } from './authStorage';

const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) || '';
const resolvedBaseUrl = rawBaseUrl.trim() ? rawBaseUrl.trim().replace(/\/+$/, '') : '/api';

const api = axios.create({
  baseURL: resolvedBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getStoredAuthToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

export const API_BASE_URL = resolvedBaseUrl;

export interface AuthUser {
  id: number;
  username: string;
  is_staff: boolean;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface Chapter {
  chapter_id: string;
  title: string;
  description: string;
}

export interface Question {
  question_id: string;
  chapter_id: string;
  content: string;
  type?: string;
  difficulty?: string;
}

export interface KnowledgePoint {
  knowledge_id: string;
  title: string;
  summary?: string;
  details?: string;
}

export interface SessionMessage {
  role: 'user' | 'agent';
  content: string;
  node?: string;  // 'teacher_agent' | 'student_agent' | 'router_agent' | etc.
  created_at?: string;
}

export interface SessionDetail {
  session_id: string;
  question_id: string;
  status: string;
  last_evaluation: Record<string, unknown>;
  messages: SessionMessage[];
}

export interface ModelSettingsStatus {
  provider: string;
  configured: boolean;
  source: 'personal' | 'env' | 'none' | string;
  masked_key: string | null;
  message?: string;
}

type KnowledgeSummaryPayload = {
  knowledge_id?: string;
  id?: string;
  title?: string;
  summary?: string;
  summry?: string;
  details?: string;
};

type KnowledgeDetailsPayload = {
  id?: string;
  knowledge_id?: string;
  title?: string;
};

type ChapterPayload = {
  chapter_id?: string;
  id?: string;
  title?: string;
  description?: string;
};

type QuestionPayload = {
  question_id?: string;
  id?: string;
  chapter_id?: string;
  content?: string;
  title?: string;
  stem?: string;
  question?: string;
  type?: string;
  difficulty?: string;
};

type SessionMessagePayload = {
  role?: 'user' | 'agent';
  content?: string;
  node?: string;
  created_at?: string;
};

type SessionPayload = {
  session_id?: string;
  question_id?: string;
  status?: string;
  last_evaluation?: Record<string, unknown>;
  messages?: SessionMessagePayload[];
};

type ApiEnvelope<T> = T | { data?: T };

type CurrentUserResponse = {
  user: AuthUser;
};

export type StreamChunkPayload = {
  content?: string;
  node?: string;
};

type StreamCallbacks = {
  onChunk: (payload: StreamChunkPayload) => void;
};

function unwrapData<T>(payload: ApiEnvelope<T>): T | undefined {
  if (payload && typeof payload === 'object' && !Array.isArray(payload) && 'data' in payload) {
    return payload.data;
  }
  return payload as T;
}

function coerceKnowledgeSummaryPayload(payload: unknown): KnowledgeSummaryPayload {
  if (!payload) {
    return {};
  }

  if (typeof payload === 'string') {
    const text = payload.trim();
    if (!text) {
      return {};
    }

    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as KnowledgeSummaryPayload;
      }
    } catch {
      return { summry: payload };
    }

    return { summry: payload };
  }

  if (typeof payload === 'object' && !Array.isArray(payload)) {
    return payload as KnowledgeSummaryPayload;
  }

  return {};
}

function mapSession(payload: SessionPayload | undefined | null): SessionDetail | null {
  if (!payload?.session_id) {
    return null;
  }

  return {
    session_id: payload.session_id,
    question_id: payload.question_id || '',
    status: payload.status || '',
    last_evaluation: payload.last_evaluation || {},
    messages: Array.isArray(payload.messages)
      ? payload.messages.map((message) => ({
          role: message.role === 'user' ? 'user' : 'agent',
          content: message.content || '',
          node: message.node,
          created_at: message.created_at,
        }))
      : [],
  };
}

export function buildApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  if (/^https?:\/\//i.test(API_BASE_URL)) {
    return `${API_BASE_URL}${normalizedPath}`;
  }
  return `${API_BASE_URL}${normalizedPath}`;
}

async function getWithFallback<T>(paths: string[]) {
  let lastError: unknown;
  for (const path of paths) {
    try {
      return await api.get<T>(path);
    } catch (error) {
      lastError = error;
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 404 || status === 405) {
          continue;
        }
      }
      throw error;
    }
  }
  throw lastError;
}

async function postWithFallback<T>(paths: string[], body: unknown) {
  let lastError: unknown;
  for (const path of paths) {
    try {
      return await api.post<T>(path, body);
    } catch (error) {
      lastError = error;
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 404 || status === 405) {
          continue;
        }
      }
      throw error;
    }
  }
  throw lastError;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === 'string' && detail.trim()) {
      return detail;
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

function buildFetchHeaders() {
  const token = getStoredAuthToken();
  const headers = new Headers({
    'Content-Type': 'application/json',
  });

  if (token) {
    headers.set('Authorization', `Token ${token}`);
  }

  return headers;
}

function parseStreamEventBlock(rawBlock: string) {
  const lines = rawBlock.replace(/\r/g, '').split('\n');
  let eventName = 'message';
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith('event:')) {
      eventName = line.slice(6).trim() || 'message';
      continue;
    }
    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trimStart());
    }
  }

  const data = dataLines.join('\n');
  return { eventName, data };
}

function parseStreamPayload(data: string): StreamChunkPayload | Record<string, unknown> {
  if (!data.trim()) {
    return {};
  }

  try {
    const parsed = JSON.parse(data);
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return { content: data };
  }

  return { content: data };
}

async function readStream(
  response: Response,
  callbacks: StreamCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  if (!response.body) {
    throw new Error('The browser does not support streaming responses.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const processBuffer = (flushAll = false) => {
    const normalizedBuffer = buffer.replace(/\r\n/g, '\n');
    buffer = normalizedBuffer;

    let separatorIndex = buffer.indexOf('\n\n');
    while (separatorIndex >= 0) {
      const block = buffer.slice(0, separatorIndex);
      buffer = buffer.slice(separatorIndex + 2);

      if (block.trim()) {
        const { eventName, data } = parseStreamEventBlock(block);
        const payload = parseStreamPayload(data);
        if (eventName === 'end') {
          const errorMessage =
            payload && typeof payload === 'object' && 'error' in payload
              ? String(payload.error || '')
              : '';
          if (errorMessage) {
            throw new Error(errorMessage);
          }
        } else {
          callbacks.onChunk(payload as StreamChunkPayload);
        }
      }

      separatorIndex = buffer.indexOf('\n\n');
    }

    if (flushAll && buffer.trim()) {
      const { eventName, data } = parseStreamEventBlock(buffer);
      const payload = parseStreamPayload(data);
      buffer = '';
      if (eventName === 'end') {
        const errorMessage =
          payload && typeof payload === 'object' && 'error' in payload
            ? String(payload.error || '')
            : '';
        if (errorMessage) {
          throw new Error(errorMessage);
        }
      } else {
        callbacks.onChunk(payload as StreamChunkPayload);
      }
    }
  };

  while (true) {
    if (signal?.aborted) {
      throw new DOMException('The user aborted a request.', 'AbortError');
    }

    const { value, done } = await reader.read();
    if (done) {
      buffer += decoder.decode();
      processBuffer(true);
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    processBuffer();
  }
}

export const APIService = {
  register: async (username: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', { username, password });
    return response.data;
  },

  login: async (username: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', { username, password });
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  getCurrentUser: async (): Promise<AuthUser> => {
    const response = await api.get<CurrentUserResponse>('/auth/me');
    return response.data.user;
  },

  getChapters: async (): Promise<Chapter[]> => {
    try {
      const response = await getWithFallback<ChapterPayload[]>(['/chapters', '/chapters/']);
      const data = unwrapData<ChapterPayload[]>(response.data as never);
      return (Array.isArray(data) ? data : []).map((item) => ({
        chapter_id: item.chapter_id || item.id || '',
        title: item.title || '',
        description: item.description || '',
      }));
    } catch {
      return [
        { chapter_id: 'ch1', title: '第 1 章 绪论', description: '数据结构基础概念与复杂度分析。' },
        { chapter_id: 'ch2', title: '第 2 章 线性表', description: '顺序表与链表的结构特征。' },
        { chapter_id: 'ch3', title: '第 3 章 栈与队列', description: '受限线性结构与典型应用。' },
      ];
    }
  },

  getQuestionsByChapter: async (chapterId: string): Promise<Question[]> => {
    try {
      const response = await getWithFallback<QuestionPayload[]>([
        `/chapters/${chapterId}/questions`,
        `/chapters/${chapterId}/questions/`,
      ]);
      const data = unwrapData<QuestionPayload[]>(response.data as never);
      return (Array.isArray(data) ? data : []).map((item) => ({
        question_id: item.question_id || item.id || '',
        chapter_id: item.chapter_id || chapterId,
        content: item.content || item.stem || item.title || item.question || '',
        type: item.type,
        difficulty: item.difficulty,
      }));
    } catch {
      return [
        {
          question_id: `q1-${chapterId}`,
          chapter_id: chapterId,
          content: `请解释 ${chapterId} 对应章节中的核心数据结构概念。`,
          difficulty: '简单',
        },
      ];
    }
  },

  getQuestionDetail: async (questionId: string): Promise<Question> => {
    try {
      const response = await getWithFallback<QuestionPayload>([
        `/questions/${questionId}`,
        `/questions/${questionId}/`,
      ]);
      const item = unwrapData<QuestionPayload>(response.data as never) || {};
      return {
        question_id: item.question_id || item.id || questionId,
        chapter_id: item.chapter_id || '',
        content: item.content || item.stem || item.title || item.question || '',
        type: item.type,
        difficulty: item.difficulty,
      };
    } catch {
      return {
        question_id: questionId,
        chapter_id: '',
        content: `这是题目 ${questionId} 的详情占位内容。`,
        difficulty: '中等',
      };
    }
  },

  createSession: async (questionId: string): Promise<{ session_id: string }> => {
    const response = await postWithFallback<{ session_id: string }>(['/sessions', '/sessions/'], {
      question_id: questionId,
    });
    const payload = unwrapData<{ session_id: string }>(response.data as never) || { session_id: '' };
    return { session_id: payload.session_id || '' };
  },

  getLatestSessionByQuestion: async (questionId: string): Promise<SessionDetail | null> => {
    try {
      const response = await getWithFallback<SessionPayload>([
        `/sessions/question/${questionId}/latest`,
        `/sessions/question/${questionId}/latest/`,
      ]);
      return mapSession(unwrapData<SessionPayload>(response.data as never));
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  streamSessionMessage: async (
    sessionId: string,
    content: string,
    callbacks: StreamCallbacks,
    signal?: AbortSignal,
  ): Promise<void> => {
    const response = await fetch(buildApiUrl(`/sessions/${encodeURIComponent(sessionId)}/messages`), {
      method: 'POST',
      headers: buildFetchHeaders(),
      body: JSON.stringify({ content }),
      signal,
    });

    if (!response.ok) {
      let detail = 'Stream request failed';
      try {
        const payload = (await response.json()) as { detail?: string };
        if (payload?.detail) {
          detail = payload.detail;
        }
      } catch {
        // ignore
      }
      throw new Error(detail);
    }

    await readStream(response, callbacks, signal);
  },

  deleteSession: async (sessionId: string): Promise<void> => {
    await api.delete(`/sessions/${encodeURIComponent(sessionId)}`);
  },

  getModelSettings: async (): Promise<ModelSettingsStatus> => {
    const response = await getWithFallback<ModelSettingsStatus>(['/settings/model', '/settings/model/']);
    return response.data;
  },

  updateModelSettings: async (apiKey: string): Promise<ModelSettingsStatus> => {
    const response = await api.put<ModelSettingsStatus>('/settings/model', { api_key: apiKey });
    return response.data;
  },

  clearModelSettings: async (): Promise<ModelSettingsStatus> => {
    const response = await api.delete<ModelSettingsStatus>('/settings/model');
    return response.data;
  },

  getChapterKnowledgePointMap: async (): Promise<Record<string, string[]>> => {
    const response = await getWithFallback<Record<string, string[]>>(['/knowledge/chapters', '/knowledge/chapters/']);
    const data = unwrapData<Record<string, string[]>>(response.data);
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return {};
    }

    const result: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(data)) {
      if (Array.isArray(value)) {
        const seen = new Set<string>();
        result[key] = value.filter((id) => typeof id === 'string' && !seen.has(id) && seen.add(id));
      } else {
        result[key] = [];
      }
    }
    return result;
  },

  getAllKnowledgeDetails: async (): Promise<Record<string, { id: string; title: string }>> => {
    const response = await getWithFallback<Record<string, KnowledgeDetailsPayload>>([
      '/knowledge/details/all',
      '/knowledge/details/all/',
    ]);
    const data = unwrapData<Record<string, KnowledgeDetailsPayload>>(response.data);
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return {};
    }

    const result: Record<string, { id: string; title: string }> = {};
    for (const [key, value] of Object.entries(data)) {
      const id = value?.id || value?.knowledge_id || key;
      const title = value?.title || '';
      if (id) {
        result[id] = { id, title };
      }
    }
    return result;
  },

  getKnowledgeSummary: async (knowledgeId: string): Promise<KnowledgePoint> => {
    const response = await getWithFallback<KnowledgeSummaryPayload>([
      `/knowledge/${knowledgeId}`,
      `/knowledge/${knowledgeId}/`,
    ]);
    const raw = unwrapData<unknown>(response.data as never);
    const payload = coerceKnowledgeSummaryPayload(raw);
    return {
      knowledge_id: payload.knowledge_id || payload.id || knowledgeId,
      title: payload.title || '',
      summary: payload.summary || payload.summry,
      details: payload.details,
    };
  },
};
