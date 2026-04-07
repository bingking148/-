import { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';
import { APIService, type Chapter } from '../services/api';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Chapters = () => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    APIService.getChapters().then((data) => {
      setChapters(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!loading && containerRef.current) {
      gsap.fromTo(containerRef.current.children,
        { y: 50, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.8, stagger: 0.1, ease: "power3.out" }
      );
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin drop-shadow-[0_0_15px_var(--color-accent-dim)]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-10">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4 text-[var(--color-text)]">课程章节</h1>
        <p className="text-[var(--color-text-muted)]">选择一个章节，深入探索核心知识点并进行实战练习。</p>
      </div>

      <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {chapters.map((chapter, index) => (
          <Link 
            to={`/chapters/${chapter.chapter_id}`} 
            key={chapter.chapter_id}
            className="glass-card p-6 flex items-start gap-5 group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[rgba(15,23,42,0.03)] to-transparent border border-[var(--color-border)] flex items-center justify-center shrink-0 group-hover:border-[var(--color-accent-dim)] group-hover:shadow-[0_0_20px_var(--color-accent-dim)] transition-all duration-300">
              <span className="text-[var(--color-text-muted)] font-mono text-sm group-hover:text-[var(--color-text)] transition-colors">{index + 1}</span>
            </div>
            
            <div className="flex-1">
              <h3 className="text-xl font-medium mb-2 text-[var(--color-text)] group-hover:text-[var(--color-accent)] transition-colors">{chapter.title}</h3>
              <p className="text-sm text-[var(--color-text-muted)] line-clamp-2 leading-relaxed">{chapter.description}</p>
              <p className="mt-3 text-xs text-[var(--color-text-subtle)]">进入本章知识点与温习</p>
            </div>
            
            <div className="w-8 h-8 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center shrink-0 self-center text-[var(--color-text-muted)] group-hover:bg-[var(--color-accent)] group-hover:border-[var(--color-accent)] group-hover:text-[var(--color-on-accent)] transition-all duration-300 shadow-[0_6px_16px_rgba(15,23,42,0.12)] group-hover:shadow-[0_0_15px_var(--color-accent-glow)]">
              <ArrowRight className="w-4 h-4" />
            </div>
            
            <div className="glow-border" />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Chapters;
