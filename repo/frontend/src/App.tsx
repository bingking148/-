import React, { useEffect, useRef } from 'react';
import { Routes, Route, Link, NavLink } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BrainCircuit, Settings2 } from 'lucide-react';
import Home from './pages/Home';
import Chapters from './pages/Chapters';
import Practice from './pages/Practice';
import ModelSettings from './pages/ModelSettings';

gsap.registerPlugin(ScrollTrigger);

const navItems = [
  { to: '/', label: '首页', end: true },
  { to: '/chapters', label: '章节' },
  { to: '/practice', label: '练习' },
  { to: '/settings/model', label: '模型设置' },
];

const Layout = ({ children }: { children: React.ReactNode }) => {
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    gsap.fromTo(
      navRef.current,
      { y: -100, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.2, ease: 'power4.out', delay: 0.2 },
    );
  }, []);

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden">
      <div className="pointer-events-none fixed left-[-10%] top-[-10%] h-[60%] w-[60%] rounded-full bg-emerald-900/30 blur-[150px] mix-blend-screen" />
      <div className="pointer-events-none fixed bottom-[-10%] right-[-10%] h-[70%] w-[70%] rounded-full bg-cyan-900/20 blur-[180px] mix-blend-screen" />

      <nav ref={navRef} className="fixed left-1/2 top-6 z-50 w-[90%] max-w-5xl -translate-x-1/2">
        <div className="glass rounded-[2rem] border-[rgba(255,255,255,0.15)] px-5 py-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.8)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Link to="/" className="group flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-accent)] to-teal-500 shadow-[0_0_20px_var(--color-accent-dim)] transition-all duration-500 group-hover:shadow-[0_0_30px_var(--color-accent-glow)]">
                <BrainCircuit className="h-5 w-5 text-gray-900" />
              </div>
              <span className="text-lg font-semibold tracking-wider text-white">EasyDS</span>
            </Link>

            <div className="flex flex-wrap items-center gap-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `rounded-full px-4 py-2 text-sm transition-all duration-300 ${
                      isActive
                        ? 'bg-white/12 text-white shadow-[0_0_18px_rgba(255,255,255,0.08)]'
                        : 'text-gray-400 hover:bg-white/6 hover:text-white'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>

            <div className="hidden items-center gap-2 text-sm font-medium italic tracking-widest text-gray-300 drop-shadow-md xl:flex">
              <Settings2 className="h-4 w-4 text-[var(--color-accent)]" />
              学而不思则罔，思而不学则殆
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 mx-auto w-full max-w-7xl flex-grow px-6 pb-20 pt-32">
        {children}
      </main>

      <footer className="relative z-10 border-t border-[var(--color-border)] py-8 text-center text-xs text-gray-500">
        <p>EasyDS © {new Date().getFullYear()} - 高级数据结构智能教学系统</p>
      </footer>
    </div>
  );
};

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chapters" element={<Chapters />} />
        <Route path="/practice" element={<Practice />} />
        <Route path="/practice/:chapterId" element={<Practice />} />
        <Route path="/settings/model" element={<ModelSettings />} />
      </Routes>
    </Layout>
  );
}

export default App;
