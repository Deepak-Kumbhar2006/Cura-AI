import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, Send } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const riskColor = { Low: 'text-emerald-600', Medium: 'text-amber-600', High: 'text-rose-600' };

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

export default function PatientDashboard() {
  const [records, setRecords] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);
  const [personalRisk, setPersonalRisk] = useState(null);
  const [messages, setMessages] = useState([{ role: 'bot', text: 'Hi, I am your AI Health Assistant. Describe your symptoms.' }]);
  const [prompt, setPrompt] = useState('');
  const [typing, setTyping] = useState(false);
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
      .catch(() => toast.error('Unable to load patient dashboard'));
  }, []);

  const latest = records[0];

  const sendChat = async (text = prompt) => {
    if (!text.trim()) return;
    setMessages((m) => [...m, { role: 'user', text }]);
    setPrompt('');
    setTyping(true);
    try {
      const { data } = await api.post('/api/chat', { message: text });
      setMessages((m) => [...m, { role: 'bot', text: data.reply }]);
    } catch {
      setMessages((m) => [...m, { role: 'bot', text: 'Chatbot is temporarily unavailable. Please try again.' }]);
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
    rec.onresult = (e) => setPrompt(e.results[0][0].transcript);
    rec.start();
  };

  return (
    <div className="space-y-4 fade-in">
      <div className="grid lg:grid-cols-3 gap-3">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-5 lg:col-span-2">
          <p className="text-slate-500">Health Summary</p>
          <p className="text-xl font-semibold mt-1">{latest?.personalDetails?.name || 'Patient'} · Age {latest?.personalDetails?.age || '-'}</p>
          <div className="grid md:grid-cols-3 gap-2 mt-3 text-sm">
            <div className="p-2 rounded bg-emerald-50">Temp: <b>{latest?.vitals?.bodyTemperature || '-'}</b></div>
            <div className="p-2 rounded bg-emerald-50">SpO2: <b>{latest?.vitals?.spo2 || '-'}%</b></div>
            <div className="p-2 rounded bg-emerald-50">HR: <b>{latest?.vitals?.heartRate || '-'}</b></div>
          </div>
          <p className={`text-3xl font-bold mt-3 ${riskColor[latest?.risk] || ''}`}>Risk Score: {latest?.risk || 'No data'}</p>
          <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs ${latest?.risk === 'High' ? 'bg-rose-100 text-rose-600' : latest?.risk === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{latest?.risk === 'High' ? 'Critical' : latest?.risk === 'Medium' ? 'Risk' : 'Healthy'}</span>
          {personalRisk && <p className="mt-2 text-sm text-indigo-700">Your personal risk: <b>{personalRisk.riskLevel}</b> ({personalRisk.category || 'General'}) · Score {personalRisk.score}</p>}
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
            ))}
            {!records.length && <p className="text-sm text-slate-500">No timeline entries yet.</p>}
          </div>
        </div>

        <div className="card p-4 text-sm">
          <h3 className="font-semibold mb-2">Recommendations Engine</h3>
          {(asArray(stats?.recommendations).length ? asArray(stats.recommendations) : ['Drink water', 'Visit doctor', 'Avoid crowded places']).map((tip, idx) => <p key={`${tip}-${idx}`} className="p-2 rounded bg-emerald-50 mb-2">• {String(tip)}</p>)}
          <div className="mt-3 p-2 rounded bg-indigo-50 text-indigo-700">Health Score: <b>{latest?.risk === 'Low' ? '88' : latest?.risk === 'Medium' ? '63' : '41'}</b>/100</div>
        </div>
      </div>

      <div className="card p-4">
        <h3 className="font-semibold mb-2">AI Health Assistant</h3>
        <div ref={chatRef} className="h-60 overflow-auto border rounded-xl p-3 bg-slate-50 space-y-2">
          {messages.map((m, i) => <div key={i} className={`max-w-[90%] p-2 rounded ${m.role === 'bot' ? 'bg-white border' : 'bg-emerald-100 ml-auto'}`}>{m.text}</div>)}
          {typing && <div className="text-xs text-slate-500">Assistant is typing...</div>}
        </div>
        <div className="mt-3 flex gap-2">
          <button onClick={startVoice} className="px-3 rounded-lg border border-emerald-200"><Mic size={16} /></button>
          <input className="flex-1 border rounded-lg px-3 py-2" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe your symptoms..." />
          <button onClick={() => sendChat()} className="px-3 py-2 rounded-lg bg-emerald-600 text-white"><Send size={16} /></button>
        </div>
      </div>
    </div>
  );
}
