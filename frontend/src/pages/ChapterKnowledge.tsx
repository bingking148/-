import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import { APIService, type Chapter, type KnowledgePoint, getApiErrorMessage } from '../services/api';
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, Play } from 'lucide-react';

const ChapterKnowledge = () => {
  const { chapterId } = useParams();
  const navigate = useNavigate();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [knowledgeMap, setKnowledgeMap] = useState<Record<string, string[]>>({});
  const [knowledgeDetails, setKnowledgeDetails] = useState<Record<string, { id: string; title: string }>>({});
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [reviewMode, setReviewMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeKnowledge, setActiveKnowledge] = useState<KnowledgePoint | null>(null);

  const knowledgeIds = useMemo(() => {
    if (!chapterId) {
      return [];
    }
    return knowledgeMap[chapterId] || [];
  }, [chapterId, knowledgeMap]);

  const chapterTitle = useMemo(() => {
    if (!chapterId) {
      return '';
    }
    return chapters.find((c) => c.chapter_id === chapterId)?.title || chapterId;
  }, [chapterId, chapters]);

  const clampedIndex = useMemo(() => {
    if (knowledgeIds.length === 0) {
      return 0;
    }
    return Math.min(Math.max(0, selectedIndex), knowledgeIds.length - 1);
  }, [knowledgeIds.length, selectedIndex]);

  const selectedKnowledgeId = useMemo(() => knowledgeIds[clampedIndex] || null, [clampedIndex, knowledgeIds]);

  const canPrev = clampedIndex > 0;
  const canNext = clampedIndex < knowledgeIds.length - 1;

  useEffect(() => {
    if (!chapterId) {
      navigate('/chapters', { replace: true });
      return;
    }

    let cancelled = false;

    Promise.all([
      APIService.getChapters(),
      APIService.getChapterKnowledgePointMap(),
      APIService.getAllKnowledgeDetails(),
    ])
      .then(([chapterList, map, details]) => {
        if (cancelled) {
          return;
        }
        setError(null);
        setChapters(chapterList);
        setKnowledgeMap(map);
        setKnowledgeDetails(details);
        const ids = map[chapterId] || [];
        setSelectedIndex(ids.length > 0 ? 0 : 0);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getApiErrorMessage(err, '知识点加载失败'));
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
  }, [chapterId, navigate]);

  useEffect(() => {
    if (!selectedKnowledgeId) {
      return;
    }

    let cancelled = false;

    APIService.getKnowledgeSummary(selectedKnowledgeId)
      .then((kp) => {
        if (cancelled) {
          return;
        }
        setError(null);
        const fallbackTitle = knowledgeDetails[selectedKnowledgeId]?.title || kp.title || selectedKnowledgeId;
        setActiveKnowledge({ ...kp, title: fallbackTitle });
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getApiErrorMessage(err, '知识点详情加载失败'));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingSummary(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [knowledgeDetails, selectedKnowledgeId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin drop-shadow-[0_0_15px_var(--color-accent-dim)]" />
      </div>
    );
  }

  if (!chapterId) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="glass-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/chapters"
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm bg-[rgba(15,23,42,0.03)] hover:bg-[rgba(15,23,42,0.05)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              返回章节
            </Link>
            <div>
              <h1 className="text-2xl font-semibold">{chapterTitle}</h1>
              <p className="text-sm text-[var(--color-text-muted)]">知识点展示与温习：先理解，再练习。</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setReviewMode((v) => !v)}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm bg-[rgba(15,23,42,0.03)] hover:bg-[rgba(15,23,42,0.05)] transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              {reviewMode ? '退出温习' : '开始温习'}
            </button>
            <Link
              to={`/practice/${chapterId}`}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm bg-[var(--color-accent)] text-[var(--color-on-accent)] shadow-[0_0_20px_var(--color-accent-dim)] hover:shadow-[0_0_30px_var(--color-accent-glow)] transition-all"
            >
              <Play className="w-4 h-4" />
              本章练习
            </Link>
          </div>
        </div>

        {reviewMode ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setLoadingSummary(true);
                setSelectedIndex((i) => Math.max(0, i - 1));
              }}
              disabled={!canPrev}
              className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm bg-[rgba(15,23,42,0.03)] hover:bg-[rgba(15,23,42,0.05)] transition-colors disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
              上一条
            </button>
            <button
              onClick={() => {
                setLoadingSummary(true);
                setSelectedIndex((i) => Math.min(knowledgeIds.length - 1, i + 1));
              }}
              disabled={!canNext}
              className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm bg-[rgba(15,23,42,0.03)] hover:bg-[rgba(15,23,42,0.05)] transition-colors disabled:opacity-40"
            >
              下一条
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="text-xs text-[var(--color-text-subtle)]">
              {knowledgeIds.length > 0 ? `${selectedIndex + 1}/${knowledgeIds.length}` : '0/0'}
            </div>
          </div>
        ) : null}
        {error ? <div className="mt-3 text-xs text-red-600">{error}</div> : null}
      </div>

      <div className="flex gap-6 min-h-[70vh]">
        <div className="w-96 shrink-0 hidden lg:flex flex-col gap-4">
          <div className="glass-card p-4 flex flex-col h-full">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 pl-2 shrink-0">本章知识点</h3>
            <div className="overflow-y-auto glass-scrollbar flex flex-col gap-2 pr-2 pb-2 flex-1 min-h-0">
              {knowledgeIds.length === 0 ? (
                <div className="p-4 text-sm text-[var(--color-text-muted)]">暂无知识点数据。</div>
              ) : (
                knowledgeIds.map((id, idx) => (
                  <button
                    key={id}
                    onClick={() => {
                      setLoadingSummary(true);
                      setSelectedIndex(idx);
                    }}
                    className={`text-left text-sm px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden group shrink-0 ${selectedKnowledgeId === id ? 'bg-[var(--color-surface-hover)] text-[var(--color-text)] shadow-[0_0_15px_rgba(15,23,42,0.06)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[rgba(15,23,42,0.03)]'}`}
                  >
                    {selectedKnowledgeId === id ? <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[var(--color-accent)] to-teal-500 shadow-[0_0_10px_var(--color-accent-glow)]" /> : null}
                    <span className="relative z-10">{knowledgeDetails[id]?.title || id}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-4">
          <div className="glass-card p-6 flex-1 overflow-hidden">
            {loadingSummary ? (
              <div className="flex items-center justify-center min-h-[50vh]">
                <div className="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin drop-shadow-[0_0_15px_var(--color-accent-dim)]" />
              </div>
            ) : activeKnowledge ? (
              <div className="h-full overflow-y-auto glass-scrollbar pr-2">
                <h2 className="text-xl font-semibold mb-4">{activeKnowledge.title}</h2>
                <div className="mb-3 inline-flex items-center rounded-full px-3 py-1 text-xs border border-[var(--color-border)] bg-[rgba(15,23,42,0.03)] text-[var(--color-text-subtle)]">
                  知识点速记
                </div>
                <div className="prose max-w-none prose-p:leading-relaxed prose-pre:border prose-pre:border-[var(--color-border)] prose-a:text-teal-700">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex, rehypeHighlight]}>
                    {activeKnowledge.summary || '暂无摘要内容。'}
                  </ReactMarkdown>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center min-h-[50vh] text-sm text-[var(--color-text-muted)]">请选择知识点开始学习。</div>
            )}
          </div>

          <div className="glass-card p-4 lg:hidden">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">本章知识点</h3>
            <div className="grid grid-cols-1 gap-2">
              {knowledgeIds.length === 0 ? (
                <div className="text-sm text-[var(--color-text-muted)]">暂无知识点数据。</div>
              ) : (
                knowledgeIds.map((id, idx) => (
                  <button
                    key={id}
                    onClick={() => {
                      setLoadingSummary(true);
                      setSelectedIndex(idx);
                    }}
                    className={`text-left text-sm px-4 py-3 rounded-xl transition-all duration-300 border ${selectedKnowledgeId === id ? 'bg-[rgba(15,23,42,0.03)] border-[var(--color-border)]' : 'bg-transparent border-transparent hover:bg-[rgba(15,23,42,0.03)] hover:border-[var(--color-border)]'}`}
                  >
                    {knowledgeDetails[id]?.title || id}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChapterKnowledge;
