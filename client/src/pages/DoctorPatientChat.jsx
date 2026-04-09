import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User, Phone, Video, MoreVertical, Search, Circle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const demoContacts = [
  { id: '1', name: 'Dr. Sharma', role: 'doctor', status: 'online', lastMsg: 'Take care and stay hydrated', time: '2m ago' },
  { id: '2', name: 'Dr. Patel', role: 'doctor', status: 'offline', lastMsg: 'Your reports look good', time: '1h ago' },
  { id: '3', name: 'Rahul M.', role: 'patient', status: 'online', lastMsg: 'I have a mild fever', time: '5m ago' },
  { id: '4', name: 'Priya K.', role: 'patient', status: 'online', lastMsg: 'Feeling better today', time: '12m ago' },
  { id: '5', name: 'Amit S.', role: 'patient', status: 'offline', lastMsg: 'When is my next visit?', time: '3h ago' },
];

const demoMessages = [
  { from: 'other', text: 'Hello! How are you feeling today?', time: '10:00 AM' },
  { from: 'me', text: 'I have a mild headache and slight fever since morning.', time: '10:02 AM' },
  { from: 'other', text: 'I see. Have you taken any medication? What is your current temperature?', time: '10:03 AM' },
  { from: 'me', text: 'I took paracetamol an hour ago. Temperature is 99.2°F.', time: '10:05 AM' },
  { from: 'other', text: 'Good that you took paracetamol. Please drink plenty of fluids and rest. If the fever persists beyond 24 hours, we should schedule a follow-up.', time: '10:06 AM' },
];

export default function DoctorPatientChat() {
  const { user } = useAuth();
  const [contacts] = useState(() =>
    demoContacts.filter((c) => (user?.role === 'doctor' ? c.role === 'patient' : c.role === 'doctor'))
  );
  const [selected, setSelected] = useState(contacts[0] || null);
  const [messages, setMessages] = useState(demoMessages);
  const [input, setInput] = useState('');
  const [search, setSearch] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages((m) => [...m, { from: 'me', text: input, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    setInput('');
    // Simulate reply
    setTimeout(() => {
      setMessages((m) => [...m, {
        from: 'other',
        text: 'Thank you for the update. I\'ll review and get back to you shortly.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    }, 2000);
  };

  const filtered = contacts.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="animate-fade-up">
      <div className="mb-5">
        <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-white">
          {user?.role === 'doctor' ? 'Patient Chat' : 'Doctor Chat'}
        </h2>
        <p className="text-sm text-slate-500 mt-1">Real-time messaging with your {user?.role === 'doctor' ? 'patients' : 'doctors'}</p>
      </div>

      <div className="card overflow-hidden flex" style={{ height: 560 }}>
        {/* Contact List */}
        <div className="w-80 border-r border-slate-100 dark:border-slate-700 flex flex-col bg-white dark:bg-slate-800">
          <div className="p-3 border-b border-slate-100 dark:border-slate-700">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="w-full bg-surface-100 dark:bg-slate-700 rounded-xl pl-9 pr-3 py-2 text-sm outline-none placeholder-slate-400 dark:text-slate-200"
                placeholder="Search contacts..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            {filtered.map((c) => (
              <button key={c.id} onClick={() => setSelected(c)}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-primary-50/50 dark:hover:bg-slate-700/50 transition ${
                  selected?.id === c.id ? 'bg-primary-50 dark:bg-slate-700' : ''
                }`}>
                <div className="relative">
                  <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 text-white grid place-items-center text-sm font-bold">
                    {c.name[0]}
                  </div>
                  <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-slate-800 ${c.status === 'online' ? 'bg-primary-500' : 'bg-slate-300'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{c.name}</p>
                    <span className="text-[10px] text-slate-400">{c.time}</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{c.lastMsg}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        {selected ? (
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 text-white grid place-items-center text-sm font-bold">
                  {selected.name[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{selected.name}</p>
                  <p className="text-xs text-primary-600 flex items-center gap-1">
                    <Circle size={6} className={selected.status === 'online' ? 'fill-primary-500 text-primary-500' : 'fill-slate-300 text-slate-300'} />
                    {selected.status === 'online' ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-2 rounded-xl hover:bg-primary-50 dark:hover:bg-slate-700 text-slate-400 transition"><Phone size={16} /></button>
                <button className="p-2 rounded-xl hover:bg-primary-50 dark:hover:bg-slate-700 text-slate-400 transition"><Video size={16} /></button>
                <button className="p-2 rounded-xl hover:bg-primary-50 dark:hover:bg-slate-700 text-slate-400 transition"><MoreVertical size={16} /></button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-auto p-5 space-y-4 bg-surface-50 dark:bg-slate-800/50">
              {messages.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${m.from === 'me' ? 'flex-row-reverse' : ''}`}>
                  <div className={`h-7 w-7 rounded-lg grid place-items-center flex-shrink-0 ${
                    m.from === 'me'
                      ? 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                      : 'bg-gradient-to-br from-primary-500 to-primary-600 text-white'
                  }`}>
                    {m.from === 'me' ? <User size={12} /> : (user?.role === 'doctor' ? <User size={12} /> : <Bot size={12} />)}
                  </div>
                  <div>
                    <div className={`max-w-md px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      m.from === 'me'
                        ? 'bg-primary-600 text-white rounded-tr-md'
                        : 'bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-tl-md'
                    }`}>
                      {m.text}
                    </div>
                    <p className={`text-[10px] text-slate-400 mt-1 ${m.from === 'me' ? 'text-right' : ''}`}>{m.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Input */}
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
              <form onSubmit={send} className="flex items-center gap-3">
                <input className="flex-1 bg-surface-100 dark:bg-slate-700 rounded-2xl px-4 py-2.5 text-sm outline-none placeholder-slate-400 dark:text-slate-200 focus:ring-2 focus:ring-primary-200 transition"
                  value={input} onChange={(e) => setInput(e.target.value)} placeholder={`Message ${selected.name}...`} />
                <button type="submit" disabled={!input.trim()}
                  className="p-2.5 rounded-2xl bg-primary-600 text-white hover:bg-primary-700 transition disabled:opacity-30">
                  <Send size={16} />
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 grid place-items-center bg-surface-50 dark:bg-slate-800/50">
            <div className="text-center">
              <Bot size={40} className="mx-auto mb-3 text-primary-300" />
              <p className="font-semibold text-slate-600 dark:text-slate-300">Select a contact to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
