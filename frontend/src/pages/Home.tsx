import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ArrowRight, Code, Zap, Network } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Cinematic Intro Animation
    const tl = gsap.timeline();
    
    tl.fromTo(titleRef.current, 
      { y: 60, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 1.5, ease: "power4.out", delay: 0.2 }
    )
    .fromTo(subtitleRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.2, ease: "power3.out" },
      "-=1"
    )
    .fromTo(ctaRef.current,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: "power3.out" },
      "-=0.8"
    );

    // ScrollTrigger for Cards
    if (cardsRef.current) {
      gsap.fromTo(cardsRef.current.children,
        { y: 100, opacity: 0 },
        { 
          y: 0, 
          opacity: 1, 
          duration: 1, 
          stagger: 0.2, 
          ease: "power3.out",
          scrollTrigger: {
            trigger: cardsRef.current,
            start: "top 80%",
            toggleActions: "play none none reverse"
          }
        }
      );
    }
  }, []);

  return (
    <div className="flex flex-col gap-32 pb-20">
      {/* Hero Section */}
      <section ref={heroRef} className="min-h-[70vh] flex flex-col items-center justify-center text-center mt-10 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[var(--color-accent)] opacity-[0.12] blur-[150px] pointer-events-none rounded-[100%]" />
        
        <h1 ref={titleRef} className="text-6xl md:text-8xl font-bold tracking-tighter mb-8 leading-tight drop-shadow-2xl">
          掌握核心数据结构 <br />
          <span className="text-gradient-accent">AI 导师伴学</span>
        </h1>
        
        <p ref={subtitleRef} className="text-xl text-[var(--color-text-muted)] max-w-2xl mb-12 font-light leading-relaxed">
          基于费曼学习法。用你自己的语言解释答案，获取多智能体系统的实时评估、纠正与深度追问，构建底层认知。
        </p>
        
        <div ref={ctaRef} className="flex gap-6">
          <Link to="/practice" className="glass px-8 py-4 rounded-full flex items-center gap-3 text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] shadow-[0_0_20px_var(--color-accent-dim)] hover:shadow-[0_0_40px_var(--color-accent-glow)] transition-all duration-500 font-medium group">
            开始智能实战
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link to="/chapters" className="glass px-8 py-4 rounded-full flex items-center gap-3 text-[var(--color-text)] hover:bg-[var(--color-surface-hover)] shadow-[0_0_20px_var(--color-accent-dim)] hover:shadow-[0_0_40px_var(--color-accent-glow)] transition-all duration-500 font-medium group">
            浏览所有章节
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* 2.5D Core Features */}
      <section className="relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-semibold mb-4 text-[var(--color-text)]">多智能体协作工作流</h2>
          <p className="text-[var(--color-text-subtle)]">专为评估、挑战和纠正认知而设计的多级 AI 架构。</p>
        </div>
        
        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-8 perspective-[1000px]">
          {/* Card 1 */}
          <div className="glass-card p-8 flex flex-col gap-6 group">
            <div className="w-14 h-14 rounded-2xl bg-[rgba(15,23,42,0.03)] flex items-center justify-center border border-[var(--color-border)] group-hover:shadow-[0_0_30px_rgba(110,231,183,0.3)] transition-all duration-500">
              <Network className="w-7 h-7 text-[var(--color-accent)]" />
            </div>
            <div>
              <h3 className="text-xl font-medium mb-3 text-[var(--color-text)]">路由智能体 (Router Agent)</h3>
              <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
                实时评估您解释的完整性与正确性，并动态将您路由到最合适的导师智能体进行下一步辅导。
              </p>
            </div>
            <div className="glow-border" />
          </div>

          {/* Card 2 */}
          <div className="glass-card p-8 flex flex-col gap-6 mt-0 md:mt-8 group">
            <div className="w-14 h-14 rounded-2xl bg-[rgba(15,23,42,0.03)] flex items-center justify-center border border-[var(--color-border)] group-hover:shadow-[0_0_30px_rgba(168,85,247,0.3)] transition-all duration-500">
              <Code className="w-7 h-7 text-purple-400" />
            </div>
            <div>
              <h3 className="text-xl font-medium mb-3 text-[var(--color-text)]">教师智能体 (Teacher Agent)</h3>
              <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
                在您出现认知错误时介入。纠正您的错误概念，并提供清晰、结构化的核心知识点总结与梳理。
              </p>
            </div>
            <div className="glow-border" />
          </div>

          {/* Card 3 */}
          <div className="glass-card p-8 flex flex-col gap-6 mt-0 md:mt-16 group">
            <div className="w-14 h-14 rounded-2xl bg-[rgba(15,23,42,0.03)] flex items-center justify-center border border-[var(--color-border)] group-hover:shadow-[0_0_30px_rgba(59,130,246,0.3)] transition-all duration-500">
              <Zap className="w-7 h-7 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-medium mb-3 text-[var(--color-text)]">学生智能体 (Student Agent)</h3>
              <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
                当您的回答基本正确但缺乏深度时，通过连续探究性追问，逼迫您细化底层心理模型，达到知其所以然。
              </p>
            </div>
            <div className="glow-border" />
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
