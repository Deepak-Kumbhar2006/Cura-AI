import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send } from 'lucide-react';
import api from '../services/api';

export default function HealthBotIntegration() {
  const [msg, setMsg] = useState('');
  const [history, setHistory] = useState([{ role: 'bot', text: 'Legacy HealthBot bridge ready. Ask a health question.' }]);

  const send = async (e) => {
    e.preventDefault();
    if (!msg.trim()) return;
    const q = msg;
    setMsg('');
    setHistory((h) => [...h, { role: 'user', text: q }]);
    const { data } = await api.post('/api/healthbot/chat', { message: q });
    setHistory((h) => [...h, { role: 'bot', text: data.reply }]);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card overflow-hidden max-w-3xl">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-emerald-100 bg-gradient-to-r from-emerald-50/50 to-white">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-400 grid place-items-center">
          <Bot size={20} className="text-white" />
        </div>
        <div>
          <h2 className="font-display font-semibold text-slate-800">HealthBot Integration</h2>
          <p className="text-xs text-slate-500">Legacy backend bridge via /api/healthbot/chat</p>
        </div>
      </div>

      <div className="h-64 overflow-auto p-4 space-y-3 bg-white">
        <AnimatePresence initial={false}>
          {history.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'bot' && (
                <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <Bot size={13} />
                </div>
              )}
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${m.role === 'user' ? 'rounded-br-sm bg-gradient-to-r from-emerald-500 to-green-500 text-white' : 'rounded-bl-sm border border-emerald-100 bg-emerald-50/30 text-slate-700'}`}>
                {m.text}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <form onSubmit={send} className="flex items-center gap-2 border-t border-emerald-100 bg-emerald-50/20 px-4 py-3">
        <input className="input-field flex-1" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Ask legacy healthbot" />
        <button type="submit" disabled={!msg.trim()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-soft transition hover:shadow-soft-lg disabled:opacity-40">
          <Send size={16} />
        </button>
      </form>
    </motion.div>
  );
}
