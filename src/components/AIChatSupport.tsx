import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  X, 
  Send, 
  MessageSquare, 
  ArrowRight, 
  RefreshCw, 
  ShieldCheck,
  Bot
} from 'lucide-react';

interface AIChatSupportProps {
  lang: 'ko' | 'en';
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIChatSupport({ lang }: AIChatSupportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial welcome message
    setMessages([
      {
        role: 'assistant',
        content: lang === 'ko' 
          ? '반갑습니다! 동우산업주식회사 공식 AI 기술 비서입니다. 도로안전시설물 규격, 시험성적서, 설치 기준, 재질 사양 등에 관해 무엇이든 물어보세요!'
          : 'Welcome! I am Doongwoo Safety AI Assistant. Ask me anything about standard specifications, test results, and drawing designs.'
      }
    ]);
  }, [lang]);

  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener('open-ai-chat', handleOpenChat);
    return () => window.removeEventListener('open-ai-chat', handleOpenChat);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputVal).trim();
    if (!text) return;

    if (!textToSend) setInputVal('');
    
    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg]
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        throw new Error('Server error');
      }
    } catch (e) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: lang === 'ko'
          ? '죄송합니다. 현재 AI 서버와 통신이 원활하지 않습니다. 고객센터(031-965-1133)로 연락 주시면 상세히 설명 드리겠습니다.'
          : 'Sorry, communication failed. Please contact support hotline.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const presetQuestions = lang === 'ko' ? [
    '스틸 볼라드(DW-S100)와 우레탄 볼라드의 차이는?',
    '볼라드 설치 법적 기준과 규격은?',
    'CAD 표준 설계 도면은 어디서 받나요?',
    '조달청 단체 수량 할인 혜택 기준이 궁금해요'
  ] : [
    'What is the material of DW-S100?',
    'Bollard height specifications standard?',
    'How do I download CAD drawings?',
    'Do you support custom sizing?'
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end" id="ai-chat-support-container">
      
      {/* Expanded chat window */}
      {isOpen && (
        <div className="bg-white w-[350px] sm:w-[380px] h-[500px] rounded-lg shadow-2xl border border-border-light flex flex-col overflow-hidden mb-4 animate-in slide-in-from-bottom-5 fade-in duration-200">
          
          {/* Header */}
          <div className="bg-navy text-white p-4 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-orange-brand rounded flex items-center justify-center text-white">
                <Sparkles className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="text-xs font-extrabold flex items-center space-x-1">
                  <span>동우산업주식회사 AI 기술비서</span>
                  <span className="text-[8px] bg-green-600 text-white px-1 rounded animate-pulse">LIVE</span>
                </p>
                <p className="text-[9px] text-slate-400">Gemini 2.5 Flash 기반 지능형 상담</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Messages screen */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg, idx) => (
              <div 
                key={idx}
                className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'justify-end' : ''}`}
              >
                {msg.role === 'assistant' && (
                  <div className="h-7 w-7 bg-navy rounded flex items-center justify-center text-white flex-shrink-0 mt-0.5">
                    <Bot className="h-4 w-4 text-orange-brand" />
                  </div>
                )}
                
                <div className={`p-3 rounded text-xs max-w-[75%] leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-orange-brand text-white rounded-tr-none font-medium shadow-sm'
                    : 'bg-white text-slate-800 border border-border-light rounded-tl-none font-normal'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-start gap-2.5">
                <div className="h-7 w-7 bg-navy rounded flex items-center justify-center text-white flex-shrink-0 mt-0.5">
                  <Bot className="h-4 w-4 text-orange-brand animate-spin" />
                </div>
                <div className="p-3 bg-white text-slate-500 border border-border-light rounded rounded-tl-none text-xs flex items-center space-x-1 shadow-sm">
                  <RefreshCw className="h-3 w-3 animate-spin text-orange-brand" />
                  <span>분석 및 답변 작성 중...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Presets and entry */}
          <div className="p-4 bg-white border-t border-border-light space-y-3">
            {messages.length <= 2 && !loading && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">추천 질문 선택</p>
                <div className="flex flex-col gap-1">
                  {presetQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(q)}
                      className="w-full text-left text-[10px] text-slate-600 hover:text-orange-brand hover:bg-orange-brand/10 border border-border-light hover:border-orange-brand/30 p-2 rounded transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span className="truncate">{q}</span>
                      <ArrowRight className="h-3 w-3 text-slate-300" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="relative"
            >
              <input 
                type="text"
                placeholder={lang === 'ko' ? '질문을 적어주세요...' : 'Type your question...'}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                className="w-full bg-slate-50 border border-gray-300 rounded pl-4 pr-10 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-brand"
              />
              <button 
                type="submit"
                className="absolute right-2 top-2 p-1.5 bg-orange-brand hover:bg-orange-brand-hover text-white rounded transition-colors cursor-pointer"
              >
                <Send className="h-3 w-3" />
              </button>
            </form>

            <div className="flex items-center justify-center space-x-1 text-[9px] text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-green-600" />
              <span>실시간 AI 지원봇 서비스는 안전하게 암호화됩니다.</span>
            </div>
          </div>

        </div>
      )}

      {/* Floating launcher trigger */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 bg-navy hover:bg-orange-brand text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 transition-all focus:outline-none border-2 border-white relative group cursor-pointer"
        id="ai-floating-trigger"
      >
        <Sparkles className="h-6 w-6 text-orange-brand group-hover:text-white transition-colors" />
        <span className="absolute -top-1 -right-1 bg-orange-brand text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-white">
          AI
        </span>
      </button>

    </div>
  );
}
