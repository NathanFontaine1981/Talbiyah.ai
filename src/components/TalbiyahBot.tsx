import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2, BookOpen, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  references?: Array<{
    type: 'quran' | 'hadith';
    text: string;
    citation: string;
  }>;
  jurisprudence_note?: string;
  is_complex_referral?: boolean;
  timestamp: Date;
}

export default function TalbiyahBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          type: 'bot',
          content: "As-salamu alaykum! I'm Talbiyah Bot, your Virtual Imam assistant. I specialize in answering questions about Qur'an and authentic Sunnah based on the understanding of the Salaf. How may I help you today?",
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/virtual-imam-chat`;
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          question: inputValue,
          session_id: sessionId,
          user_id: user?.id || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from Virtual Imam');
      }

      const result = await response.json();

      const botMessage: Message = {
        id: `bot-${Date.now()}`,
        type: 'bot',
        content: result.answer,
        references: result.references || [],
        jurisprudence_note: result.jurisprudence_note,
        is_complex_referral: result.is_complex_referral || false,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        type: 'bot',
        content: 'I apologize, but I encountered an error. Please try asking your question again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-full shadow-2xl shadow-emerald-500/50 flex items-center justify-center transition-all hover:scale-110 z-50 group"
          aria-label="Open Talbiyah Bot"
        >
          <MessageCircle className="w-7 h-7" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse"></span>
          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-slate-900 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Ask the Virtual Imam
          </div>
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-slate-900 border-2 border-emerald-500/30 rounded-2xl shadow-2xl flex flex-col z-50 animate-slideUp">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Talbiyah Bot</h3>
                <p className="text-emerald-100 text-xs">Virtual Imam Assistant</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    message.type === 'user'
                      ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white'
                      : 'bg-slate-800 text-slate-100'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>

                  {message.references && message.references.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-700">
                      <p className="text-xs font-semibold text-emerald-400 mb-2">📖 References:</p>
                      <div className="space-y-2">
                        {message.references.map((ref, idx) => (
                          <div key={idx} className="bg-slate-900/50 p-2 rounded-lg">
                            <p className="text-xs text-slate-300 italic mb-1">"{ref.text}"</p>
                            <p className="text-xs text-emerald-400 font-medium">
                              {ref.type === 'quran' ? '📜' : '📚'} {ref.citation}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {message.jurisprudence_note && (
                    <div className="mt-3 pt-3 border-t border-slate-700">
                      <p className="text-xs font-semibold text-amber-400 mb-1">⚖️ Jurisprudence:</p>
                      <p className="text-xs text-slate-300">{message.jurisprudence_note}</p>
                    </div>
                  )}

                  {message.is_complex_referral && (
                    <div className="mt-3 pt-3 border-t border-slate-700">
                      <div className="flex items-start space-x-2 bg-amber-500/10 p-2 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-300">
                          This requires personal guidance from a trusted scholar.
                        </p>
                      </div>
                    </div>
                  )}

                  <p className="text-xs opacity-60 mt-2">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 rounded-2xl px-4 py-3">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                    <p className="text-sm text-slate-400">Consulting Islamic sources...</p>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-slate-900 border-t border-slate-800 rounded-b-2xl">
            <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about Qur'an or Sunnah..."
                className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !inputValue.trim()}
                className="px-4 py-3 bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
            <p className="text-xs text-slate-500 text-center mt-2">
              Responses based on Qur'an & authentic Sunnah
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
