import { useEffect, useRef, useState, type FormEvent } from 'react';
import { gsap } from 'gsap';
import { Eye, EyeOff, KeyRound, Loader2, Save, ShieldCheck, Trash2 } from 'lucide-react';

import { APIService, getApiErrorMessage, type ModelSettingsStatus } from '../services/api';

type FeedbackState =
  | {
      type: 'success' | 'error';
      message: string;
    }
  | null;

const sourceLabels: Record<string, string> = {
  personal: '当前用户的专属 Key',
  env: '服务器环境变量',
  none: '未配置',
};

const sourceBadgeClassNames: Record<string, string> = {
  personal:
    'border-emerald-200 bg-emerald-50 text-emerald-800',
  env: 'border-sky-200 bg-sky-50 text-sky-800',
  none: 'border-slate-200 bg-slate-100 text-slate-600',
};

const ModelSettings = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState<ModelSettingsStatus | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    gsap.fromTo(
      containerRef.current.children,
      { y: 36, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.9, stagger: 0.14, ease: 'power3.out' },
    );
  }, []);

  useEffect(() => {
    const loadSettings = async () => {
      setLoading(true);
      try {
        const response = await APIService.getModelSettings();
        setSettings(response);
      } catch (error) {
        setFeedback({
          type: 'error',
          message: getApiErrorMessage(error, '模型设置加载失败，请稍后重试。'),
        });
      } finally {
        setLoading(false);
      }
    };

    void loadSettings();
  }, []);

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedKey = apiKey.trim();
    if (!trimmedKey) {
      setFeedback({ type: 'error', message: '请输入有效的 API Key。' });
      return;
    }

    setSaving(true);
    setFeedback(null);

    try {
      const response = await APIService.updateModelSettings(trimmedKey);
      setSettings(response);
      setApiKey('');
      setShowApiKey(false);
      setFeedback({
        type: 'success',
        message: response.message || '当前用户的 DeepSeek API Key 已保存。',
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getApiErrorMessage(error, '保存 API Key 失败，请稍后重试。'),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setClearing(true);
    setFeedback(null);

    try {
      const response = await APIService.clearModelSettings();
      setSettings(response);
      setApiKey('');
      setShowApiKey(false);
      setFeedback({
        type: 'success',
        message: response.message || '当前用户的自定义 Key 已清除。',
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getApiErrorMessage(error, '清除 API Key 失败，请稍后重试。'),
      });
    } finally {
      setClearing(false);
    }
  };

  const source = settings?.source || 'none';
  const sourceLabel = sourceLabels[source] || source;
  const badgeClassName =
    sourceBadgeClassNames[source] || 'border-slate-200 bg-slate-100 text-slate-600';
  const hasConfiguredKey = Boolean(settings?.configured);
  const canClearPersonalKey = source === 'personal' && !clearing;

  // 防止 settings 为 null 时的渲染错误
  if (!loading && !settings) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-4 py-20">
        <div className="text-lg text-slate-600">配置加载失败</div>
        <button
          onClick={() => window.location.reload()}
          className="rounded-xl bg-emerald-500 px-4 py-2 text-white hover:bg-emerald-600"
        >
          刷新页面
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="mx-auto flex max-w-6xl flex-col gap-6 py-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm md:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-3 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
              <ShieldCheck className="h-4 w-4" />
              个人模型设置
            </div>
            <h1 className="mb-4 text-4xl font-bold text-slate-900 md:text-5xl">
              为当前账号配置 DeepSeek API Key
            </h1>
            <p className="max-w-2xl text-base leading-8 text-slate-600">
              保存后的 Key 只会作用于当前登录用户的问答会话，不会覆盖其他用户，也不会再写入服务端共享配置文件。
              如果你没有保存个人 Key，系统会自动回退到服务器环境变量。
            </p>
          </div>

          <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2 lg:min-w-[320px]">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="mb-2 text-xs uppercase tracking-[0.3em] text-slate-400">Provider</div>
              <div className="text-lg font-medium text-slate-900">DeepSeek</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="mb-2 text-xs uppercase tracking-[0.3em] text-slate-400">状态</div>
              <div className="text-lg font-medium text-slate-900">
                {hasConfiguredKey ? '已配置' : '未配置'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {feedback && (
        <div
          className={`rounded-2xl border px-5 py-4 text-sm ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-slate-900">填写个人 API Key</h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              这里保存的是当前账号的专属配置。为了安全，已保存的 Key 只会以脱敏形式展示。
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSave}>
            <label className="block">
              <span className="mb-3 block text-sm font-medium text-slate-900">DeepSeek API Key</span>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(event) => setApiKey(event.target.value)}
                    placeholder="请输入 sk-... 格式的 API Key"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-14 text-sm text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:shadow-[0_0_24px_rgba(110,231,183,0.16)]"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey((value) => !value)}
                    className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl border border-transparent text-slate-400 transition-colors hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                    aria-label={showApiKey ? '隐藏 API Key' : '显示 API Key'}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={saving || !apiKey.trim()}
                  className="inline-flex min-w-[148px] items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-800 transition-all duration-300 hover:bg-emerald-100 hover:text-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      保存 Key
                    </>
                  )}
                </button>
              </div>
            </label>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-7 text-slate-600">
              提交后只会更新当前登录用户的 `api_key`，不会修改服务器上其他用户的配置，也不会影响环境变量回退逻辑。
            </div>
          </form>
        </section>

        <aside className="flex flex-col gap-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">当前生效配置</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  页面会优先显示当前用户保存的个人 Key，其次回退到服务器环境变量。
                </p>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs ${badgeClassName}`}>{sourceLabel}</span>
            </div>

            {loading ? (
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                正在读取模型设置...
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-4">
                  <div className="mb-2 text-xs uppercase tracking-[0.28em] text-slate-500">密钥状态</div>
                  <div className="text-base font-semibold text-slate-900">
                    {hasConfiguredKey && settings?.masked_key ? settings.masked_key : '尚未提供 API Key'}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-4">
                  <div className="mb-2 text-xs uppercase tracking-[0.28em] text-slate-500">配置来源</div>
                  <div className="text-base font-semibold text-slate-900">{sourceLabel || '未配置'}</div>
                </div>

                <button
                  type="button"
                  onClick={handleClear}
                  disabled={!canClearPersonalKey}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-medium text-slate-900 transition-all duration-300 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-800 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-slate-200 disabled:hover:bg-slate-50 disabled:hover:text-slate-900"
                >
                  {clearing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      清除中...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      清除个人 Key
                    </>
                  )}
                </button>

                <p className="text-xs leading-6 text-slate-400">
                  只有当前账号保存的个人 Key 可以从这里清除。若当前使用的是环境变量，清除按钮会自动禁用。
                </p>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">使用说明</h2>
            <div className="mt-4 space-y-3 text-sm leading-7 text-slate-600">
              <p>1. 保存后的 Key 只作用于当前账号，多个用户同时在线时互不影响。</p>
              <p>2. 如果你清除了个人 Key，系统会自动回退到服务器环境变量。</p>
              <p>3. 如果练习页仍然提示模型鉴权失败，先回到这里确认当前来源和脱敏状态是否正确。</p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default ModelSettings;
