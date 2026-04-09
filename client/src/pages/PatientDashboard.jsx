import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Send, Heart, Activity, Thermometer, Wind, ChevronRight, Sparkles } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const asArray = (v) => Array.isArray(v) ? v : [];

const riskConfig = {
  Low: { label: 'Healthy', score: 88, color: 'emerald', bar: 'bg-emerald-400', badge: 'bg-emerald-100 text-emerald-700', text: 'text-emerald-600', ring: 'ring-emerald-200' },
  Medium: { label: 'At Risk', score: 63, color: 'amber', bar: 'bg-amber-400', badge: 'bg-amber-100 text-amber-700', text: 'text-amber-600', ring: 'ring-amber-200' },
  High: { label: 'Critical', score: 41, color: 'rose', bar: 'bg-rose-400', badge: 'bg-rose-100 text-rose-700', text: 'text-rose-600', ring: 'ring-rose-200' },
};

const VitalPill = ({ icon: Icon, label, value, color }) => {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
  };
  return (
    <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${colors[color]}`}>
      <Icon size={14} />
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wider opacity-70">{label}</p>
        <p className="text-sm font-semibold leading-tight">{value || '—'}</p>
      </div>
    </div>
  );
};

const Card = ({ children, className = '' }) => (
  <div className={`rounded-2xl border border-stone-200/80 bg-white shadow-sm ${className}`}>{children}</div>
);

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

export default function PatientDashboard() {
  const [records, setRecords] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hi there! I\'m your AI Health Assistant. Tell me how you\'re feeling today, or describe any symptoms you have.' }
  ]);
  const [prompt, setPrompt] = useState('');
  const [typing, setTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const chatRef = useRef(null);

  useEffect(() => {
    Promise.all([api.get('/api/data/me'), api.get('/api/dashboard/stats'), api.get('/api/alerts').catch(() => ({ data: [] }))])
      .then(([r, s, a]) => {
        setRecords(asArray(r.data));
        setStats(s.data || {});
        const alertPayload = Array.isArray(a.data) ? a.data : a.data?.alerts;
        setAlerts(asArray(alertPayload));
      })
      .catch(() => toast.error('Unable to load health data'));
  }, []);

  const latest = records[0];
  const risk = latest?.risk || 'Low';
  const rCfg = riskConfig[risk] || riskConfig.Low;

  const sendChat = async (text = prompt) => {
    if (!text.trim()) return;
    setMessages((m) => [...m, { role: 'user', text }]);
    setPrompt('');
    setTyping(true);
    try {
      const { data } = await api.post('/api/chat', { message: text });
      setMessages((m) => [...m, { role: 'bot', text: data.reply }]);
    } catch {
      setMessages((m) => [...m, { role: 'bot', text: 'I\'m having trouble connecting. Please try again shortly.' }]);
    } finally {
      setTyping(false);
      setTimeout(() => chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' }), 50);
    }
  };

  const startVoice = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return toast.error('Voice input not supported');
    const rec = new Recognition();
    rec.lang = 'en-US';
    rec.onstart = () => setIsListening(true);
    rec.onend = () => setIsListening(false);
    rec.onresult = (e) => setPrompt(e.results[0][0].transcript);
    rec.start();
  };

  const recs = asArray(stats?.recommendations).length ? asArray(stats.recommendations) : ['Stay hydrated — drink 8 glasses of water daily', 'Consult your doctor if symptoms persist', 'Avoid crowded places during outbreak alerts'];

  return (
    <div className="min-h-screen bg-stone-50" style={{ fontFamily: "'Instrument Sans', 'DM Sans', 'Plus Jakarta Sans', sans-serif" }}>
      {/* Warm gradient header accent */}
      <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" />

      <div className="mx-auto max-w-5xl space-y-4 p-4 md:p-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-stone-400">My Health</p>
            <h1 className="text-xl font-semibold text-stone-800">
              {latest?.personalDetails?.name || 'Your'} Dashboard
            </h1>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 ring-1 ring-teal-500/20">
            <Heart size={16} />
          </div>
        </motion.div>

        <div className="card p-4">
          <h3 className="font-semibold">Nearby Risk Alerts</h3>
          <div className="mt-2 space-y-2 text-sm">
            {asArray(alerts).slice(0, 3).map((a, idx) => <div key={a._id || `${a.location || 'alert'}-${idx}`} className="p-2 rounded bg-rose-50">{a.message || 'Outbreak signal detected.'}</div>)}
            {!alerts.length && <div className="p-2 rounded bg-emerald-50">No critical alerts nearby.</div>}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-3">
        <div className="card p-4 lg:col-span-2">
          <h3 className="font-semibold mb-2">Health Timeline</h3>
          <div className="max-h-64 overflow-auto space-y-2">
            {asArray(records).map((r) => (
              <div key={r._id} className="border-l-4 border-emerald-300 pl-3 py-1">
                <p className="text-sm font-semibold">{new Date(r.createdAt).toLocaleString()}</p>
                <p className="text-sm">{asArray(r.symptoms).map((sym) => `${sym.name} (${sym.severity})`).join(', ') || 'No symptoms'} · {r.risk}</p>
                <p className="text-xs text-slate-500">{r.diagnosis?.status ? `Doctor status: ${r.diagnosis.status}` : 'Awaiting doctor review'}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <div className="card p-4 text-sm">
          <h3 className="font-semibold mb-2">Recommendations Engine</h3>
          {(asArray(stats?.recommendations).length ? asArray(stats.recommendations) : ['Drink water', 'Visit doctor', 'Avoid crowded places']).map((tip, idx) => <p key={`${tip}-${idx}`} className="p-2 rounded bg-emerald-50 mb-2">• {String(tip)}</p>)}
          <div className="mt-3 p-2 rounded bg-indigo-50 text-indigo-700">Health Score: <b>{latest?.risk === 'Low' ? '88' : latest?.risk === 'Medium' ? '63' : '41'}</b>/100</div>
        </div>
      </div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
            <Card className="h-full p-5">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles size={14} className="text-teal-500" />
                <h3 className="text-sm font-semibold text-stone-700">Recommendations</h3>
              </div>
              <div className="space-y-2">
                {recs.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-stone-600">
                    <ChevronRight size={13} className="mt-0.5 shrink-0 text-teal-400" />
                    <span>{String(tip)}</span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Health Timeline */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="p-5">
            <h3 className="mb-4 text-sm font-semibold text-stone-700">Health Timeline</h3>
            <div className="max-h-60 overflow-auto space-y-0 pr-1">
              {asArray(records).map((r, i) => (
                <div key={r._id} className="relative flex gap-4">
                  {/* Timeline line */}
                  {i < records.length - 1 && (
                    <div className="absolute left-[7px] top-5 bottom-0 w-px bg-stone-200" />
                  )}
                  <div className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-teal-500 ring-2 ring-white ring-offset-1 shadow-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  </div>
                  <div className="mb-4 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-stone-700">{new Date(r.createdAt).toLocaleDateString()}</p>
                      <p className="text-[10px] text-stone-400">{new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${(riskConfig[r.risk] || riskConfig.Low).badge}`}>{r.risk}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-stone-600">
                      {asArray(r.symptoms).map((s) => `${s.name} (${s.severity})`).join(', ') || 'No symptoms recorded'}
                    </p>
                    <p className="mt-0.5 text-[10px] text-stone-400">
                      {r.diagnosis?.status ? `Doctor: ${r.diagnosis.status}` : 'Awaiting doctor review'}
                    </p>
                  </div>
                </div>
              ))}
              {!records.length && <p className="py-4 text-center text-xs text-stone-400">No health records yet. Submit your first check-in!</p>}
            </div>
          </Card>
        </motion.div>

        {/* AI Chatbot */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 border-b border-stone-100 bg-stone-50/50 px-5 py-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
                <Activity size={13} />
              </div>
              <h3 className="text-sm font-semibold text-stone-700">AI Health Assistant</h3>
              <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-600">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Online
              </span>
            </div>

            {/* Chat messages */}
            <div ref={chatRef} className="h-56 overflow-auto space-y-3 p-4 bg-white">
              <AnimatePresence initial={false}>
                {messages.map((m, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {m.role === 'bot' && (
                      <div className="mr-2 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-600">
                        <Activity size={11} />
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${m.role === 'user'
                        ? 'rounded-br-sm bg-teal-500 text-white'
                        : 'rounded-bl-sm border border-stone-200 bg-stone-50 text-stone-700'
                      }`}>
                      {m.text}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {typing && (
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-100">
                    <Activity size={11} className="text-teal-600" />
                  </div>
                  <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-stone-200 bg-stone-50 px-3 py-2">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400" style={{ animationDelay: `${i * 120}ms` }} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 border-t border-stone-100 bg-stone-50/50 p-3">
              <button
                onClick={startVoice}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition ${isListening ? 'border-rose-300 bg-rose-50 text-rose-500 animate-pulse' : 'border-stone-200 bg-white text-stone-500 hover:border-stone-300'
                  }`}
              >
                <Mic size={15} />
              </button>
              <input
                className="flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-800 placeholder-stone-400 outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/30 transition"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                placeholder="Describe your symptoms, ask about medications..."
              />
              <button
                onClick={() => sendChat()}
                disabled={!prompt.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-500 text-white shadow-sm transition hover:bg-teal-600 disabled:opacity-40 active:scale-95"
              >
                <Send size={14} />
              </button>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}