import React, { useState } from 'react';
import { motion, AnimatePresence, useDragControls } from 'motion/react';
import { MessageSquare, Brain, X, Send, User, ExternalLink, AlertTriangle } from 'lucide-react';
import { cleanApiUrl } from '@/src/lib/api-utils';
import { supabase } from '@/src/lib/supabase';

interface AIChatProps {
  userId?: string | null;
  context?: {
    question?: string;
    explanation?: string;
  };
}

export default function AIChat({ userId, context }: AIChatProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatSize, setChatSize] = useState({ width: 500, height: 600 });
  const [isMobile, setIsMobile] = useState(false);
  const dragControls = useDragControls();

  React.useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setChatSize({ width: window.innerWidth, height: window.innerHeight });
      } else {
        setChatSize({ width: 500, height: 600 });
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  React.useEffect(() => {
    if (userId) {
      const fetchHistory = async () => {
        try {
          const { data, error } = await supabase
            .from('chat_history')
            .select('messages')
            .eq('user_id', userId)
            .maybeSingle();
            
          if (error) {
            console.error('Supabase fetch error:', error);
          }
            
          if (data && data.messages) {
            setChatMessages(data.messages as any);
          } else {
            setChatMessages([]); // Clear lingering messages
          }
        } catch (err) {
          console.error('Failed to load chat history:', err);
        }
      };
      fetchHistory();
    } else {
      try {
        const saved = localStorage.getItem('medtest_chat_history');
        if (saved) setChatMessages(JSON.parse(saved));
      } catch {}
    }
  }, [userId]);

  const handleResize = (e: React.MouseEvent) => {
    if (isMobile) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = chatSize.width;
    const startHeight = chatSize.height;

    const onMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(400, startWidth + (moveEvent.clientX - startX));
      const newHeight = Math.max(400, startHeight + (moveEvent.clientY - startY));
      setChatSize({ width: newWidth, height: newHeight });
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;

    const userMessage = chatInput.trim();
    console.log('Sending AI request:', { message: userMessage, context });
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsChatLoading(true);

    const baseUrl = cleanApiUrl(import.meta.env.VITE_API_URL || '');
    const apiUrl = `${baseUrl}/api/ai/chat`;
    console.log(`Calling ${apiUrl}... full URL: ${apiUrl.startsWith('http') ? apiUrl : window.location.origin + apiUrl}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatMessages, { role: 'user', content: userMessage }],
          context: context
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Chat failed');
      }
      
      const data = await response.json();
      console.log('AI response received:', data);
      const newMessages: {role: 'user' | 'assistant', content: string}[] = [...chatMessages, { role: 'user', content: userMessage }, { role: 'assistant', content: data.content }];
      setChatMessages(newMessages);
      
      if (userId) {
        const { error: upsertError } = await supabase
          .from('chat_history')
          .upsert({ user_id: userId, messages: newMessages }, { onConflict: 'user_id' });
          
        if (upsertError) {
          console.error('Supabase upsert error:', upsertError);
        }
      } else {
        localStorage.setItem('medtest_chat_history', JSON.stringify(newMessages));
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMessage = error.message === 'Chat failed' ? 'Kechirasiz, javob olishda xatolik yuz berdi.' : error.message;
      setChatMessages(prev => [...prev, { role: 'assistant', content: errorMessage || 'Kechirasiz, javob olishda xatolik yuz berdi.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-28 right-4 md:bottom-32 md:right-8 lg:bottom-8 lg:right-8 z-[110] w-14 h-14 md:w-16 md:h-16 bg-[#1B4D3E] text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-[#153a2f] transition-colors border-4 border-white"
      >
        {isChatOpen ? <X size={24} className="md:w-7 md:h-7" /> : <MessageSquare size={24} className="md:w-7 md:h-7" />}
        {!isChatOpen && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white"
          />
        )}
      </motion.button>

      <AnimatePresence>
        {isChatOpen && (
          <div className={`fixed inset-0 z-[100] ${isMobile ? 'pointer-events-auto' : 'pointer-events-none flex items-center justify-center'}`}>
            <motion.div 
              drag={!isMobile}
              dragControls={dragControls}
              dragListener={false}
              dragMomentum={false}
              initial={isMobile ? { y: '100%' } : { scale: 0.9, opacity: 0, y: 20 }}
              animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1, y: 0 }}
              exit={isMobile ? { y: '100%' } : { scale: 0.9, opacity: 0, y: 20 }}
              style={isMobile ? { width: '100%', height: '100%' } : { width: chatSize.width, height: chatSize.height }}
              className={`bg-[#0F172A] ${isMobile ? 'rounded-none' : 'rounded-[32px] border border-slate-800 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)]'} flex flex-col overflow-hidden pointer-events-auto relative`}
            >
              {/* Chat Header - Drag Handle */}
              <div 
                onPointerDown={(e) => !isMobile && dragControls.start(e)}
                className={`p-4 md:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 backdrop-blur-md ${isMobile ? '' : 'cursor-move'} select-none touch-none`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#1B4D3E]/20 flex items-center justify-center border border-[#1B4D3E]/30">
                    <Brain className="text-[#1B4D3E]" size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">AI Tibbiy Yordamchi</h3>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <p className="text-slate-400 text-[10px] font-medium uppercase tracking-wider">Online</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setIsChatOpen(false)}
                    className="w-8 h-8 rounded-full bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400 flex items-center justify-center transition-all"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
                {chatMessages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                    <div className="w-16 h-16 rounded-3xl bg-slate-800/50 flex items-center justify-center">
                      <MessageSquare size={32} className="text-slate-600" />
                    </div>
                    <p className="text-slate-400 text-sm max-w-[250px] font-medium">
                      Mavzu yuzasidan istalgan savolingizni bering. AI sizga batafsil tushuntirib beradi.
                    </p>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-sm ${
                        msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-[#1B4D3E] text-white'
                      }`}>
                        {msg.role === 'user' ? <User size={14} /> : <Brain size={14} />}
                      </div>
                      <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        msg.role === 'user' 
                          ? 'bg-blue-600/10 text-blue-100 border border-blue-500/20 rounded-tr-none' 
                          : 'bg-slate-800/50 text-slate-200 border border-slate-700/50 rounded-tl-none'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  </motion.div>
                ))}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="flex gap-3">
                      <div className="w-7 h-7 rounded-lg bg-[#1B4D3E] text-white flex items-center justify-center shadow-sm">
                        <Brain size={14} className="animate-pulse" />
                      </div>
                      <div className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-2xl rounded-tl-none flex gap-1.5 items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#1B4D3E] animate-bounce" />
                        <div className="w-1.5 h-1.5 rounded-full bg-[#1B4D3E] animate-bounce [animation-delay:0.2s]" />
                        <div className="w-1.5 h-1.5 rounded-full bg-[#1B4D3E] animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="p-5 bg-slate-900/80 backdrop-blur-md border-t border-slate-800">
                <div className="relative">
                  <input 
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Savolingizni yozing..."
                    className="w-full bg-slate-800/50 border border-slate-700 text-white rounded-2xl py-3.5 pl-5 pr-14 focus:outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]/30 transition-all text-sm"
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim() || isChatLoading}
                    className="absolute right-1.5 top-1.5 bottom-1.5 w-11 rounded-xl bg-[#1B4D3E] text-white flex items-center justify-center hover:bg-[#153a2f] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#1B4D3E]/20"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>

              {/* Resize Handle */}
              {!isMobile && (
                <div 
                  onMouseDown={handleResize}
                  className="absolute bottom-0 right-0 w-8 h-8 cursor-nwse-resize flex items-end justify-end p-1.5 group z-50"
                >
                  <div className="w-3 h-3 border-r-2 border-b-2 border-slate-600 group-hover:border-[#1B4D3E] transition-colors rounded-br-sm" />
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
