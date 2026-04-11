import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

export default function FloatingChatWidget() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState([{ role: 'bot', text: 'Need quick help? Ask me anything health-related.' }]);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [history]);

  const submit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    const msg = query;
    setHistory((h) => [...h, { role: 'user', text: msg }]);
    setQuery('');
    try {
      let reply = '';
      try {
        const { data } = await api.post('/api/healthbot/chat', { message: msg });
        reply = data.reply;
      } catch {
        const { data } = await api.post('/api/chat', { message: msg });
        reply = data.reply;
      }
      setHistory((h) => [...h, { role: 'bot', text: reply }]);
    } catch {
      setHistory((h) => [...h, { role: 'bot', text: 'Chatbot is temporarily unavailable. Please try again.' }]);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-80 bg-white/90 backdrop-blur-xl border border-emerald-100/60 rounded-2xl shadow-soft-lg mb-3 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-green-400 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot size={18} className="text-white" />
                <span className="text-sm font-semibold text-white">CuraAI Assistant</span>
              </div>
              <button onClick={() => setOpen(false)} className="h-7 w-7 rounded-lg bg-white/20 hover:bg-white/30 text-white grid place-items-center transition-colors">
                <X size={14} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="h-52 overflow-auto p-3 space-y-2">
              {history.map((h, i) => (
                <div key={i} className={`flex ${h.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] text-xs px-3 py-2 rounded-xl ${
                    h.role === 'bot'
                      ? 'bg-emerald-50 text-slate-700 border border-emerald-100/60'
                      : 'bg-gradient-to-r from-emerald-500 to-green-400 text-white'
                  }`}>
                    {h.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <form onSubmit={submit} className="p-3 border-t border-emerald-100/60 flex gap-2">
              <input
                className="flex-1 input-field text-xs py-2"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask a health question..."
              />
              <button type="submit" disabled={!query.trim()} className="h-9 w-9 rounded-xl bg-gradient-to-r from-emerald-500 to-green-400 text-white grid place-items-center disabled:opacity-40 transition-opacity">
                <Send size={14} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((v) => !v)}
        className="h-14 w-14 rounded-full bg-gradient-to-br from-emerald-500 to-green-400 text-white grid place-items-center shadow-soft-lg soft-pulse"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </motion.button>
    </div>
  );
}
