import { useEffect, useRef, useState, type FormEvent } from 'react';
import { gsap } from 'gsap';
import {
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Save,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import {
  APIService,
  getApiErrorMessage,
  type ModelSettingsStatus,
} from '../services/api';

type FeedbackState =
  | {
      type: 'success' | 'error';
      message: string;
    }
  | null;

const sourceLabels: Record<string, string> = {
  custom: '前端保存的自定义 Key',
  env: '服务端环境变量',
  none: '未配置',
};

const sourceBadgeClassNames: Record<string, string> = {
  custom:
    'border-emerald-400/30 bg-emerald-400/10 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.12)]',
  env: 'border-sky-400/30 bg-sky-400/10 text-sky-200 shadow-[0_0_20px_rgba(56,189,248,0.12)]',
  none: 'border-white/10 bg-white/5 text-gray-300',
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
        message: response.message || 'DeepSeek API Key 已保存。',
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        message: getApiErrorMessage(error, 'API Key 保存失败，请稍后重试。'),
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
        message: response.message || '自定义 API Key 已清除。',
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
    sourceBadgeClassNames[source] || 'border-white/10 bg-white/5 text-gray-300';
  const hasConfiguredKey = Boolean(settings?.configured);
  const canClearCustomKey = source === 'custom' && !clearing;

  return (
    <div ref={containerRef} className="mx-auto flex max-w-6xl flex-col gap-6 py-8">
      <section className="glass-card p-8 md:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-3 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200">
              <ShieldCheck className="h-4 w-4" />
              模型设置
            </div>
            <h1 className="mb-4 text-4xl font-bold text-white drop-shadow-lg md:text-5xl">
              在前端页面配置 DeepSeek API Key
            </h1>
            <p className="max-w-2xl text-base leading-8 text-gray-300">
              这里直接对接 manage_model_settings API。输入并保存后，练习页就会使用新的模型密钥；如果服务端已经通过环境变量提供了 Key，这里也会展示当前来源。
            </p>
          </div>

          <div className="grid gap-3 text-sm text-gray-300 sm:grid-cols-2 lg:min-w-[320px]">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-xl">
              <div className="mb-2 text-xs uppercase tracking-[0.3em] text-gray-500">Provider</div>
              <div className="text-lg font-medium text-white">DeepSeek</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-xl">
              <div className="mb-2 text-xs uppercase tracking-[0.3em] text-gray-500">状态</div>
              <div className="text-lg font-medium text-white">
                {hasConfiguredKey ? '已配置' : '未配置'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {feedback && (
        <div
          className={`rounded-2xl border px-5 py-4 text-sm backdrop-blur-xl ${
            feedback.type === 'success'
              ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-100'
              : 'border-rose-400/25 bg-rose-400/10 text-rose-100'
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <section className="glass-card p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-white">填写 API Key</h2>
            <p className="mt-3 text-sm leading-7 text-gray-400">
              保存后会立即覆盖当前的自定义 DeepSeek Key。为了安全，已保存的 Key 只会以脱敏形式展示。
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSave}>
            <label className="block">
              <span className="mb-3 block text-sm font-medium text-gray-200">DeepSeek API Key</span>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(event) => setApiKey(event.target.value)}
                    placeholder="请输入 sk-... 格式的 API Key"
                    className="w-full rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.04)] py-4 pl-12 pr-14 text-sm text-white outline-none transition-all duration-300 placeholder:text-gray-600 focus:border-emerald-400/40 focus:bg-[rgba(255,255,255,0.06)] focus:shadow-[0_0_24px_rgba(110,231,183,0.12)]"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey((value) => !value)}
                    className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl border border-transparent text-gray-400 transition-colors hover:border-white/10 hover:bg-white/5 hover:text-white"
                    aria-label={showApiKey ? '隐藏 API Key' : '显示 API Key'}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={saving || !apiKey.trim()}
                  className="inline-flex min-w-[148px] items-center justify-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm font-medium text-emerald-100 shadow-[0_0_24px_rgba(110,231,183,0.12)] transition-all duration-300 hover:bg-emerald-400/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-emerald-400/10"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      保存中
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

            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm leading-7 text-gray-400">
              当前页面只提交 api_key 字段到后端 /api/settings/model，不会在前端持久化明文密钥。
            </div>
          </form>
        </section>

        <aside className="flex flex-col gap-6">
          <section className="glass-card p-7">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-white">当前配置</h2>
                <p className="mt-2 text-sm leading-6 text-gray-400">
                  页面会优先显示自定义配置，其次显示环境变量配置。
                </p>
              </div>
              <span className={`rounded-full border px-3 py-1 text-xs ${badgeClassName}`}>
                {sourceLabel}
              </span>
            </div>

            {loading ? (
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-gray-300">
                <Loader2 className="h-4 w-4 animate-spin text-emerald-300" />
                正在读取模型设置...
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  <div className="mb-2 text-xs uppercase tracking-[0.28em] text-gray-500">密钥状态</div>
                  <div className="text-base font-medium text-white">
                    {hasConfiguredKey ? settings?.masked_key : '尚未提供 API Key'}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                  <div className="mb-2 text-xs uppercase tracking-[0.28em] text-gray-500">配置来源</div>
                  <div className="text-base font-medium text-white">{sourceLabel}</div>
                </div>

                <button
                  type="button"
                  onClick={handleClear}
                  disabled={!canClearCustomKey}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-medium text-gray-200 transition-all duration-300 hover:border-rose-400/20 hover:bg-rose-400/10 hover:text-rose-100 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-white/10 disabled:hover:bg-white/5 disabled:hover:text-gray-200"
                >
                  {clearing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      清除中
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      清除自定义 Key
                    </>
                  )}
                </button>

                <p className="text-xs leading-6 text-gray-500">
                  只有通过这个页面保存的自定义 Key 可以被清除。若当前使用的是环境变量，清除按钮会保持禁用。
                </p>
              </div>
            )}
          </section>

          <section className="glass-card p-7">
            <h2 className="text-xl font-semibold text-white">使用说明</h2>
            <div className="mt-4 space-y-3 text-sm leading-7 text-gray-400">
              <p>1. 输入新的 API Key 后点击“保存 Key”，后端会立即更新运行时模型配置。</p>
              <p>2. 若服务端存在环境变量 Key，自定义 Key 被清除后会自动回退到环境变量。</p>
              <p>3. 如果练习页仍然报模型鉴权错误，可以先返回这里确认来源和脱敏状态是否正确。</p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default ModelSettings;
