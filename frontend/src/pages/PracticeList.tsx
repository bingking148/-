import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { APIService, type Chapter, type Question, getApiErrorMessage } from '../services/api';
import { ArrowRight } from 'lucide-react';

const PracticeList = () => {
  const { chapterId } = useParams();
  const navigate = useNavigate();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeChapter, setActiveChapter] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chapterTitle = useMemo(() => {
    const match = chapters.find((c) => c.chapter_id === activeChapter);
    return match?.title || '';
  }, [activeChapter, chapters]);

  useEffect(() => {
    let cancelled = false;

    APIService.getChapters()
      .then((data) => {
        if (cancelled) {
          return;
        }

        setError(null);
        setChapters(data);
        const next = chapterId || data[0]?.chapter_id || '';
        setActiveChapter(next);
        if (!chapterId && next) {
          navigate(`/practice/${next}`, { replace: true });
        }
      })
      .catch((err) => {
        if (cancelled) {
          return;
        }
        setError(getApiErrorMessage(err, '章节加载失败'));
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
    if (!activeChapter) {
      return;
    }

    let cancelled = false;
    setQuestionsLoading(true);
    setError(null);

    APIService.getQuestionsByChapter(activeChapter)
      .then((data) => {
        if (!cancelled) {
          setQuestions(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getApiErrorMessage(err, '题目加载失败'));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setQuestionsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeChapter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin drop-shadow-[0_0_15px_var(--color-accent-dim)]" />
      </div>
    );
  }

  return (
    <div className="flex h-[80vh] min-h-[600px] gap-6 max-w-[1400px] mx-auto w-full">
      <div className="w-80 flex flex-col gap-4 shrink-0 h-full">
        <div className="glass-card p-4 flex flex-col h-full shrink-0 relative">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 pl-2 shrink-0">课程章节</h3>
          <div className="overflow-y-auto glass-scrollbar flex flex-col gap-2 pr-2 pb-2 flex-1 min-h-0">
            {chapters.map((ch) => (
              <button
                key={ch.chapter_id}
                onClick={() => navigate(`/practice/${ch.chapter_id}`)}
                className={`text-left text-sm px-4 py-3 rounded-xl transition-colors duration-200 relative overflow-hidden group shrink-0 ${activeChapter === ch.chapter_id ? 'bg-[var(--color-surface-hover)] text-[var(--color-text)] shadow-[0_0_15px_rgba(15,23,42,0.06)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[rgba(15,23,42,0.03)]'}`}
              >
                {activeChapter === ch.chapter_id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[var(--color-accent)] to-teal-500 shadow-[0_0_10px_var(--color-accent-glow)]" />}
                <span className="relative z-10">{ch.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4 h-full">
        <div className="glass-card p-6 shrink-0">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">练习选题</h2>
              <p className="text-sm text-[var(--color-text-muted)]">按章节筛选题目后进入单题对话作答。</p>
            </div>
            <div className="text-xs text-[var(--color-text-subtle)]">{chapterTitle ? `当前章节：${chapterTitle}` : ''}</div>
          </div>
        </div>

        <div className="glass-card flex-1 p-4 overflow-hidden">
          <div className="flex items-center justify-between px-2 py-2">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">本章题目</h3>
            {error ? <span className="text-xs text-red-600">{error}</span> : null}
          </div>
          <div className="overflow-y-auto glass-scrollbar flex flex-col gap-2 pr-2 pb-2 h-[calc(80vh-220px)] min-h-0">
            {questionsLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-7 h-7 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin drop-shadow-[0_0_15px_var(--color-accent-dim)]" />
              </div>
            ) : questions.length === 0 ? (
              <div className="p-6 text-sm text-[var(--color-text-muted)]">暂无题目，尝试切换章节。</div>
            ) : (
              questions.map((q) => (
                <Link
                  key={q.question_id}
                  to={`/practice/${activeChapter}/${q.question_id}`}
                  className="group rounded-2xl border border-transparent bg-[rgba(15,23,42,0.02)] px-5 py-4 transition-colors duration-200 hover:border-[var(--color-border)] hover:bg-[rgba(15,23,42,0.03)]"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="text-sm leading-relaxed text-[var(--color-text)] line-clamp-2">{q.content}</div>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center shrink-0 text-[var(--color-text-muted)] group-hover:bg-[var(--color-accent)] group-hover:border-[var(--color-accent)] group-hover:text-[var(--color-on-accent)] transition-colors duration-200 shadow-[0_6px_16px_rgba(15,23,42,0.10)]">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PracticeList;
