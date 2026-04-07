import { Loader2, Send } from 'lucide-react';

type Props = {
  input: string;
  setInput: (value: string) => void;
  disabled: boolean;
  isStreaming: boolean;
  onSubmit: () => void;
};

const ChatComposer = ({ input, setInput, disabled, isStreaming, onSubmit }: Props) => {
  return (
    <div className="glass-card p-3 shrink-0 flex items-end gap-3 focus-within:shadow-[0_0_30px_var(--color-accent-dim)] focus-within:border-[rgba(110,231,183,0.3)] transition-all duration-500">
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="在此输入你的理解和解答思路..."
        className="flex-grow bg-transparent border-none resize-none outline-none p-4 text-[var(--color-text)] placeholder-[var(--color-text-subtle)] min-h-[60px] max-h-[200px] leading-relaxed"
        rows={1}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSubmit();
          }
        }}
      />
      <button
        onClick={onSubmit}
        disabled={disabled}
        className="w-14 h-14 mb-2 mr-2 rounded-xl bg-gradient-to-br from-[var(--color-surface-hover)] to-transparent border border-[var(--color-border)] flex items-center justify-center text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-gray-900 shadow-[0_4px_15px_rgba(15,23,42,0.12)] hover:shadow-[0_0_25px_var(--color-accent-glow)] transition-all duration-300 disabled:opacity-40 disabled:hover:bg-[var(--color-surface-hover)] disabled:hover:text-[var(--color-accent)] disabled:hover:shadow-none group"
      >
        {isStreaming ? (
          <Loader2 className="w-6 h-6 animate-spin text-[var(--color-accent)]" />
        ) : (
          <Send className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
        )}
      </button>
    </div>
  );
};

export default ChatComposer;

