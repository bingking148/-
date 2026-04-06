import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

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

export interface ModelSettingsStatus {
  provider: string;
  configured: boolean;
  source: 'custom' | 'env' | 'none' | string;
  masked_key: string | null;
  message?: string;
}

type ApiEnvelope<T> = T | { data?: T };

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
  question?: string;
  type?: string;
  difficulty?: string;
};

function unwrapData<T>(payload: ApiEnvelope<T>): T | undefined {
  if (payload && typeof payload === 'object' && !Array.isArray(payload) && 'data' in payload) {
    return payload.data;
  }

  return payload as T;
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

export const APIService = {
  getChapters: async (): Promise<Chapter[]> => {
    try {
      const response = await api.get('/chapters');
      const data = unwrapData<ChapterPayload[]>(response.data);
      return (Array.isArray(data) ? data : []).map((item) => ({
        chapter_id: item.chapter_id || item.id || '',
        title: item.title || '',
        description: item.description || '',
      }));
    } catch {
      console.warn('Failed to fetch chapters from backend, returning mock data for UI development.');
      return [
        {
          chapter_id: 'ch1',
          title: '第 1 章 绪论',
          description: '数据结构的基本概念、抽象数据类型，以及算法复杂度分析。',
        },
        {
          chapter_id: 'ch2',
          title: '第 2 章 线性表',
          description: '顺序表与链表的结构特点、常见操作和复杂度对比。',
        },
        {
          chapter_id: 'ch3',
          title: '第 3 章 栈、队列与数组',
          description: '受限线性结构及其典型应用场景，包括多维数组表示。',
        },
        {
          chapter_id: 'ch4',
          title: '第 4 章 串',
          description: '字符串表示与模式匹配，重点理解 KMP 算法思想。',
        },
        {
          chapter_id: 'ch5',
          title: '第 5 章 树与二叉树',
          description: '树形结构的定义、遍历方式，以及二叉树的典型性质。',
        },
        {
          chapter_id: 'ch6',
          title: '第 6 章 图',
          description: '图的存储、遍历、最短路径与最小生成树等核心内容。',
        },
      ];
    }
  },

  getQuestionsByChapter: async (chapterId: string): Promise<Question[]> => {
    try {
      const response = await api.get(`/chapters/${chapterId}/questions`);
      const data = unwrapData<QuestionPayload[]>(response.data);
      return (Array.isArray(data) ? data : []).map((item) => ({
        question_id: item.question_id || item.id || '',
        chapter_id: item.chapter_id || chapterId,
        content: item.content || item.title || item.question || '',
        type: item.type,
        difficulty: item.difficulty,
      }));
    } catch {
      return [
        {
          question_id: `q1-${chapterId}`,
          chapter_id: chapterId,
          content: `【基础概念】请解释 ${chapterId} 对应章节中最核心的数据结构定义，并说明它与普通数据类型的区别。`,
          difficulty: '简单',
        },
        {
          question_id: `q2-${chapterId}`,
          chapter_id: chapterId,
          content: `【综合分析】在实际工程里使用 ${chapterId} 对应结构时，时间复杂度与空间复杂度如何权衡？`,
          difficulty: '中等',
        },
        {
          question_id: `q3-${chapterId}`,
          chapter_id: chapterId,
          content: `【深入思考】如果让你从零实现 ${chapterId} 相关结构，你会如何设计核心接口与边界条件？`,
          difficulty: '困难',
        },
      ];
    }
  },

  getQuestionDetail: async (questionId: string): Promise<Question> => {
    try {
      const response = await api.get(`/questions/${questionId}`);
      const item = unwrapData<QuestionPayload>(response.data) || {};
      return {
        question_id: item.question_id || item.id || questionId,
        chapter_id: item.chapter_id || '',
        content: item.content || item.title || item.question || '',
        type: item.type,
        difficulty: item.difficulty,
      };
    } catch {
      return {
        question_id: questionId,
        chapter_id: '',
        content: `这是题目 ${questionId} 的详情占位内容。当前后端题目详情接口不可用，因此先显示本地模拟文本。`,
        difficulty: '中等',
      };
    }
  },

  createSession: async (questionId: string): Promise<{ session_id: string }> => {
    const response = await api.post('/sessions', { question_id: questionId });
    return unwrapData<{ session_id: string }>(response.data) || { session_id: '' };
  },

  getModelSettings: async (): Promise<ModelSettingsStatus> => {
    const response = await api.get<ModelSettingsStatus>('/settings/model');
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

  // Note: Streaming SSE is handled natively via EventSource or fetch.
};
