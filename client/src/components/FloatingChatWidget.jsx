import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import api from '../services/api';

export default function FloatingChatWidget() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState([{ role: 'bot', text: 'Need quick help? Ask me anything health-related.' }]);

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
      {open ? (
        <div className="w-80 bg-white border border-emerald-100 rounded-2xl shadow-lg p-3">
          <div className="flex justify-between mb-2"><b>Cura AI</b><button onClick={() => setOpen(false)}><X size={16} /></button></div>
          <div className="h-40 overflow-auto space-y-1 mb-2">{history.map((h, i) => <div key={i} className={`text-xs p-2 rounded ${h.role === 'bot' ? 'bg-slate-50' : 'bg-emerald-100 ml-8'}`}>{h.text}</div>)}</div>
          <form onSubmit={submit} className="space-y-2"><input className="w-full border rounded p-2" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ask quick question" /><button className="w-full bg-emerald-600 text-white rounded py-2">Send</button></form>
        </div>
      ) : (
        <button onClick={() => setOpen(true)} className="h-14 w-14 rounded-full bg-emerald-600 text-white grid place-items-center shadow-lg soft-pulse"><MessageCircle /></button>
      )}
    </div>
  );
}
