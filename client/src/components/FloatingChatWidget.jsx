import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import api from '../services/api';

export default function FloatingChatWidget() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [resp, setResp] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const { data } = await api.get('/api/insights', { params: { q: query } });
    setResp(data.message);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open ? (
        <div className="w-80 bg-white border rounded-2xl shadow-lg p-3">
          <div className="flex justify-between mb-2"><b>Cura AI</b><button onClick={() => setOpen(false)}><X size={16} /></button></div>
          <form onSubmit={submit} className="space-y-2"><input className="w-full border rounded p-2" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ask quick question" /><button className="w-full bg-emerald-600 text-white rounded py-2">Ask</button></form>
          {resp && <p className="mt-2 text-sm bg-slate-50 border rounded p-2">{resp}</p>}
        </div>
      ) : (
        <button onClick={() => setOpen(true)} className="h-14 w-14 rounded-full bg-emerald-600 text-white grid place-items-center shadow-lg soft-pulse"><MessageCircle /></button>
      )}
    </div>
  );
}
