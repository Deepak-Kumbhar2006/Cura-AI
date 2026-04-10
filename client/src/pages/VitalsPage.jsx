import { useState } from 'react';
import { motion } from 'framer-motion';
import { HeartPulse, Thermometer, Wind, Activity, Plus } from 'lucide-react';

export default function VitalsPage() {
  const [logs, setLogs] = useState([{ temp: '98.6', spo2: '98', hr: '75', time: '10:11 AM' }]);
  const [form, setForm] = useState({ temp: '', spo2: '', hr: '' });

  const add = (e) => {
    e.preventDefault();
    setLogs([{ ...form, time: new Date().toLocaleTimeString() }, ...logs]);
    setForm({ temp: '', spo2: '', hr: '' });
  };

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-400 grid place-items-center">
            <HeartPulse size={20} className="text-white" />
          </div>
          <div>
            <h2 className="section-title">Vital Signs Log</h2>
            <p className="text-sm text-slate-500">Track your vitals over time</p>
          </div>
        </div>

        <form onSubmit={add} className="grid md:grid-cols-4 gap-3 mb-5">
          <div className="relative">
            <Thermometer size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400" />
            <input className="input-field pl-9" placeholder="Temp °F" value={form.temp} onChange={(e) => setForm({ ...form, temp: e.target.value })} />
          </div>
          <div className="relative">
            <Wind size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400" />
            <input className="input-field pl-9" placeholder="SpO2 %" value={form.spo2} onChange={(e) => setForm({ ...form, spo2: e.target.value })} />
          </div>
          <div className="relative">
            <Activity size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400" />
            <input className="input-field pl-9" placeholder="HR bpm" value={form.hr} onChange={(e) => setForm({ ...form, hr: e.target.value })} />
          </div>
          <button className="btn-primary"><Plus size={16} /> Log Vitals</button>
        </form>

        <div className="space-y-2">
          {logs.map((l, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-4 rounded-xl border border-emerald-100/60 bg-emerald-50/20 p-3 text-sm hover:bg-emerald-50/40 transition-colors"
            >
              <div className="flex items-center gap-1.5 text-rose-600">
                <Thermometer size={14} /> <span className="font-medium">{l.temp}°F</span>
              </div>
              <div className="flex items-center gap-1.5 text-blue-600">
                <Wind size={14} /> <span className="font-medium">{l.spo2}%</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600">
                <Activity size={14} /> <span className="font-medium">{l.hr} bpm</span>
              </div>
              <span className="ml-auto text-xs text-slate-400">{l.time}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
