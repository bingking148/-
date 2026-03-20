// API 服务层
const API_BASE_URL = process.env.REACT_APP_API_URL || '';

class ApiService {
  // 获取所有章节
  static async getChapters() {
    const response = await fetch(`${API_BASE_URL}/api/chapters`);
    if (!response.ok) throw new Error('获取章节失败');
    return response.json();
  }

  // 获取章节下的问题列表
  static async getQuestionsByChapter(chapterId) {
    const response = await fetch(`${API_BASE_URL}/api/chapters/${chapterId}/questions`);
    if (!response.ok) throw new Error('获取问题列表失败');
    return response.json();
  }

  // 获取问题详情
  static async getQuestionDetail(questionId) {
    const response = await fetch(`${API_BASE_URL}/api/questions/${questionId}`);
    if (!response.ok) throw new Error('获取问题详情失败');
    return response.json();
  }

  // 获取问题相关知识点
  static async getKnowledgePoints(questionId) {
    const response = await fetch(`${API_BASE_URL}/api/questions/${questionId}/knowledge-points`);
    if (!response.ok) throw new Error('获取知识点失败');
    return response.json();
  }

  // 获取相似问题
  static async getSimilarQuestions(questionId) {
    const response = await fetch(`${API_BASE_URL}/api/questions/${questionId}/similar`);
    if (!response.ok) throw new Error('获取相似问题失败');
    return response.json();
  }

  // 获取所有章节的知识点
  static async getChapterKnowledgePoints() {
    const response = await fetch(`${API_BASE_URL}/api/knowledge/chapters`);
    if (!response.ok) throw new Error('获取知识点失败');
    return response.json();
  }

  // 获取所有知识点详情
  static async getAllKnowledgeDetails() {
    const response = await fetch(`${API_BASE_URL}/api/knowledge/details/all`);
    if (!response.ok) throw new Error('获取知识点详情失败');
    return response.json();
  }

  // 获取知识点标题
  static async getKnowledgeTitle(knowledgeId) {
    const response = await fetch(`${API_BASE_URL}/api/knowledge/${knowledgeId}/title`);
    if (!response.ok) throw new Error('获取知识点标题失败');
    return response.json();
  }

  // 获取知识点概要
  static async getKnowledgeSummary(knowledgeId) {
    const response = await fetch(`${API_BASE_URL}/api/knowledge/${knowledgeId}`);
    if (!response.ok) throw new Error('获取知识点概要失败');
    return response.text();
  }

  // 创建会话
  static async createSession(questionId) {
    const response = await fetch(`${API_BASE_URL}/api/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question_id: questionId })
    });
    if (!response.ok) throw new Error('创建会话失败');
    return response.json();
  }

  // 获取会话信息
  static async getSessionInfo(sessionId) {
    const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/info`);
    if (!response.ok) throw new Error('获取会话信息失败');
    return response.json();
  }

  // 发送消息（SSE流式）
  static sendMessageStream(sessionId, content, onChunk, onError, onEnd) {
    const eventSource = new EventSource(
      `${API_BASE_URL}/api/sessions/${sessionId}/messages?content=${encodeURIComponent(content)}`
    );

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.content || data.node) {
          onChunk(data.content, data.node);
        }
      } catch (e) {
        console.error('Parse error:', e);
      }
    };

    eventSource.addEventListener('end', () => {
      eventSource.close();
      onEnd();
    });

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      eventSource.close();
      onError(error);
    };

    return eventSource;
  }

  // 删除会话
  static async deleteSession(sessionId) {
    const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('删除会话失败');
    return response.json();
  }
}

export default ApiService;
