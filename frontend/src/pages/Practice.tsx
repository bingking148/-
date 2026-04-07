import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { APIService, type Question, type Chapter } from '../services/api';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import { Send, Cpu, User, Loader2, BrainCircuit } from 'lucide-react';

const Practice = () => {
  const { chapterId } = useParams();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeChapter, setActiveChapter] = useState<string>(chapterId || 'ch1');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [input, setInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'agent', content: string}[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const resetPracticeFlow = (nextChapterId: string) => {
    setActiveChapter(nextChapterId);
    setQuestions([]);
    setActiveQuestion(null);
    setSessionId(null);
    setChatHistory([]);
  };

  // Initial Data Load
  useEffect(() => {
    let isCancelled = false;

    APIService.getChapters().then(data => {
      if (isCancelled) {
        return;
      }

      setChapters(data);
      if (!chapterId && data.length > 0) {
        resetPracticeFlow(data[0].chapter_id);
      } else if (chapterId) {
        resetPracticeFlow(chapterId);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [chapterId]);

  // Load Questions when Chapter changes
  useEffect(() => {
    if (!activeChapter) {
      return;
    }

    let isCancelled = false;

    APIService.getQuestionsByChapter(activeChapter).then(data => {
      if (isCancelled) {
        return;
      }

      setQuestions(data);
      if (data.length > 0) {
        // Immediately show summary while fetching details
        setActiveQuestion(data[0]);
        APIService.getQuestionDetail(data[0].question_id).then(detail => {
          if (!isCancelled) {
            setActiveQuestion(detail);
          }
        });
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [activeChapter]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const appendToLastAgentMessage = (chunk: string) => {
    if (!chunk) {
      return;
    }

    setChatHistory((prev) => {
      if (prev.length === 0) {
        return prev;
      }

      const lastMessage = prev[prev.length - 1];
      if (lastMessage.role !== 'agent') {
        return prev;
      }

      return [
        ...prev.slice(0, -1),
        {
          ...lastMessage,
          content: `${lastMessage.content}${chunk}`,
        },
      ];
    });
  };

  const handleSubmit = async () => {
    if (!input.trim() || !activeQuestion || isStreaming) return;

    const userMessage = input;
    setInput('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsStreaming(true);

    try {
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        const sessionData = await APIService.createSession(activeQuestion.question_id);
        currentSessionId = sessionData.session_id;
        setSessionId(currentSessionId);
      }
      
      setChatHistory(prev => [...prev, { role: 'agent', content: '' }]);
      
      const url = `/api/sessions/${currentSessionId}/messages?content=${encodeURIComponent(userMessage)}`;
      const eventSource = new EventSource(url);

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.content) {
          appendToLastAgentMessage(data.content);
        }
      };

      eventSource.addEventListener('end', (event) => {
        eventSource.close();
        setIsStreaming(false);
        if (event && event.data) {
          try {
            const data = JSON.parse(event.data);
            if (data.error) {
              appendToLastAgentMessage(`\n\n[Error: ${data.error}]`);
            }
          } catch {
            // Ignore malformed end-of-stream payloads.
          }
        }
      });

      eventSource.onerror = (error) => {
        console.error('SSE Error:', error);
        eventSource.close();
        setIsStreaming(false);
      };

    } catch (error) {
      console.error(error);
      setIsStreaming(false);
      setChatHistory(prev => [...prev, { role: 'agent', content: "网络连接异常，无法连接到智能导师系统。" }]);
    }
  };

  const handleQuestionSelect = (q: Question) => {
    setActiveQuestion(q);
    setChatHistory([]);
    setSessionId(null);
    APIService.getQuestionDetail(q.question_id).then(detail => {
      setActiveQuestion(detail);
    });
  };

  return (
    <div className="flex h-[80vh] min-h-[600px] gap-6 max-w-[1400px] mx-auto w-full">
      {/* Sidebar: Chapters & Questions */}
      <div className="w-80 flex flex-col gap-4 shrink-0 h-full">
        <div className="glass-card p-4 flex flex-col h-[40%] shrink-0 relative">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 pl-2 shrink-0">课程章节</h3>
          <div className="overflow-y-auto glass-scrollbar flex flex-col gap-2 pr-2 pb-2 flex-1 min-h-0">
            {chapters.map(ch => (
              <button
                key={ch.chapter_id}
                onClick={() => resetPracticeFlow(ch.chapter_id)}
                className={`text-left text-sm px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden group shrink-0 ${activeChapter === ch.chapter_id ? 'bg-[var(--color-surface-hover)] text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]' : 'text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.03)]'}`}
              >
                {activeChapter === ch.chapter_id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[var(--color-accent)] to-teal-500 shadow-[0_0_10px_var(--color-accent-glow)]" />}
                <span className="relative z-10">{ch.title}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card p-4 flex flex-col flex-grow relative overflow-hidden">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 pl-2 shrink-0">本章题目</h3>
          <div className="overflow-y-auto glass-scrollbar flex flex-col gap-2 pr-2 pb-2 flex-1 min-h-0">
            {questions.map(q => (
              <button
                key={q.question_id}
                onClick={() => handleQuestionSelect(q)}
                className={`text-left text-sm px-4 py-3 rounded-xl transition-all duration-300 border shrink-0 ${activeQuestion?.question_id === q.question_id ? 'bg-[var(--color-surface-hover)] border-[var(--color-border)] shadow-[inset_0_0_20px_rgba(255,255,255,0.02)] text-white drop-shadow-md' : 'border-transparent text-gray-400 hover:text-white hover:bg-[rgba(255,255,255,0.02)]'}`}
              >
                <span className="line-clamp-2 leading-relaxed">{q.content}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Area: Feynman Learning Area */}
      <div className="flex-1 flex flex-col gap-4 h-full relative">
        {/* Current Question Banner */}
        <div className="glass-card p-6 shrink-0 border-l-4 border-l-[var(--color-accent)] shadow-[0_4px_20px_rgba(0,0,0,0.4)] relative overflow-visible">
          <div className="absolute -left-[2px] top-1/2 -translate-y-1/2 w-1 h-12 bg-[var(--color-accent)] blur-[8px]" />
          <div className="flex justify-between items-start mb-3">
            <h2 className="text-xl font-medium text-white drop-shadow-md">当前题目</h2>
            {activeQuestion?.difficulty && (
              <span className="text-xs px-3 py-1 rounded-full border border-[var(--color-border)] bg-[rgba(255,255,255,0.05)] text-gray-300 shadow-[0_2px_10px_rgba(0,0,0,0.2)]">
                {activeQuestion.difficulty}
              </span>
            )}
          </div>
          <div className="text-gray-200 text-lg leading-relaxed whitespace-pre-wrap">{activeQuestion?.content || "请从左侧选择题目开始练习。"}</div>
        </div>

        {/* Chat / Evaluation Area */}
        <div ref={chatContainerRef} className="glass-card flex-grow p-6 flex flex-col gap-6 overflow-y-auto glass-scrollbar shadow-inner relative">
          {chatHistory.length === 0 ? (
            <div className="m-auto text-center max-w-md">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--color-surface)] to-[rgba(255,255,255,0.01)] border border-[var(--color-border)] flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_var(--color-accent-dim)]">
                <BrainCircuit className="w-10 h-10 text-[var(--color-accent)] opacity-90 drop-shadow-[0_0_8px_var(--color-accent-glow)]" />
              </div>
              <h3 className="text-xl font-medium text-white mb-3 tracking-wide">费曼学习区</h3>
              <p className="text-gray-400 text-sm leading-relaxed">请用你自己的话解释答案。AI 多智能体系统将评估你的完整度、纠正错误概念，并针对薄弱环节进行深度追问。</p>
            </div>
          ) : (
            chatHistory.map((msg, idx) => (
              <div key={idx} className={`flex gap-5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-lg ${msg.role === 'user' ? 'bg-gray-800 border border-gray-700' : 'bg-gradient-to-br from-[var(--color-accent)] to-teal-600 shadow-[0_0_20px_var(--color-accent-glow)] border border-teal-400/30'}`}>
                  {msg.role === 'user' ? <User className="w-5 h-5 text-gray-400" /> : <Cpu className="w-5 h-5 text-gray-900" />}
                </div>
                <div className={`p-5 rounded-2xl max-w-[85%] shadow-md backdrop-blur-md ${msg.role === 'user' ? 'bg-[var(--color-surface-hover)] rounded-tr-none border border-[rgba(255,255,255,0.05)]' : 'bg-[rgba(20,25,30,0.6)] border border-[var(--color-border)] rounded-tl-none'}`}>
                  <div className={`prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-gray-900/80 prose-pre:border prose-pre:border-[var(--color-border)] text-sm md:text-base prose-headings:text-teal-50 prose-a:text-teal-400 ${msg.role === 'user' ? 'text-[var(--color-accent)] prose-p:text-[var(--color-accent)] prose-strong:text-[var(--color-accent)]' : 'text-white prose-p:text-white prose-strong:text-white'}`}>
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex, rehypeHighlight]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Area */}
        <div className="glass-card p-3 shrink-0 flex items-end gap-3 focus-within:shadow-[0_0_30px_var(--color-accent-dim)] focus-within:border-[rgba(110,231,183,0.3)] transition-all duration-500">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="在此输入你的理解和解答思路..."
            className="flex-grow bg-transparent border-none resize-none outline-none p-4 text-gray-100 placeholder-gray-600 min-h-[60px] max-h-[200px] leading-relaxed"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <button 
            onClick={handleSubmit}
            disabled={!input.trim() || isStreaming || !activeQuestion}
            className="w-14 h-14 mb-2 mr-2 rounded-xl bg-gradient-to-br from-[var(--color-surface-hover)] to-transparent border border-[var(--color-border)] flex items-center justify-center text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-gray-900 shadow-[0_4px_15px_rgba(0,0,0,0.2)] hover:shadow-[0_0_25px_var(--color-accent-glow)] transition-all duration-300 disabled:opacity-40 disabled:hover:bg-[var(--color-surface-hover)] disabled:hover:text-[var(--color-accent)] disabled:hover:shadow-none group"
          >
            {isStreaming ? (
              <Loader2 className="w-6 h-6 animate-spin text-[var(--color-accent)]" />
            ) : (
              <Send className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Practice;
