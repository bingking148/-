import { useMemo, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound, Loader2, Lock, UserRound } from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { getApiErrorMessage } from '../services/api';

type AuthMode = 'login' | 'register';

const AuthPage = ({ mode }: { mode: AuthMode }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, login, register } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextPath = useMemo(() => searchParams.get('next') || '/practice', [searchParams]);

  if (!isLoading && isAuthenticated) {
    return <Navigate to={nextPath} replace />;
  }

  const title = mode === 'login' ? '登录账号' : '创建账号';
  const subtitle =
    mode === 'login'
      ? '登录后会加载你的专属练习记录、会话历史和个人模型 Key。'
      : '注册后即可获得独立的会话空间和个人模型配置，不会和其他用户互相影响。';
  const alternatePath = mode === 'login' ? '/auth/register' : '/auth/login';
  const alternateLabel = mode === 'login' ? '没有账号？去注册' : '已有账号？去登录';
  const submitLabel = mode === 'login' ? '登录' : '注册并进入';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (mode === 'login') {
        await login(username.trim(), password);
      } else {
        await register(username.trim(), password);
      }
      navigate(nextPath, { replace: true });
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, `${submitLabel}失败，请稍后重试`));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 py-8 lg:grid lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
      <section className="glass-card flex flex-col justify-between p-8 md:p-10">
        <div>
          <div className="mb-4 inline-flex items-center gap-3 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-950">
            <KeyRound className="h-4 w-4" />
            多用户在线模式
          </div>
          <h1 className="mb-4 text-4xl font-bold text-[var(--color-text)] md:text-5xl">{title}</h1>
          <p className="max-w-xl text-base leading-8 text-[var(--color-text-muted)]">{subtitle}</p>
        </div>

        <div className="mt-8 grid gap-3 text-sm text-[var(--color-text-muted)] md:grid-cols-3">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[rgba(15,23,42,0.02)] px-4 py-4">
            <div className="mb-2 text-xs uppercase tracking-[0.28em] text-[var(--color-text-subtle)]">Sessions</div>
            <div className="text-lg font-medium text-[var(--color-text)]">DB 持久化</div>
          </div>
          <div className="rounded-2xl border border-[var(--color-border)] bg-[rgba(15,23,42,0.02)] px-4 py-4">
            <div className="mb-2 text-xs uppercase tracking-[0.28em] text-[var(--color-text-subtle)]">Auth</div>
            <div className="text-lg font-medium text-[var(--color-text)]">用户隔离</div>
          </div>
          <div className="rounded-2xl border border-[var(--color-border)] bg-[rgba(15,23,42,0.02)] px-4 py-4">
            <div className="mb-2 text-xs uppercase tracking-[0.28em] text-[var(--color-text-subtle)]">Model Key</div>
            <div className="text-lg font-medium text-[var(--color-text)]">个人配置</div>
          </div>
        </div>
      </section>

      <section className="glass-card p-8 md:p-10">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--color-text)]">{title}</h2>
            <p className="mt-2 text-sm leading-7 text-[var(--color-text-muted)]">
              用户名只需唯一，密码至少 8 位。
            </p>
          </div>
          <Link
            to={`${alternatePath}?next=${encodeURIComponent(nextPath)}`}
            className="rounded-full border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-muted)] transition-colors hover:bg-slate-900/5 hover:text-[var(--color-text)]"
          >
            {alternateLabel}
          </Link>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-3 block text-sm font-medium text-[var(--color-text)]">用户名</span>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--color-text-subtle)]" />
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="请输入用户名"
                className="w-full rounded-2xl border border-[var(--color-border)] bg-[rgba(15,23,42,0.02)] py-4 pl-12 pr-4 text-sm text-[var(--color-text)] outline-none transition-all duration-300 placeholder:text-[var(--color-text-subtle)] focus:border-emerald-400/40 focus:bg-[rgba(255,255,255,0.85)]"
                autoComplete="username"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-3 block text-sm font-medium text-[var(--color-text)]">密码</span>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--color-text-subtle)]" />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="请输入密码"
                className="w-full rounded-2xl border border-[var(--color-border)] bg-[rgba(15,23,42,0.02)] py-4 pl-12 pr-4 text-sm text-[var(--color-text)] outline-none transition-all duration-300 placeholder:text-[var(--color-text-subtle)] focus:border-emerald-400/40 focus:bg-[rgba(255,255,255,0.85)]"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>
          </label>

          {error ? (
            <div className="rounded-2xl border border-rose-500/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-950">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting || !username.trim() || password.length < 8}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 px-5 py-4 text-sm font-medium text-emerald-950 transition-all duration-300 hover:bg-emerald-400/15 hover:text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                提交中...
              </>
            ) : (
              submitLabel
            )}
          </button>
        </form>
      </section>
    </div>
  );
};

export default AuthPage;
