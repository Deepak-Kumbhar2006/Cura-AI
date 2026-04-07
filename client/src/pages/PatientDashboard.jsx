import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Send, Thermometer, Heart, Wind, AlertTriangle, Trophy, Star, Clock, Bot, User, Sparkles, Shield, TrendingUp } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const riskConfig = {
  High: { color: 'text-danger-600', bg: 'bg-danger-50', border: 'border-danger-200', badge: 'badge-danger', label: 'Critical', score: 41 },
  Medium: { color: 'text-warning-600', bg: 'bg-warning-50', border: 'border-warning-200', badge: 'badge-warning', label: 'At Risk', score: 63 },
  Low: { color: 'text-primary-600', bg: 'bg-primary-50', border: 'border-primary-200', badge: 'badge-success', label: 'Healthy', score: 88 },
};

export default function PatientDashboard() {
  const [records, setRecords] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [messages, setMessages] = useState([{ role: 'bot', text: 'Hi! I\'m your AI Health Assistant. Tell me about your symptoms and I\'ll provide guidance.' }]);
  const [prompt, setPrompt] = useState('');
  const [typing, setTyping] = useState(false);
  const [listening, setListening] = useState(false);
  const chatRef = useRef(null);

  useEffect(() => {
    Promise.all([api.get('/api/data/me'), api.get('/api/dashboard/stats'), api.get('/api/alerts').catch(() => ({ data: [] }))])
      .then(([r, s, a]) => { setRecords(r.data); setStats(s.data); setAlerts(a.data); })
      .catch(() => toast.error('Unable to load patient dashboard'));
  }, []);

  const latest = records[0];
  const risk = riskConfig[latest?.risk] || riskConfig.Low;
  const healthScore = risk.score;

  const sendChat = async (text = prompt) => {
    if (!text.trim()) return;
    setMessages((m) => [...m, { role: 'user', text }]);
    setPrompt('');
    setTyping(true);
    try {
      const { data } = await api.post('/api/chat', { message: text });
      setMessages((m) => [...m, { role: 'bot', text: data.reply }]);
    } catch {
      setMessages((m) => [...m, { role: 'bot', text: 'I\'m temporarily unavailable. Please try again in a moment.' }]);
    } finally {
      setTyping(false);
      setTimeout(() => chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' }), 50);
    }
  };

  const startVoice = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return toast.error('Voice input not supported in this browser');
    const rec = new Recognition();
    rec.lang = 'en-US';
    setListening(true);
    rec.onresult = (e) => { setPrompt(e.results[0][0].transcript); setListening(false); };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
  };

  const vitals = [
    { label: 'Temperature', value: latest?.vitals?.bodyTemperature || '-', unit: '°C', icon: Thermometer, color: 'from-orange-400 to-red-400' },
    { label: 'SpO2', value: latest?.vitals?.spo2 || '-', unit: '%', icon: Wind, color: 'from-blue-400 to-cyan-400' },
    { label: 'Heart Rate', value: latest?.vitals?.heartRate || '-', unit: 'bpm', icon: Heart, color: 'from-pink-400 to-rose-400' },
  ];

  const quickPrompts = ['Check my symptoms', 'What should I eat?', 'Am I at risk?', 'Health tips for today'];

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Health Summary + Vitals */}
      <div className="grid lg:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="card p-6 lg:col-span-2">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Health Summary</p>
              <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-white mt-1">
                {latest?.personalDetails?.name || 'Patient'}
              </h2>
              <p className="text-sm text-slate-500">Age {latest?.personalDetails?.age || '-'} · {latest?.personalDetails?.gender || '-'}</p>
            </div>
            <span className={`badge ${risk.badge} text-sm px-4 py-1.5`}>{risk.label}</span>
          </div>

          {/* Vitals Cards */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {vitals.map((v, i) => (
              <motion.div key={v.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
                className="relative overflow-hidden rounded-2xl bg-white dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 p-4">
                <div className={`absolute top-0 right-0 h-16 w-16 rounded-full bg-gradient-to-br ${v.color} opacity-10 -translate-y-4 translate-x-4`} />
                <v.icon size={16} className="text-slate-400 mb-2" />
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{v.value}<span className="text-sm font-normal text-slate-400 ml-1">{v.unit}</span></p>
                <p className="text-xs text-slate-500 mt-0.5">{v.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Risk Score */}
          <div className={`rounded-2xl p-4 ${risk.bg} border ${risk.border}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Overall Risk Score</p>
                <p className={`text-4xl font-bold mt-1 ${risk.color}`}>{latest?.risk || 'N/A'}</p>
              </div>
              <div className="text-right">
                <Shield size={32} className={risk.color + ' opacity-50'} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Nearby Alerts + Health Score Gamification */}
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={16} className="text-danger-500" />
              <h3 className="font-display font-semibold text-slate-800 dark:text-white text-sm">Nearby Risk Alerts</h3>
            </div>
            <div className="space-y-2">
              {alerts.slice(0, 3).map((a) => (
                <div key={a._id} className="p-3 rounded-2xl bg-danger-50 dark:bg-danger-500/10 border border-danger-100 dark:border-danger-800/30 text-sm">
                  <p className="text-slate-700 dark:text-slate-300">{a.message}</p>
                  <p className="text-xs text-slate-400 mt-1">{a.location}</p>
                </div>
              ))}
              {!alerts.length && (
                <div className="p-4 rounded-2xl bg-primary-50 border border-primary-100 text-center">
                  <Shield size={24} className="text-primary-500 mx-auto mb-2" />
                  <p className="text-sm text-primary-700 font-medium">No critical alerts nearby</p>
                  <p className="text-xs text-primary-500">Your area is currently safe</p>
                </div>
              )}
            </div>
          </div>

          {/* Health Score Gamification */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <Trophy size={16} className="text-warning-500" />
              <h3 className="font-display font-semibold text-slate-800 dark:text-white text-sm">Health Score</h3>
            </div>
            <div className="text-center">
              <div className="relative inline-flex items-center justify-center">
                <svg className="w-24 h-24 -rotate-90">
                  <circle cx="48" cy="48" r="40" fill="none" strokeWidth="8" className="stroke-slate-200 dark:stroke-slate-600" />
                  <circle cx="48" cy="48" r="40" fill="none" strokeWidth="8" strokeLinecap="round"
                    className={healthScore > 70 ? 'stroke-primary-500' : healthScore > 40 ? 'stroke-warning-500' : 'stroke-danger-500'}
                    strokeDasharray={`${(healthScore / 100) * 251.2} 251.2`} />
                </svg>
                <span className="absolute text-2xl font-bold text-slate-800 dark:text-white">{healthScore}</span>
              </div>
              <div className="flex items-center justify-center gap-1 mt-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} className={i < Math.ceil(healthScore / 20) ? 'text-warning-400 fill-warning-400' : 'text-slate-300'} />
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-1">{healthScore > 70 ? 'Great health!' : healthScore > 40 ? 'Room to improve' : 'Needs attention'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Health Timeline + Recommendations */}
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-primary-600" />
            <h3 className="font-display font-semibold text-slate-800 dark:text-white">Health Timeline</h3>
          </div>
          <div className="max-h-72 overflow-auto space-y-3 pr-2">
            {records.map((r, i) => {
              const rCfg = riskConfig[r.risk] || riskConfig.Low;
              return (
                <motion.div key={r._id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`h-3 w-3 rounded-full ${r.risk === 'High' ? 'bg-danger-500' : r.risk === 'Medium' ? 'bg-warning-500' : 'bg-primary-500'} ring-4 ${r.risk === 'High' ? 'ring-danger-100' : r.risk === 'Medium' ? 'ring-warning-100' : 'ring-primary-100'}`} />
                    {i < records.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 dark:bg-slate-600 mt-1" />}
                  </div>
                  <div className="pb-4 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      <span className={`badge ${rCfg.badge} text-[10px]`}>{r.risk}</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                      {(r.symptoms || []).map((s) => s.name).join(', ') || 'No symptoms recorded'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {r.diagnosis?.status ? `Doctor: ${r.diagnosis.status}` : 'Awaiting doctor review'}
                    </p>
                  </div>
                </motion.div>
              );
            })}
            {!records.length && (
              <div className="text-center py-8">
                <Clock size={32} className="mx-auto mb-2 text-slate-300" />
                <p className="text-sm text-slate-400">No timeline entries yet</p>
                <p className="text-xs text-slate-400">Submit symptoms to start tracking</p>
              </div>
            )}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={16} className="text-primary-600" />
            <h3 className="font-display font-semibold text-slate-800 dark:text-white text-sm">AI Recommendations</h3>
          </div>
          <div className="space-y-2">
            {(stats?.recommendations || ['Stay hydrated — drink 8+ glasses of water', 'Schedule a follow-up visit with your doctor', 'Avoid crowded places during peak hours', 'Get 7-8 hours of quality sleep']).map((tip, i) => (
              <motion.div key={tip} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }}
                className="flex items-start gap-3 p-3 rounded-2xl bg-primary-50/50 dark:bg-primary-900/20 border border-primary-100/50">
                <TrendingUp size={14} className="text-primary-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-slate-700 dark:text-slate-300">{tip}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Health Chatbot - ChatGPT Style */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
          <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white grid place-items-center">
            <Bot size={18} />
          </div>
          <div>
            <h3 className="font-display font-semibold text-slate-800 dark:text-white text-sm">AI Health Assistant</h3>
            <p className="text-xs text-primary-600">Powered by Cura AI</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary-500 animate-pulse" />
            <span className="text-xs text-slate-500">Online</span>
          </div>
        </div>

        {/* Quick Prompts */}
        <div className="px-5 py-3 border-b border-slate-50 dark:border-slate-700/50 flex gap-2 overflow-x-auto">
          {quickPrompts.map((qp) => (
            <button key={qp} onClick={() => sendChat(qp)}
              className="tag tag-inactive whitespace-nowrap hover:bg-primary-100 hover:text-primary-700 transition">{qp}</button>
          ))}
        </div>

        {/* Chat Messages */}
        <div ref={chatRef} className="h-80 overflow-auto p-5 space-y-4 bg-surface-50 dark:bg-slate-800/50">
          {messages.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`h-8 w-8 rounded-xl grid place-items-center flex-shrink-0 ${
                m.role === 'bot'
                  ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
              }`}>
                {m.role === 'bot' ? <Bot size={14} /> : <User size={14} />}
              </div>
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                m.role === 'bot'
                  ? 'bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-tl-md'
                  : 'bg-primary-600 text-white rounded-tr-md'
              }`}>
                {m.text}
              </div>
            </motion.div>
          ))}
          {typing && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white grid place-items-center">
                <Bot size={14} />
              </div>
              <div className="bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 px-4 py-3 rounded-2xl rounded-tl-md">
                <div className="flex gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
          <form onSubmit={(e) => { e.preventDefault(); sendChat(); }} className="flex items-center gap-3">
            <button type="button" onClick={startVoice}
              className={`p-2.5 rounded-2xl transition-all ${listening ? 'bg-danger-100 text-danger-600 animate-pulse-soft' : 'hover:bg-primary-50 text-slate-400 hover:text-primary-600'}`}>
              <Mic size={18} />
            </button>
            <input className="flex-1 bg-surface-100 dark:bg-slate-700 rounded-2xl px-4 py-3 text-sm outline-none placeholder-slate-400 dark:text-slate-200 focus:ring-2 focus:ring-primary-200 transition"
              value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe your symptoms or ask a health question..." />
            <button type="submit" disabled={!prompt.trim()}
              className="p-2.5 rounded-2xl bg-primary-600 text-white hover:bg-primary-700 transition disabled:opacity-30 disabled:hover:bg-primary-600">
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
