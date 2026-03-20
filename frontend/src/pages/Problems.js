import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiService from '../services/api';

function Problems() {
  const [chapters, setChapters] = useState([]);
  const [currentChapter, setCurrentChapter] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadChapters();
  }, []);

  const loadChapters = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getChapters();
      setChapters(data);
      if (data.length > 0) {
        setCurrentChapter(data[0]);
        loadQuestions(data[0].id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      setError('加载章节失败: ' + err.message);
      setLoading(false);
    }
  };

  const loadQuestions = async (chapterId) => {
    try {
      setLoading(true);
      const data = await ApiService.getQuestionsByChapter(chapterId);
      setQuestions(data);
    } catch (err) {
      setError('加载题目失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChapterClick = (chapter) => {
    setCurrentChapter(chapter);
    loadQuestions(chapter.id);
  };

  const handleQuestionClick = (questionId) => {
    navigate(`/chat/${questionId}`);
  };

  const getDifficultyClass = (difficulty) => {
    if (difficulty === '简单') return 'easy';
    if (difficulty === '困难') return 'hard';
    return 'medium';
  };

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="content-wrapper">
      <div className="chapter-panel">
        <h2 className="panel-title">章节列表</h2>
        <div className="list-panel">
          {chapters.map((chapter) => (
            <div
              key={chapter.id}
              className={`chapter-item ${currentChapter?.id === chapter.id ? 'active' : ''}`}
              onClick={() => handleChapterClick(chapter)}
            >
              <span>{chapter.id}. {chapter.title}</span>
              <i className={`fas fa-chevron-${currentChapter?.id === chapter.id ? 'down' : 'right'}`}></i>
            </div>
          ))}
        </div>
      </div>

      <div className="questions-panel">
        <h2 className="panel-title">
          题目列表
          {currentChapter && (
            <span style={{color: '#6b7280', fontWeight: 'normal', fontSize: '0.9rem', marginLeft: '10px'}}>
              - {currentChapter.title}
            </span>
          )}
        </h2>
        <div className="list-panel">
          {loading ? (
            <div className="loading-indicator">加载中...</div>
          ) : questions.length === 0 ? (
            <div className="empty-tip">该章节暂无题目</div>
          ) : (
            questions.map((question) => (
              <div
                key={question.id}
                className="question-item"
                onClick={() => handleQuestionClick(question.id)}
              >
                <div className="question-title-text">{question.title}</div>
                <div className="question-meta">
                  <span>{question.type}</span>
                  <span className={`difficulty ${getDifficultyClass(question.difficulty)}`}>
                    {question.difficulty}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Problems;
