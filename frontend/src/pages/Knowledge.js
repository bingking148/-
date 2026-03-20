import React, { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import ApiService from '../services/api';

const normalizeEscapedNewlines = (text) => {
  if (typeof text !== 'string') return '';
  return text.replace(/\\n/g, '\n');
};

// 知识点浮窗组件
const KnowledgePopup = ({ knowledgeId, isVisible, onClose }) => {
  const [content, setContent] = useState('加载中...');
  const [loading, setLoading] = useState(true);
  const popupRef = useRef(null);

  useEffect(() => {
    if (isVisible && knowledgeId) {
      loadKnowledgeDetail();
    }
  }, [isVisible, knowledgeId]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isVisible, onClose]);

  const loadKnowledgeDetail = async () => {
    try {
      setLoading(true);
      const summary = await ApiService.getKnowledgeSummary(knowledgeId);
      const normalizedSummary = normalizeEscapedNewlines(summary);
      setContent(marked.parse(normalizedSummary));
    } catch (err) {
      setContent('加载知识点详情失败');
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="knowledge-popup" ref={popupRef}>
      <div className="popup-arrow"></div>
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
};

function Knowledge() {
  const [chapters, setChapters] = useState([]);
  const [currentChapter, setCurrentChapter] = useState(null);
  const [knowledgePoints, setKnowledgePoints] = useState({});
  const [currentKnowledge, setCurrentKnowledge] = useState(null);
  const [knowledgeTitle, setKnowledgeTitle] = useState('');
  const [knowledgeSummary, setKnowledgeSummary] = useState('');
  const [knowledgeDetails, setKnowledgeDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [popupVisible, setPopupVisible] = useState({});

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [chaptersData, knowledgeData, detailsData] = await Promise.all([
        ApiService.getChapters(),
        ApiService.getChapterKnowledgePoints(),
        ApiService.getAllKnowledgeDetails()
      ]);
      
      setChapters(chaptersData);
      setKnowledgePoints(knowledgeData);
      setKnowledgeDetails(detailsData);
      
      if (chaptersData.length > 0) {
        setCurrentChapter(chaptersData[0]);
      }
    } catch (err) {
      setError('加载数据失败: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChapterClick = (chapter) => {
    setCurrentChapter(chapter);
    setCurrentKnowledge(null);
    setKnowledgeSummary('');
    setKnowledgeTitle('');
  };

  const handleKnowledgeClick = async (knowledgeId) => {
    try {
      setCurrentKnowledge(knowledgeId);
      setLoading(true);
      
      const [summary, titleData] = await Promise.all([
        ApiService.getKnowledgeSummary(knowledgeId),
        ApiService.getKnowledgeTitle(knowledgeId)
      ]);
      
      setKnowledgeTitle(titleData.title || '');
      const normalizedSummary = normalizeEscapedNewlines(summary);
      setKnowledgeSummary(marked.parse(normalizedSummary));
    } catch (err) {
      setKnowledgeSummary('<div class="error-message">加载知识点详情失败</div>');
    } finally {
      setLoading(false);
    }
  };

  const togglePopup = (knowledgeId, e) => {
    e.stopPropagation();
    setPopupVisible(prev => ({
      ...prev,
      [knowledgeId]: !prev[knowledgeId]
    }));
  };

  const closePopup = (knowledgeId) => {
    setPopupVisible(prev => ({
      ...prev,
      [knowledgeId]: false
    }));
  };

  const getCurrentChapterKnowledgePoints = () => {
    if (!currentChapter) return [];
    return knowledgePoints[currentChapter.id] || [];
  };

  const getKnowledgeTitle = (knowledgeId) => {
    return knowledgeDetails[knowledgeId]?.title || '';
  };

  if (loading && chapters.length === 0) {
    return <div className="loading-indicator">加载中...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="knowledge-layout">
      {/* 左侧面板：章节列表和知识点列表 */}
      <div className="sidebar-panel">
        <div className="chapter-section">
          <h2>章节列表</h2>
          <div className="list-panel">
            {chapters.map((chapter) => (
              <div
                key={chapter.id}
                className={`chapter-item ${currentChapter?.id === chapter.id ? 'active' : ''}`}
                onClick={() => handleChapterClick(chapter)}
              >
                <span>{chapter.id}. {chapter.title}</span>
                <i className={`fas fa-chevron-${currentChapter?.id === chapter.id ? 'down' : 'right'} chapter-icon`}></i>
              </div>
            ))}
          </div>
        </div>

        <div className="knowledge-list-section">
          <h2>
            知识点列表
            {currentChapter && (
              <span id="current-chapter-title"> - {currentChapter.title}</span>
            )}
          </h2>
          <div className="list-panel">
            {getCurrentChapterKnowledgePoints().length === 0 ? (
              <p className="empty-tip">请选择章节查看知识点</p>
            ) : (
              getCurrentChapterKnowledgePoints().map((kpId) => (
                <div
                  key={kpId}
                  className={`knowledge-item ${currentKnowledge === kpId ? 'active' : ''}`}
                  onClick={() => handleKnowledgeClick(kpId)}
                  style={{position: 'relative'}}
                >
                  <span className="knowledge-id">{kpId}</span>
                  <div className="knowledge-title-text">{getKnowledgeTitle(kpId)}</div>
                  <span 
                    className="note-icon"
                    onClick={(e) => togglePopup(kpId, e)}
                  >
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M1 2.828c.885-.37 2.154-.769 3.388-.893 1.33-.134 2.458.063 3.112.752v9.746c-.935-.53-2.12-.603-3.213-.493-1.18.12-2.37.461-3.287.811V2.828zm7.5-.141c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.923c-.918-.35-2.107-.692-3.287-.81-1.094-.111-2.278-.039-3.213.492V2.687zM8 1.783C7.015.936 5.587.81 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 0 0 .78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0 0 16 13.5v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.809 8.985.936 8 1.783z"/>
                    </svg>
                  </span>
                  <KnowledgePopup 
                    knowledgeId={kpId}
                    isVisible={popupVisible[kpId]}
                    onClose={() => closePopup(kpId)}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 右侧面板：知识点详情 */}
      <div className="detail-panel">
        {currentKnowledge ? (
          <div className="knowledge-detail-card">
            <div className="knowledge-detail-header">
              <div className="knowledge-detail-title">
                <h2>知识点详情</h2>
                <h3>{knowledgeTitle}</h3>
              </div>
            </div>
            <div className="knowledge-detail-container">
              <div 
                className="knowledge-summary"
                dangerouslySetInnerHTML={{ __html: knowledgeSummary }}
              />
            </div>
          </div>
        ) : (
          <div className="empty-detail-placeholder">
            <div className="placeholder-content">
              <i className="fas fa-book-open placeholder-icon"></i>
              <p>请从左侧选择知识点查看详情</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Knowledge;
