import React, { useEffect, useRef } from 'react';
import { NavLink, Route, Routes, Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BrainCircuit, LogIn, LogOut, Settings2, UserRoundPlus } from 'lucide-react';

import RequireAuth from './components/RequireAuth';
import { useAuth } from './context/AuthContext';
import ChapterKnowledge from './pages/ChapterKnowledge';
import Chapters from './pages/Chapters';
import Home from './pages/Home';
import ModelSettings from './pages/ModelSettings';
import PracticeChat from './pages/PracticeChat';
import PracticeList from './pages/PracticeList';
import AuthPage from './pages/AuthPage';

gsap.registerPlugin(ScrollTrigger);

const baseNavItems = [
  { to: '/', label: '首页', end: true },
  { to: '/chapters', label: '章节' },
  { to: '/practice', label: '练习' },
  { to: '/settings/model', label: '模型设置' },
];

const Layout = ({ children }: { children: React.ReactNode }) => {
  const navRef = useRef<HTMLElement>(null);
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  useEffect(() => {
    gsap.fromTo(
      navRef.current,
      { y: -100, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.2, ease: 'power4.out', delay: 0.2 },
    );
  }, []);

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden">
      <div className="pointer-events-none fixed left-[-10%] top-[-10%] h-[60%] w-[60%] rounded-full bg-emerald-200/55 blur-[160px] mix-blend-multiply" />
      <div className="pointer-events-none fixed bottom-[-10%] right-[-10%] h-[70%] w-[70%] rounded-full bg-cyan-200/50 blur-[190px] mix-blend-multiply" />

      <nav ref={navRef} className="fixed left-1/2 top-6 z-50 w-[90%] max-w-6xl -translate-x-1/2">
        <div className="glass rounded-[2rem] px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <Link to="/" className="group flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-accent)] to-teal-500 shadow-[0_0_20px_var(--color-accent-dim)] transition-all duration-500 group-hover:shadow-[0_0_30px_var(--color-accent-glow)]">
                <BrainCircuit className="h-5 w-5 text-gray-900" />
              </div>
              <span className="text-lg font-semibold tracking-wider text-[var(--color-text)]">EasyDS</span>
            </Link>

            <div className="flex flex-wrap items-center gap-2">
              {baseNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `rounded-full px-4 py-2 text-sm transition-all duration-300 ${
                      isActive
                        ? 'bg-slate-900/5 text-[var(--color-text)] shadow-[0_10px_30px_rgba(15,23,42,0.06)]'
                        : 'text-[var(--color-text-muted)] hover:bg-slate-900/4 hover:text-[var(--color-text)]'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 xl:justify-end">
              {isLoading ? (
                <div className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-muted)]">
                  正在恢复登录状态...
                </div>
              ) : isAuthenticated && user ? (
                <>
                  <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[rgba(15,23,42,0.03)] px-4 py-2 text-sm text-[var(--color-text)]">
                    <Settings2 className="h-4 w-4 text-[var(--color-accent)]" />
                    {user.username}
                  </div>
                  <button
                    type="button"
                    onClick={() => void logout()}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-muted)] transition-colors hover:bg-slate-900/5 hover:text-[var(--color-text)]"
                  >
                    <LogOut className="h-4 w-4" />
                    退出
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/auth/login"
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-muted)] transition-colors hover:bg-slate-900/5 hover:text-[var(--color-text)]"
                  >
                    <LogIn className="h-4 w-4" />
                    登录
                  </Link>
                  <Link
                    to="/auth/register"
                    className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-950 transition-colors hover:bg-emerald-400/15 hover:text-[var(--color-text)]"
                  >
                    <UserRoundPlus className="h-4 w-4" />
                    注册
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="relative z-10 mx-auto w-full max-w-7xl flex-grow px-6 pb-20 pt-32">{children}</main>

      <footer className="relative z-10 border-t border-[var(--color-border)] py-8 text-center text-xs text-gray-500">
        <p>EasyDS © {new Date().getFullYear()} - 数据结构智能教学系统</p>
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
        <Route path="/chapters/:chapterId" element={<ChapterKnowledge />} />
        <Route path="/auth/login" element={<AuthPage mode="login" />} />
        <Route path="/auth/register" element={<AuthPage mode="register" />} />
        <Route
          path="/practice"
          element={
            <RequireAuth>
              <PracticeList />
            </RequireAuth>
          }
        />
        <Route
          path="/practice/:chapterId"
          element={
            <RequireAuth>
              <PracticeList />
            </RequireAuth>
          }
        />
        <Route
          path="/practice/:chapterId/:questionId"
          element={
            <RequireAuth>
              <PracticeChat />
            </RequireAuth>
          }
        />
        <Route
          path="/settings/model"
          element={
            <RequireAuth>
              <ModelSettings />
            </RequireAuth>
          }
        />
      </Routes>
    </Layout>
  );
}

export default App;
