import { useState } from 'react';
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
    <div className="card p-4">
      <h2 className="text-2xl font-bold mb-2">HealthBot Integration (legacy frontend/backend)</h2>
      <p className="text-sm text-slate-500 mb-3">This connects your old HealthBot backend folder via `/api/healthbot/chat` bridge.</p>
      <div className="h-64 overflow-auto border rounded p-2 bg-slate-50 space-y-2">{history.map((m, i) => <div key={i} className={`p-2 rounded ${m.role === 'bot' ? 'bg-white border' : 'bg-emerald-100 ml-10'}`}>{m.text}</div>)}</div>
      <form onSubmit={send} className="mt-2 flex gap-2"><input className="flex-1 border rounded p-2" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Ask legacy healthbot" /><button className="bg-emerald-600 text-white px-3 rounded">Send</button></form>
    </div>
  );
}
