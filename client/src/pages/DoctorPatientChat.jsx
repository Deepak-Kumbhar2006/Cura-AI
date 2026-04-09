import { useEffect, useMemo, useRef, useState } from 'react';
import { Send, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function DoctorPatientChat() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const scrollRef = useRef(null);

  const loadContacts = async () => {
    const { data } = await api.get('/api/messages/contacts');
    setContacts(data || []);
    if (!selected && data.length) setSelected(data[0]);
  };

  const loadMessages = async (contactId) => {
    const { data } = await api.get(`/api/messages/${contactId}`);
    setMessages(data || []);
  };

  useEffect(() => {
    loadContacts().catch(() => setError('Unable to load chat contacts.'));
  }, []);

  useEffect(() => {
    if (!selected?._id) return;
    loadMessages(selected._id).catch(() => setError('Unable to load conversation.'));
  }, [selected?._id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!input.trim() || !selected?._id) return;
    try {
      const { data } = await api.post(`/api/messages/${selected._id}`, { message: input.trim() });
      setMessages((prev) => [...prev, data]);
      setInput('');
      await loadContacts();
    } catch (err) {
      setError(err.response?.data?.message || 'Message failed');
    }
  };

  const filtered = useMemo(
    () => contacts.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())),
    [contacts, search]
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Secure Doctor-Patient Chat</h2>
        <p className="text-sm text-slate-500">Role-aware messaging for case follow-up, monthly advice, and report discussion.</p>
      </div>

      {error && <div className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg p-2">{error}</div>}

      <div className="card overflow-hidden flex" style={{ height: 560 }}>
        <div className="w-80 border-r border-slate-100 flex flex-col bg-white">
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="w-full bg-slate-50 rounded-xl pl-9 pr-3 py-2 text-sm outline-none" placeholder="Search contacts..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            {filtered.map((c) => (
              <button key={c._id} onClick={() => setSelected(c)} className={`w-full text-left px-4 py-3 hover:bg-emerald-50 ${selected?._id === c._id ? 'bg-emerald-50' : ''}`}>
                <p className="text-sm font-semibold">{c.name}</p>
                <p className="text-xs text-slate-500 truncate">{c.lastMessage || `Start conversation with ${c.name}`}</p>
              </button>
            ))}
            {!filtered.length && <p className="text-sm text-slate-400 p-4">No contacts found.</p>}
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="px-5 py-3 border-b border-slate-100 bg-white">
            <p className="text-sm font-semibold text-slate-800">{selected?.name || 'Select a contact'}</p>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-auto p-5 space-y-4 bg-slate-50">
            {messages.map((m) => {
              const mine = m.senderId === user?.id;
              return (
                <div key={m._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-md px-4 py-2.5 rounded-2xl text-sm ${mine ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>
                    {m.message}
                    <p className={`text-[10px] mt-1 ${mine ? 'text-emerald-100' : 'text-slate-400'}`}>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              );
            })}
            {!messages.length && <p className="text-sm text-slate-500">No messages yet.</p>}
          </div>

          <div className="px-5 py-3 border-t border-slate-100 bg-white">
            <form onSubmit={send} className="flex items-center gap-3">
              <input className="flex-1 bg-slate-100 rounded-2xl px-4 py-2.5 text-sm outline-none" value={input} onChange={(e) => setInput(e.target.value)} placeholder={`Message ${selected?.name || ''}...`} />
              <button type="submit" disabled={!input.trim() || !selected?._id} className="p-2.5 rounded-2xl bg-emerald-600 text-white disabled:opacity-40">
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
