import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { marked } from 'marked';
import ApiService from '../services/api';

// SVG 图标组件
const StudentIcon = () => (
  <svg className="avatar-icon student-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
    <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"></path>
  </svg>
);

const TeacherIcon = () => (
  <svg className="avatar-icon teacher-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
    <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"></path>
  </svg>
);

const UserIcon = () => (
  <svg className="avatar-icon user-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const SystemIcon = () => (
  <svg className="avatar-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
);

const ExpandIcon = ({ expanded }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <polyline points={expanded ? "18 15 12 9 6 15" : "6 9 12 15 18 9"}></polyline>
  </svg>
);

function Chat() {
  const { questionId } = useParams();
  const [question, setQuestion] = useState(null);
  const [knowledgePoints, setKnowledgePoints] = useState([]);
  const [similarQuestions, setSimilarQuestions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedMessages, setExpandedMessages] = useState({});
  const messagesEndRef = useRef(null);
  const messageContentRefs = useRef({});

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [questionData, knowledgeData, similarData] = await Promise.all([
        ApiService.getQuestionDetail(questionId),
        ApiService.getKnowledgePoints(questionId),
        ApiService.getSimilarQuestions(questionId)
      ]);

      setQuestion(questionData);
      setKnowledgePoints(knowledgeData);
      setSimilarQuestions(similarData);

      const sessionData = await ApiService.createSession(questionId);
      setSessionId(sessionData.session_id);

      setMessages([{
        type: 'system',
        sender: 'system',
        content: "欢迎来到EasyDS智能辅导系统！请为我讲解这道题目吧！"
      }]);
    } catch (err) {
      setError('加载题目失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [questionId]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleMessageExpand = (index) => {
    setExpandedMessages(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const shouldShowExpandButton = (content, sender) => {
    if (sender === 'teacher_agent') return false;
    if (!content) return false;
    return content.length > 100 || content.split('\n').length > 3;
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !sessionId || isStreaming) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');

    setMessages(prev => [...prev, {
      type: 'user',
      sender: 'user',
      content: userMessage
    }]);

    setIsStreaming(true);

    const eventSource = new EventSource(
      `http://localhost:8000/api/sessions/${sessionId}/messages?content=${encodeURIComponent(userMessage)}&_t=${Date.now()}`
    );

    let studentContent = '';
    let teacherContent = '';
    let currentSender = null;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { content, node } = data;

        if (node === 'student_agent') {
          if (currentSender !== 'student_agent') {
            currentSender = 'student_agent';
            studentContent = content;
            setMessages(prev => [...prev, {
              type: 'ai',
              sender: 'student_agent',
              content: content
            }]);
          } else {
            studentContent += content;
            setMessages(prev => {
              const newMessages = [...prev];
              const lastMessage = newMessages[newMessages.length - 1];
              if (lastMessage.sender === 'student_agent') {
                lastMessage.content = studentContent;
              }
              return newMessages;
            });
          }
        } else if (node === 'teacher_agent') {
          if (currentSender !== 'teacher_agent') {
            currentSender = 'teacher_agent';
            teacherContent = content;
            setMessages(prev => [...prev, {
              type: 'ai',
              sender: 'teacher_agent',
              content: content
            }]);
          } else {
            teacherContent += content;
            setMessages(prev => {
              const newMessages = [...prev];
              const lastMessage = newMessages[newMessages.length - 1];
              if (lastMessage.sender === 'teacher_agent') {
                lastMessage.content = teacherContent;
              }
              return newMessages;
            });
          }
        } else if (node === 'system') {
          setMessages(prev => [...prev, {
            type: 'system',
            sender: 'system',
            content: content
          }]);
        }
      } catch (err) {
        console.error("处理SSE消息错误:", err);
      }
    };

    eventSource.addEventListener('end', () => {
      eventSource.close();
      setIsStreaming(false);
    });

    eventSource.onerror = (error) => {
      console.error('SSE错误:', error);
      eventSource.close();
      setIsStreaming(false);
      setMessages(prev => [...prev, {
        type: 'system',
        sender: 'system',
        content: '接收消息出错，请重试。'
      }]);
    };
  };

  const getSenderDisplayName = (sender) => {
    const senderNames = {
      'student_agent': '学生智能体',
      'teacher_agent': '教师智能体',
      'system': '系统',
      'user': '你'
    };
    return senderNames[sender] || sender;
  };

  const getAvatarForSender = (sender) => {
    switch (sender) {
      case 'student_agent': return <StudentIcon />;
      case 'teacher_agent': return <TeacherIcon />;
      case 'user': return <UserIcon />;
      default: return <SystemIcon />;
    }
  };

  // 教师消息使用自定义Markdown渲染
  const renderTeacherContent = (content) => {
    if (!content) return null;
    
    let cleanContent = content
      .replace(/\n\s*\n\s*\n\s*\n/g, '\n\n')
      .replace(/\n\s+/g, '\n')
      .trim();

    const md2html = (text) => {
      text = text.replace(/^# (.*?)$/gm, '<h3 class="compact-h3">$1</h3>');
      text = text.replace(/^## (.*?)$/gm, '<h4 class="compact-h4">$1</h4>');
      text = text.replace(/^### (.*?)$/gm, '<h5 class="compact-h5">$1</h5>');
      text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
      text = text.replace(/^\s*-\s+(.*?)$/gm, '<li class="compact-li">$1</li>');
      text = text.replace(/^\s*\*\s+(.*?)$/gm, '<li class="compact-li">$1</li>');
      text = text.replace(/^\s*(\d+)\.\s+(.*?)$/gm, '<li class="compact-li compact-ol">$1. $2</li>');

      let inList = false;
      const lines = text.split('\n');
      let result = '';

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('<li class="compact-li">') || line.includes('<li class="compact-li compact-ol">')) {
          if (!inList) {
            result += '<ul class="compact-ul">';
            inList = true;
          }
          result += line;
        } else {
          if (inList) {
            result += '</ul>';
            inList = false;
          }
          if (line.trim() !== '' && !line.startsWith('<h') && !line.startsWith('<ul') && !line.startsWith('</ul')) {
            result += `<p class="compact-p">${line}</p>`;
          } else {
            result += line;
          }
        }
      }
      if (inList) result += '</ul>';
      return result;
    };

    const paragraphs = cleanContent.split('\n\n');
    let html = '';
    paragraphs.forEach(para => {
      if (para.trim() === '') return;
      html += md2html(para);
    });

    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  };

  const renderMessageContent = (message, index) => {
    const { content, sender } = message;
    if (!content) return null;

    const isExpanded = expandedMessages[index];
    const showExpand = shouldShowExpandButton(content, sender);

    if (sender === 'teacher_agent') {
      return renderTeacherContent(content);
    }

    const html = marked.parse(content);
    return (
      <>
        <div 
          className={`message-text ${isExpanded ? 'expanded' : ''}`}
          dangerouslySetInnerHTML={{ __html: html }}
        />
        {showExpand && (
          <button 
            className="expand-button"
            onClick={() => toggleMessageExpand(index)}
          >
            <ExpandIcon expanded={isExpanded} />
          </button>
        )}
      </>
    );
  };

  const renderQuestionContent = (content) => {
    if (!content) return null;
    const processed = content
      .replace(/\n\t\t/g, '\n<span class="double-indent"></span>')
      .replace(/\n\t/g, '\n<span class="indent"></span>')
      .replace(/\n\n\n/g, '\n<br><br>\n')
      .replace(/\n\n/g, '\n<br>\n');
    const html = marked.parse(processed);
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  };

  if (loading) {
    return <div className="loading-indicator">加载中...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="chat-page-layout">
      <div className="chat-sidebar">
        <div className="sidebar-section">
          <h3>题目详情</h3>
          <div className="question-detail-box">
            <div className="question-detail-title">{question?.title}</div>
            <div className="question-detail-content">
              {renderQuestionContent(question?.content)}
            </div>
          </div>
        </div>

        {knowledgePoints.length > 0 && (
          <div className="sidebar-section">
            <h3>相关知识点</h3>
            <ul className="knowledge-points-list">
              {knowledgePoints.map((kp, index) => (
                <li key={index}>
                  <strong>{kp.id}</strong>
                  {kp.title && <div>{kp.title}</div>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {similarQuestions.length > 0 && (
          <div className="sidebar-section">
            <h3>相似题目</h3>
            <ul className="similar-questions-list">
              {similarQuestions.map((sq) => (
                <li key={sq.id}>
                  <Link to={`/chat/${sq.id}`}>{sq.title}</Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="sidebar-section" style={{marginTop: 'auto'}}>
          <Link to="/problems" className="back-btn">返回列表</Link>
        </div>
      </div>

      <div className="chat-notebook">
        <div className="notebook-header">
          <h2>题目解答</h2>
        </div>

        <div className="notebook-container">
          <div className="notebook-background"></div>
          <div className="notebook-margin"></div>
          <div className="notebook-content">
            <div className="chat-messages">
              {messages.map((message, index) => (
                <div key={index} className="message-item">
                  <div className={`message-container ${message.sender}`}>
                    <div className="message-content">
                      {message.sender !== 'user' && (
                        <>
                          <div className={`avatar ${message.sender}-avatar`}>
                            {getAvatarForSender(message.sender)}
                          </div>
                          <div className="message-bubble-container">
                            <div className="message-header">
                              {message.sender === 'teacher_agent' && (
                                <span className="teacher-badge">教师指导</span>
                              )}
                              <span className={`sender-name ${message.sender}-name`}>
                                {getSenderDisplayName(message.sender)}
                              </span>
                            </div>
                            <div className={`message-bubble ${message.sender}-bubble`}>
                              {renderMessageContent(message, index)}
                            </div>
                          </div>
                        </>
                      )}
                      {message.sender === 'user' && (
                        <>
                          <div className="message-bubble-container">
                            <div className="message-header">
                              <span className="sender-name user-name">你</span>
                            </div>
                            <div className={`message-bubble user-bubble ${message.content.length < 15 ? 'short-message' : ''}`}>
                              {renderMessageContent(message, index)}
                            </div>
                          </div>
                          <div className="avatar user-avatar">
                            <UserIcon />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="connector-line"></div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        <div className="input-area">
          <textarea
            placeholder="输入你对问题的解答..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            disabled={isStreaming}
            rows={3}
          />
          <button 
            className="send-btn" 
            onClick={handleSendMessage}
            disabled={isStreaming || !inputMessage.trim()}
          >
            {isStreaming ? '思考中...' : '发送'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Chat;
