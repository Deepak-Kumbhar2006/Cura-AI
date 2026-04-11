import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, Sparkles } from 'lucide-react';
import api from '../services/api';

const quick = ['Check symptoms', 'Nearby outbreaks', 'Health tips'];

export default function ChatbotPage() {
  const [q, setQ] = useState('');
  const [messages, setMessages] = useState([{ role: 'bot', text: 'Hi! I am Cura Assistant. Ask about symptoms, outbreaks, or health tips.' }]);
  const [typing, setTyping] = useState(false);
  const boxRef = useRef(null);

  const ask = async (textInput) => {
    const query = (textInput ?? q).trim();
    if (!query) return;
    setMessages((m) => [...m, { role: 'user', text: query }]);
    setQ('');
    setTyping(true);
    try {
      let reply = '';
      try {
        const { data } = await api.post('/api/healthbot/chat', { message: query });
        reply = data.reply;
      } catch {
        const { data } = await api.post('/api/chat', { message: query });
        reply = data.reply;
      }
      setMessages((m) => [...m, { role: 'bot', text: reply }]);
    } catch {
      setMessages((m) => [...m, { role: 'bot', text: 'Chatbot is temporarily unavailable. Please try again.' }]);
    } finally {
      setTyping(false);
    }
    setTimeout(() => { boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: 'smooth' }); }, 50);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card max-w-3xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-emerald-100 bg-gradient-to-r from-emerald-50/50 to-white">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-400 grid place-items-center">
          <MessageCircle size={20} className="text-white" />
        </div>
        <div>
          <h2 className="font-display font-semibold text-slate-800">AI Health Assistant</h2>
          <span className="flex items-center gap-1 text-xs text-emerald-600">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Online
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 px-5 py-3 border-b border-emerald-50">
        {quick.map((item) => (
          <button key={item} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-medium hover:bg-emerald-100 transition-colors" onClick={() => ask(item)}>
            <Sparkles size={13} /> {item}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div ref={boxRef} className="h-80 overflow-auto p-4 space-y-3 bg-white">
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'bot' && (
                <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <MessageCircle size={13} />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${m.role === 'user' ? 'rounded-br-sm bg-gradient-to-r from-emerald-500 to-green-500 text-white' : 'rounded-bl-sm border border-emerald-100 bg-emerald-50/30 text-slate-700'}`}>
                {m.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {typing && (
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100">
              <MessageCircle size={13} className="text-emerald-600" />
            </div>
            <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-emerald-100 bg-emerald-50/30 px-3 py-2">
              {[0, 1, 2].map((i) => <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-400" style={{ animationDelay: `${i * 120}ms` }} />)}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={(e) => { e.preventDefault(); ask(); }} className="flex items-center gap-2 border-t border-emerald-100 bg-emerald-50/20 px-4 py-3">
        <input className="input-field flex-1" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type your health question..." />
        <button type="submit" disabled={!q.trim()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-soft transition hover:shadow-soft-lg disabled:opacity-40">
          <Send size={16} />
        </button>
      </form>
    </motion.div>
  );
}
