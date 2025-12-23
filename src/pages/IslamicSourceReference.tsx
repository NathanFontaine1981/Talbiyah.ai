import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Send, BookOpen, Sparkles, Loader2, Trash2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  references?: Array<{
    type: 'quran' | 'hadith';
    text: string;
    citation: string;
  }>;
  jurisprudence_note?: string;
  is_complex_referral?: boolean;
}

export default function VirtualImam() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversationHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  async function loadConversationHistory() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: conversations, error } = await supabase
        .from('imam_conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(50); // Load last 50 conversations

      if (error) throw error;

      if (conversations && conversations.length > 0) {
        const loadedMessages: Message[] = [];
        conversations.forEach(conv => {
          loadedMessages.push({
            id: `${conv.id}-q`,
            role: 'user',
            content: conv.question,
            timestamp: new Date(conv.created_at)
          });
          loadedMessages.push({
            id: `${conv.id}-a`,
            role: 'assistant',
            content: conv.answer,
            timestamp: new Date(conv.created_at)
          });
        });
        setMessages(loadedMessages);
      } else {
        // Add welcome message if no history
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: 'As-salamu alaykum! I am the Islamic Source Reference tool. I help you find relevant ayahs from the Quran and authentic Hadith based on the understanding of the Salaf. Please remember: I am a reference tool, not a mufti. Always consult a qualified scholar or imam for religious rulings. How can I help you find Islamic sources today?',
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Error loading conversation history:', error);
      // Add welcome message on error
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: 'As-salamu alaykum! I am the Islamic Source Reference tool. I help you find relevant ayahs from the Quran and authentic Hadith based on the understanding of the Salaf. Please remember: I am a reference tool, not a mufti. Always consult a qualified scholar or imam for religious rulings. How can I help you find Islamic sources today?',
        timestamp: new Date()
      }]);
    } finally {
      setLoadingHistory(false);
    }
  }

  async function sendMessage() {
    if (!inputText.trim() || loading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Call Supabase Edge Function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/virtual-imam-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            question: userMessage.content,
            session_id: sessionId,
            user_id: user?.id || null
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get response from Islamic Source Reference');
      }

      const result = await response.json();

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: result.answer,
        references: result.references || [],
        jurisprudence_note: result.jurisprudence_note,
        is_complex_referral: result.is_complex_referral || false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error: any) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `I apologise, but I encountered an error: ${error.message}. Please try again or contact support if the issue persists.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }

  async function deleteConversationHistory() {
    if (!confirm('Are you sure you want to delete all your conversation history?')) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('imam_conversations')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: 'As-salamu alaykum! I am the Islamic Source Reference tool. I help you find relevant ayahs from the Quran and authentic Hadith based on the understanding of the Salaf. Please remember: I am a reference tool, not a mufti. Always consult a qualified scholar or imam for religious rulings. How can I help you find Islamic sources today?',
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Error deleting conversation history:', error);
      toast.error('Failed to delete conversation history. Please try again.');
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loadingHistory) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-gray-500 hover:text-gray-900 transition"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-gray-900" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Islamic Source Reference</h1>
                <p className="text-xs text-gray-500">Find Quran & Hadith Evidence</p>
              </div>
            </div>

            <button
              onClick={deleteConversationHistory}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100/80 hover:bg-red-600/20 text-gray-500 hover:text-red-400 rounded-lg transition border border-gray-200"
              title="Delete conversation history"
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm">Clear History</span>
            </button>
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-8">
          <div className="space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-6 py-4 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-gray-900'
                      : 'bg-gray-50 border border-gray-200 text-gray-800'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <Sparkles className="w-5 h-5 text-gray-900" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>

                      {message.references && message.references.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-xs font-semibold text-emerald-400 mb-3">📖 References:</p>
                          <div className="space-y-2">
                            {message.references.map((ref, idx) => (
                              <div key={idx} className="bg-white/50 p-3 rounded-lg">
                                <p className="text-xs text-gray-600 italic mb-1.5">"{ref.text}"</p>
                                <p className="text-xs text-emerald-400 font-medium">
                                  {ref.type === 'quran' ? '📜' : '📚'} {ref.citation}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {message.jurisprudence_note && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <p className="text-xs font-semibold text-amber-400 mb-2">⚖️ Jurisprudence:</p>
                          <p className="text-xs text-gray-600">{message.jurisprudence_note}</p>
                        </div>
                      )}

                      {message.is_complex_referral && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex items-start space-x-2 bg-amber-500/10 p-3 rounded-lg">
                            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-300">
                              This requires personal guidance from a trusted scholar.
                            </p>
                          </div>
                        </div>
                      )}

                      <p className={`text-xs mt-3 ${message.role === 'user' ? 'text-emerald-100' : 'text-gray-500'}`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] bg-gray-50 border border-gray-200 rounded-2xl px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-gray-900 animate-spin" />
                    </div>
                    <p className="text-gray-500 text-sm">Thinking...</p>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>

      {/* Input Area */}
      <div className="bg-white backdrop-blur-md border-t border-gray-200 sticky bottom-0">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex items-end space-x-4">
            <div className="flex-1">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Find ayahs or hadiths about..."
                disabled={loading}
                rows={1}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ minHeight: '52px', maxHeight: '200px' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 200) + 'px';
                }}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!inputText.trim() || loading}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-gray-900 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 h-[52px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Send</span>
                </>
              )}
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-3 text-center">
            Reference Tool Only • Provides Quran & Hadith citations • Always consult qualified scholars or imams for religious rulings
          </p>
        </div>
      </div>
    </div>
  );
}
