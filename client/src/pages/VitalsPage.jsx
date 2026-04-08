import { useState } from 'react';

export default function VitalsPage() {
  const [logs, setLogs] = useState([{ temp: '98.6', spo2: '98', hr: '75', time: '10:11 AM' }]);
  const [form, setForm] = useState({ temp: '', spo2: '', hr: '' });

  const add = (e) => {
    e.preventDefault();
    setLogs([{ ...form, time: new Date().toLocaleTimeString() }, ...logs]);
    setForm({ temp: '', spo2: '', hr: '' });
  };

  return (
    <div className="bg-white rounded-2xl border border-emerald-100 p-4">
      <h2 className="text-2xl font-bold mb-3">Vital Signs Log</h2>
      <form onSubmit={add} className="grid md:grid-cols-4 gap-2 mb-4">
        <input className="border rounded p-2" placeholder="Temp °F" value={form.temp} onChange={(e) => setForm({ ...form, temp: e.target.value })} />
        <input className="border rounded p-2" placeholder="SpO2 %" value={form.spo2} onChange={(e) => setForm({ ...form, spo2: e.target.value })} />
        <input className="border rounded p-2" placeholder="HR bpm" value={form.hr} onChange={(e) => setForm({ ...form, hr: e.target.value })} />
        <button className="bg-emerald-600 text-white rounded">Log New Vitals</button>
      </form>
      <div className="space-y-2">{logs.map((l, i) => <div key={i} className="p-2 rounded bg-emerald-50 text-sm">Temp {l.temp}°F · SpO2 {l.spo2}% · HR {l.hr} bpm · {l.time}</div>)}</div>
    </div>
  );
}
