import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Send, Heart, Activity, Thermometer, Wind, ChevronRight, Sparkles } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const asArray = (v) => Array.isArray(v) ? v : [];

const riskColor = {
  Low: 'text-emerald-600',
  Medium: 'text-amber-600',
  High: 'text-rose-600',
};

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
  <div className={`rounded-2xl border border-emerald-100/50 bg-white shadow-card transition-all duration-300 hover:shadow-card-hover ${className}`}>{children}</div>
);


export default function PatientDashboard() {
  const [records, setRecords] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [personalRisk, setPersonalRisk] = useState(null);
  const [messages, setMessages] = useState([{ role: 'bot', text: 'Hi, I am your AI Health Assistant. Describe your symptoms.' }]);
  const [prompt, setPrompt] = useState('');
  const [typing, setTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const chatRef = useRef(null);

  useEffect(() => {
    Promise.all([api.get('/api/data/me'), api.get('/api/dashboard/stats'), api.get('/api/alerts').catch(() => ({ data: [] })), api.get('/api/personal-risk').catch(() => ({ data: null }))])
      .then(([r, s, a, pr]) => {
        setRecords(asArray(r.data));
        setStats(s.data || {});
        const alertPayload = Array.isArray(a.data) ? a.data : a.data?.alerts;
        setAlerts(asArray(alertPayload));
        setPersonalRisk(pr.data || null);
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
    <div>
      <div className="mx-auto max-w-5xl space-y-4">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-emerald-600">My Health</p>
              <h1 className="text-xl font-display font-semibold text-slate-800">
                {latest?.personalDetails?.name || 'Your'} Dashboard
              </h1>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200">
              <Heart size={16} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <p className={`text-2xl font-bold ${riskColor[latest?.risk] || 'text-stone-500'}`}>
              Risk: {latest?.risk || 'No data'}
            </p>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${latest?.risk === 'High' ? 'bg-rose-100 text-rose-600' : latest?.risk === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {latest?.risk === 'High' ? 'Critical' : latest?.risk === 'Medium' ? 'At Risk' : 'Healthy'}
            </span>
          </div>
          {personalRisk && (
            <p className="text-sm text-indigo-700">
              Your personal risk: <b>{personalRisk.riskLevel}</b> ({personalRisk.category || 'General'}) &middot; Score {personalRisk.score}
            </p>
          )}
        </motion.div>

        {/* Vitals Row */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="flex flex-wrap gap-2">
          <VitalPill icon={Thermometer} label="Temperature" value={latest?.vitals?.temperature ? `${latest.vitals.temperature}°F` : null} color="rose" />
          <VitalPill icon={Activity} label="Heart Rate" value={latest?.vitals?.heartRate ? `${latest.vitals.heartRate} bpm` : null} color="emerald" />
          <VitalPill icon={Wind} label="Humidity" value={latest?.humidity ? `${latest.humidity}%` : null} color="blue" />
        </motion.div>

        {/* Risk Score Visual */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-stone-700">Health Score</h3>
              <span className={`text-2xl font-bold ${rCfg.text}`}>{rCfg.score}/100</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-stone-100 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${rCfg.bar}`} style={{ width: `${rCfg.score}%` }} />
            </div>
            <p className="mt-2 text-xs text-stone-500">Based on your latest symptom submission and local outbreak data</p>
          </Card>
        </motion.div>

        {/* Alerts */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-stone-700 mb-3">Nearby Risk Alerts</h3>
            <div className="space-y-2">
              {asArray(alerts).slice(0, 5).map((a, idx) => (
                <div key={a._id || `alert-${idx}`} className={`rounded-xl p-3 text-xs ${a.severity === 'high' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                  <p className="font-semibold">{a.disease || 'Alert'} &middot; {a.region || a.location || 'Nearby'}</p>
                  <p className="mt-0.5">{a.message || 'Outbreak signal detected.'}</p>
                </div>
              ))}
              {!alerts.length && (
                <div className="rounded-xl p-3 bg-emerald-50 text-emerald-700 text-xs border border-emerald-200">No critical alerts nearby. Stay safe!</div>
              )}
            </div>
          </Card>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-4">
          {/* Recommendations */}
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

          {/* Health Timeline */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="lg:col-span-2">
          <Card className="p-5">
            <h3 className="mb-4 text-sm font-semibold text-stone-700">Health Timeline</h3>
            <div className="max-h-60 overflow-auto space-y-0 pr-1">
              {asArray(records).map((r, i) => (
                <div key={r._id} className="relative flex gap-4">
                  {/* Timeline line */}
                  {i < records.length - 1 && (
                    <div className="absolute left-[7px] top-5 bottom-0 w-px bg-stone-200" />
                  )}
                  <div className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-white ring-offset-1 shadow-sm">
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
        </div>

        {/* AI Chatbot */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="overflow-hidden">
            <div className="flex items-center gap-2 border-b border-stone-100 bg-stone-50/50 px-5 py-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <Activity size={13} />
              </div>
              <h3 className="text-sm font-semibold text-slate-700">AI Health Assistant</h3>
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
                      <div className="mr-2 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                        <Activity size={11} />
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${m.role === 'user'
                        ? 'rounded-br-sm bg-gradient-to-r from-emerald-500 to-green-500 text-white'
                        : 'rounded-bl-sm border border-emerald-100 bg-emerald-50/30 text-slate-700'
                      }`}>
                      {m.text}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {typing && (
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100">
                    <Activity size={11} className="text-emerald-600" />
                  </div>
                  <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-emerald-100 bg-emerald-50/30 px-3 py-2">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-emerald-400" style={{ animationDelay: `${i * 120}ms` }} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 border-t border-emerald-100 bg-emerald-50/20 p-3">
              <button
                onClick={startVoice}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition ${isListening ? 'border-rose-300 bg-rose-50 text-rose-500 animate-pulse' : 'border-emerald-200 bg-white text-slate-500 hover:border-emerald-300'
                  }`}
              >
                <Mic size={15} />
              </button>
              <input
                className="input-field text-xs"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                placeholder="Describe your symptoms, ask about medications..."
              />
              <button
                onClick={() => sendChat()}
                disabled={!prompt.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-soft transition hover:shadow-soft-lg disabled:opacity-40 active:scale-95"
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
