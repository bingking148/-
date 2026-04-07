import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import { Cpu, User } from 'lucide-react';
import { memo } from 'react';

type ChatMessage = { role: 'user' | 'agent'; content: string };

type Props = {
  chatHistory: ChatMessage[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  onScroll?: () => void;
};

const ChatMessageList = ({ chatHistory, containerRef, onScroll }: Props) => {
  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      className="glass-card flex-1 min-h-0 p-6 flex flex-col gap-6 overflow-y-auto glass-scrollbar shadow-inner"
    >
      {chatHistory.length === 0 ? (
        <div className="m-auto text-center max-w-md">
          <h3 className="text-xl font-medium text-slate-900 mb-3 tracking-wide" style={{ color: '#0f172a' }}>费曼学习区</h3>
          <p className="text-slate-600 text-sm leading-relaxed" style={{ color: '#475569' }}>请用你自己的话解释答案。系统将评估完整度、纠正错误概念，并针对薄弱环节进行追问。</p>
        </div>
      ) : (
        chatHistory.map((msg, idx) => (
          <div key={idx} className={`flex gap-5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-lg ${msg.role === 'user' ? 'bg-[rgba(15,23,42,0.06)] border border-[var(--color-border)]' : 'bg-gradient-to-br from-[var(--color-accent)] to-teal-600 border border-teal-400/30'}`}>
              {msg.role === 'user' ? <User className="w-5 h-5 text-[var(--color-text-muted)]" /> : <Cpu className="w-5 h-5 text-gray-900" />}
            </div>
            <div className={`p-5 rounded-2xl max-w-[85%] shadow-md backdrop-blur-md ${msg.role === 'user' ? 'bg-[rgba(15,23,42,0.03)] rounded-tr-none border border-[var(--color-border)]' : 'bg-[rgba(255,255,255,0.55)] border border-[var(--color-border)] rounded-tl-none'}`}>
              <div className="prose max-w-none prose-p:leading-relaxed prose-pre:border prose-pre:border-[var(--color-border)] text-sm md:text-base prose-headings:text-slate-900 prose-a:text-teal-700" style={{ color: '#0f172a' }}>
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex, rehypeHighlight]}>
                  {msg.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default memo(ChatMessageList);
