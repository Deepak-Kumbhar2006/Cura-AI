import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Search, MessageSquare, Users } from 'lucide-react';
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
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-400 grid place-items-center">
          <MessageSquare size={20} className="text-white" />
        </div>
        <div>
          <h2 className="section-title">Secure Chat</h2>
          <p className="text-sm text-slate-500">Role-aware messaging for case follow-up and report discussion</p>
        </div>
      </motion.div>

      {error && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3">{error}</motion.div>}

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card overflow-hidden flex" style={{ height: 560 }}>
        {/* Contacts sidebar */}
        <div className="w-80 border-r border-emerald-100 flex flex-col bg-white">
          <div className="p-3 border-b border-emerald-100">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400" />
              <input className="input-field pl-9 text-sm" placeholder="Search contacts..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            {filtered.map((c) => (
              <button key={c._id} onClick={() => setSelected(c)} className={`w-full text-left px-4 py-3 transition-colors hover:bg-emerald-50/50 border-b border-emerald-50 ${selected?._id === c._id ? 'bg-emerald-50 border-l-2 border-l-emerald-500' : ''}`}>
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-emerald-100 grid place-items-center shrink-0">
                    <Users size={14} className="text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{c.name}</p>
                    <p className="text-xs text-slate-500 truncate">{c.lastMessage || `Start conversation with ${c.name}`}</p>
                  </div>
                </div>
              </button>
            ))}
            {!filtered.length && <p className="text-sm text-slate-400 p-4">No contacts found.</p>}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          <div className="px-5 py-3 border-b border-emerald-100 bg-gradient-to-r from-emerald-50/30 to-white">
            <p className="text-sm font-semibold text-slate-800">{selected?.name || 'Select a contact'}</p>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-auto p-5 space-y-4 bg-white">
            {messages.map((m) => {
              const mine = m.senderId === user?.id;
              return (
                <motion.div key={m._id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-md px-4 py-2.5 rounded-2xl text-sm ${mine ? 'rounded-br-sm bg-gradient-to-r from-emerald-500 to-green-500 text-white' : 'rounded-bl-sm border border-emerald-100 bg-emerald-50/30 text-slate-700'}`}>
                    {m.message}
                    <p className={`text-[10px] mt-1 ${mine ? 'text-emerald-100' : 'text-slate-400'}`}>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </motion.div>
              );
            })}
            {!messages.length && <p className="text-sm text-slate-500 text-center py-8">No messages yet. Start a conversation!</p>}
          </div>

          <div className="px-5 py-3 border-t border-emerald-100 bg-emerald-50/20">
            <form onSubmit={send} className="flex items-center gap-3">
              <input className="input-field flex-1" value={input} onChange={(e) => setInput(e.target.value)} placeholder={`Message ${selected?.name || ''}...`} />
              <button type="submit" disabled={!input.trim() || !selected?._id} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-soft transition hover:shadow-soft-lg disabled:opacity-40">
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
