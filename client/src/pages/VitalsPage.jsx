import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Thermometer, Heart, Wind, Plus, Clock } from 'lucide-react';

export default function VitalsPage() {
  const [logs, setLogs] = useState([{ temp: '98.6', spo2: '98', hr: '75', time: '10:11 AM' }]);
  const [form, setForm] = useState({ temp: '', spo2: '', hr: '' });

  const add = (e) => {
    e.preventDefault();
    if (!form.temp && !form.spo2 && !form.hr) return;
    setLogs([{ ...form, time: new Date().toLocaleTimeString() }, ...logs]);
    setForm({ temp: '', spo2: '', hr: '' });
  };

  return (
    <div className="max-w-3xl animate-fade-up">
      <div className="mb-6">
        <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-white">Vital Signs Log</h2>
        <p className="text-sm text-slate-500 mt-1">Track your body temperature, oxygen saturation, and heart rate</p>
      </div>

      <form onSubmit={add} className="card p-5 mb-5">
        <h3 className="font-display font-semibold text-slate-800 dark:text-white mb-4">Record New Vitals</h3>
        <div className="grid md:grid-cols-4 gap-3">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
              <Thermometer size={12} />Temperature
            </label>
            <input className="input-field" placeholder="98.6 °F" value={form.temp} onChange={(e) => setForm({ ...form, temp: e.target.value })} />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
              <Wind size={12} />SpO2
            </label>
            <input className="input-field" placeholder="98 %" value={form.spo2} onChange={(e) => setForm({ ...form, spo2: e.target.value })} />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
              <Heart size={12} />Heart Rate
            </label>
            <input className="input-field" placeholder="72 bpm" value={form.hr} onChange={(e) => setForm({ ...form, hr: e.target.value })} />
          </div>
          <div className="flex items-end">
            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
              <Plus size={16} />Log Vitals
            </button>
          </div>
        </div>
      </form>

      <div className="card p-5">
        <h3 className="font-display font-semibold text-slate-800 dark:text-white mb-4">History</h3>
        <div className="space-y-2">
          <AnimatePresence>
            {logs.map((l, i) => (
              <motion.div key={`${l.time}-${i}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="flex items-center justify-between p-4 rounded-2xl bg-surface-100 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700 hover:shadow-sm transition">
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Thermometer size={14} className="text-orange-500" />
                    <span className="font-medium text-slate-800 dark:text-slate-200">{l.temp || '-'}</span>
                    <span className="text-xs text-slate-400">°F</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wind size={14} className="text-blue-500" />
                    <span className="font-medium text-slate-800 dark:text-slate-200">{l.spo2 || '-'}</span>
                    <span className="text-xs text-slate-400">%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart size={14} className="text-pink-500" />
                    <span className="font-medium text-slate-800 dark:text-slate-200">{l.hr || '-'}</span>
                    <span className="text-xs text-slate-400">bpm</span>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Clock size={12} />{l.time}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
          {!logs.length && (
            <div className="text-center py-8">
              <Heart size={32} className="mx-auto mb-2 text-slate-300" />
              <p className="text-sm text-slate-400">No vitals recorded yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
