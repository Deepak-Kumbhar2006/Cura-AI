import { useState } from 'react';
import api from '../services/api';

export default function ChatbotPage() {
  const [q, setQ] = useState('');
  const [messages, setMessages] = useState([{ role: 'bot', text: 'Hi! Ask me about risks, trends, prevention, or alerts.' }]);

  const ask = async (e) => {
    e.preventDefault();
    if (!q.trim()) return;
    const userMsg = { role: 'user', text: q };
    setMessages((m) => [...m, userMsg]);
    setQ('');
    const { data } = await api.get('/api/insights', { params: { q: userMsg.text } });
    setMessages((m) => [...m, { role: 'bot', text: data.message }]);
  };

  return (
    <div className="bg-white rounded-2xl border p-4 max-w-3xl">
      <h2 className="text-3xl font-bold mb-3">AI Chatbot Assistant</h2>
      <div className="h-80 overflow-auto border rounded p-3 bg-slate-50 space-y-2">{messages.map((m, i) => <div key={i} className={`p-2 rounded ${m.role === 'bot' ? 'bg-white' : 'bg-emerald-100 ml-8'}`}>{m.text}</div>)}</div>
      <form onSubmit={ask} className="mt-3 flex gap-2"><input className="flex-1 border rounded p-2" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask: explain high-risk areas" /><button className="px-4 py-2 bg-emerald-600 text-white rounded">Send</button></form>
    </div>
  );
}
