import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import api from '../services/api';

export default function FloatingChatWidget() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [typing, setTyping] = useState(false);
  const [history, setHistory] = useState([{ role: 'bot', text: 'Need quick help? Ask me anything health-related.' }]);
  const scrollRef = useRef(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    const msg = query;
    setHistory((h) => [...h, { role: 'user', text: msg }]);
    setQuery('');
    setTyping(true);
    try {
      const { data } = await api.post('/api/chat', { message: msg });
      setHistory((h) => [...h, { role: 'bot', text: data.reply }]);
    } catch {
      setHistory((h) => [...h, { role: 'bot', text: 'I\'m temporarily unavailable. Please try again.' }]);
    } finally {
      setTyping(false);
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 50);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="w-80 mb-3 rounded-2xl shadow-elevated overflow-hidden bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-500 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot size={18} className="text-white" />
                <span className="text-sm font-semibold text-white">Cura AI</span>
                <span className="h-1.5 w-1.5 rounded-full bg-green-300 animate-pulse" />
              </div>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-white/20 text-white transition"><X size={16} /></button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="h-56 overflow-auto p-3 space-y-2.5 bg-surface-50 dark:bg-slate-800">
              {history.map((h, i) => (
                <div key={i} className={`flex gap-2 ${h.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`h-6 w-6 rounded-lg grid place-items-center flex-shrink-0 ${
                    h.role === 'bot' ? 'bg-primary-100 dark:bg-primary-900/30' : 'bg-slate-100 dark:bg-slate-600'
                  }`}>
                    {h.role === 'bot' ? <Bot size={12} className="text-primary-600" /> : <User size={12} className="text-slate-500" />}
                  </div>
                  <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                    h.role === 'bot'
                      ? 'bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-tl-md'
                      : 'bg-primary-600 text-white rounded-tr-md'
                  }`}>
                    {h.text}
                  </div>
                </div>
              ))}
              {typing && (
                <div className="flex gap-2">
                  <div className="h-6 w-6 rounded-lg bg-primary-100 dark:bg-primary-900/30 grid place-items-center"><Bot size={12} className="text-primary-600" /></div>
                  <div className="bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 px-3 py-2 rounded-2xl rounded-tl-md">
                    <div className="flex gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={submit} className="p-3 border-t border-slate-100 dark:border-slate-700 flex gap-2">
              <input className="flex-1 bg-surface-100 dark:bg-slate-700 rounded-xl px-3 py-2 text-xs outline-none placeholder-slate-400 dark:text-slate-200 focus:ring-2 focus:ring-primary-200 transition"
                value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ask a question..." />
              <button type="submit" disabled={!query.trim()} className="p-2 rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition disabled:opacity-30">
                <Send size={14} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className="h-14 w-14 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white grid place-items-center shadow-elevated hover:shadow-glow transition-shadow">
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </motion.button>
    </div>
  );
}
