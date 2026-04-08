import { useRef, useState } from 'react';
import api from '../services/api';

const quick = ['Check symptoms', 'Nearby outbreaks', 'Health tips'];

export default function ChatbotPage() {
  const [q, setQ] = useState('');
  const [messages, setMessages] = useState([{ role: 'bot', text: 'Hi! I am Cura Assistant. Ask about symptoms, outbreaks, or health tips.' }]);
  const boxRef = useRef(null);

  const ask = async (textInput) => {
    const query = (textInput ?? q).trim();
    if (!query) return;
    setMessages((m) => [...m, { role: 'user', text: query }]);
    setQ('');
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
    }
    setTimeout(() => { boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: 'smooth' }); }, 50);
  };

  return (
    <div className="bg-white rounded-2xl border border-emerald-100 p-4 max-w-3xl">
      <h2 className="text-3xl font-bold mb-3">AI Chatbot Assistant</h2>
      <div className="flex flex-wrap gap-2 mb-3">{quick.map((item) => <button key={item} className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm" onClick={() => ask(item)}>{item}</button>)}</div>
      <div ref={boxRef} className="h-80 overflow-auto border rounded p-3 bg-slate-50 space-y-2">{messages.map((m, i) => <div key={i} className={`p-2 rounded max-w-[90%] ${m.role === 'bot' ? 'bg-white border' : 'bg-emerald-100 ml-auto'}`}>{m.text}</div>)}</div>
      <form onSubmit={(e) => { e.preventDefault(); ask(); }} className="mt-3 flex gap-2"><input className="flex-1 border rounded p-2" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type your health question..." /><button className="px-4 py-2 bg-emerald-600 text-white rounded">Send</button></form>
    </div>
  );
}
