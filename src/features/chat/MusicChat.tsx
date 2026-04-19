import { useState, useEffect, useRef } from 'react';
import { getAuthToken, API_URL } from '../../lib/api';
import { Send, Loader2, Sparkles, MessageCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export default function MusicChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', text: '¡Hola! Soy tu asistente musical **SpotyAI** ✨.\n\nHe estado analizando tu historial y conozco bien lo que escuchas. ¿En qué te ayudo hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userContext, setUserContext] = useState<{ topArtists: string[], topTracks: string[] } | null>(null);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleToggle = () => setIsOpen(true);
    window.addEventListener('open-chat', handleToggle);
    return () => window.removeEventListener('open-chat', handleToggle);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages, isOpen]);

  useEffect(() => {
    const fetchContext = async () => {
      const token = await getAuthToken();
      if (!token) return;

      try {
         const [artistsRes, tracksRes] = await Promise.all([
            fetch('https://api.spotify.com/v1/me/top/artists?limit=5', { headers: { Authorization: `Bearer ${token}` } }),
            fetch('https://api.spotify.com/v1/me/top/tracks?limit=5', { headers: { Authorization: `Bearer ${token}` } })
         ]);

         const artists = await artistsRes.json();
         const tracks = await tracksRes.json();

         setUserContext({
            topArtists: artists.items?.map((a: any) => a.name) || [],
            topTracks: tracks.items?.map((t: any) => `${t.name} (por ${t.artists?.[0]?.name})`) || []
         });
      } catch (err) {
         console.error('Error fetching context:', err);
         setUserContext({ topArtists: [], topTracks: [] });
      }
    };
    fetchContext();
  }, []);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { id: Date.now().toString(), role: 'user', text: input.trim() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const token = await getAuthToken();
      if (!token) throw new Error('No token');

      const historyToSend = messages.slice(1).map(m => ({
         role: m.role,
         parts: [{ text: m.text }]
      }));

      const res = await fetch(`${API_URL}/api/ai/chat`, {
        method: 'POST',
        headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
           message: userMessage.text,
           history: historyToSend,
           userContext
        })
      });

      if (!res.ok) throw new Error('Failed to get chat response');
      const data = await res.json();

      const modelMessage: Message = { id: (Date.now() + 1).toString(), role: 'model', text: data.text };
      setMessages(prev => [...prev, modelMessage]);

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { id: 'err', role: 'model', text: 'Ups, parece que perdí la conexión con el servidor. Intenta enviarlo de nuevo. 😅' }]);
    } finally {
      setLoading(false);
    }
  };

  const renderBubble = (msg: Message) => {
    const isUser = msg.role === 'user';
    return (
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        key={msg.id}
        className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`flex max-w-[85%] items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          {!isUser && (
             <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#1DB954] to-[#1ed760] flex items-center justify-center flex-shrink-0 shadow-lg">
                <Sparkles size={12} className="text-black" />
             </div>
          )}
          
          <div className={`p-3 text-[13px] rounded-2xl whitespace-pre-wrap leading-relaxed shadow-sm ${
             isUser 
                ? 'bg-zinc-800 text-white rounded-br-none' 
                : 'bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-bl-none'
          }`}>
             {msg.text.split('\\n').map((line, i) => (
                <span key={i}>
                   {line}
                   <br />
                </span>
             ))}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="mb-4 w-[340px] sm:w-[380px] h-[500px] max-h-[75vh] bg-[#0a0a0a] border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="shrink-0 bg-[#121212]/90 backdrop-blur-md border-b border-zinc-800 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageCircle size={20} className="text-[#1DB954]" />
                <div>
                  <h2 className="text-sm font-bold leading-tight text-white">SpotyAI</h2>
                  <p className="text-[10px] text-[#1DB954] font-medium flex items-center gap-1">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1DB954] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#1DB954]"></span>
                    </span>
                    Online
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-zinc-500 hover:text-white transition-colors p-1"
              >
                <X size={18} />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar-chat bg-zinc-950">
              <AnimatePresence>
                {messages.map(renderBubble)}
                {loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="flex w-full justify-start mb-4"
                  >
                    <div className="flex items-end gap-2">
                       <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#1DB954] to-[#1ed760] flex items-center justify-center flex-shrink-0 shadow-lg">
                          <Sparkles size={12} className="text-black" />
                       </div>
                       <div className="p-3 text-[13px] rounded-2xl rounded-bl-none bg-zinc-900 border border-zinc-800 text-zinc-300">
                          <Loader2 size={14} className="animate-spin text-[#1DB954]" />
                       </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={bottomRef} className="h-2"></div>
            </div>

            {/* Input Area */}
            <div className="shrink-0 p-3 bg-[#0a0a0a] border-t border-zinc-800/80">
              <form onSubmit={handleSend} className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Pregúntame algo..."
                  className="w-full bg-zinc-900 border border-zinc-700/50 rounded-full py-2.5 pl-4 pr-12 text-white focus:outline-none focus:border-[#1DB954]/50 focus:ring-1 focus:ring-[#1DB954]/50 transition-all font-medium placeholder:text-zinc-500 text-sm"
                  disabled={!userContext || loading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || !userContext || loading}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#1DB954] text-black flex items-center justify-center hover:bg-[#1ed760] disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-500 transition-colors"
                >
                  <Send size={14} className="ml-0.5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-[0_0_20px_rgba(29,185,84,0.3)] flex items-center justify-center transition-colors border-2 ${
          isOpen 
          ? 'bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700' 
          : 'bg-gradient-to-tr from-[#1DB954] to-[#1ed760] border-transparent text-black hover:opacity-90'
        }`}
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} className="fill-black/10" />}
      </motion.button>
      
      {/* Unread badge pulse effect when closed and ready */}
      {!isOpen && userContext && (
         <span className="absolute top-0 right-0 flex h-3 w-3">
           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
           <span className="relative inline-flex rounded-full h-3 w-3 bg-white border-2 border-[#1ed760]"></span>
         </span>
      )}

      <style>{`
        .custom-scrollbar-chat::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar-chat::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar-chat::-webkit-scrollbar-thumb { background-color: #3f3f46; border-radius: 10px; }
      `}</style>
    </div>
  );
}
