import { useState } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, Thermometer, Heart, Wind, Send } from 'lucide-react';
import api from '../services/api';

const symptomList = ['Fever', 'Cough', 'Fatigue', 'Headache', 'Breathing Issues', 'Body Pain'];

export default function SymptomSubmit() {
  const [form, setForm] = useState({
    name: '', age: '', gender: 'Male', city: '', area: '', pincode: '',
    bodyTemperature: '', spo2: '', heartRate: '', durationDays: '', medicalReportUrl: '', region: '',
  });
  const [symptoms, setSymptoms] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const toggleSymptom = (name) => {
    setSymptoms((prev) => {
      const exists = prev.find((s) => s.name === name);
      if (exists) return prev.filter((s) => s.name !== name);
      return [...prev, { name, severity: name === 'Fever' ? 'Low' : 'Moderate' }];
    });
  };

  const setSeverity = (name, severity) => {
    setSymptoms((prev) => prev.map((s) => (s.name === name ? { ...s, severity } : s)));
  };

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      personalDetails: {
        name: form.name,
        age: Number(form.age),
        gender: form.gender,
        city: form.city,
        area: form.area,
        pincode: form.pincode,
      },
      location: { city: form.city, area: form.area, pincode: form.pincode, region: form.region || form.city },
      symptoms,
      vitals: {
        bodyTemperature: Number(form.bodyTemperature),
        spo2: Number(form.spo2),
        heartRate: Number(form.heartRate),
      },
      durationDays: Number(form.durationDays || 0),
      medicalReportUrl: form.medicalReportUrl,
    };

    try {
      const { data } = await api.post('/api/data/add', payload);
      setResult(data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit record');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card p-6 max-w-4xl">
      <div className="flex items-center gap-2 mb-5">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-400 grid place-items-center">
          <PlusCircle size={20} className="text-white" />
        </div>
        <div>
          <h2 className="section-title">Symptom Logger</h2>
          <p className="text-sm text-slate-500">Record your symptoms and vitals for AI analysis</p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-5">
        {/* Personal Details */}
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-2">Personal Details</p>
          <div className="grid md:grid-cols-3 gap-3">
            <input className="input-field" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <input className="input-field" placeholder="Age" type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} required />
            <select className="input-field" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}><option>Male</option><option>Female</option><option>Other</option></select>
            <input className="input-field" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
            <input className="input-field" placeholder="Area" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
            <input className="input-field" placeholder="Pincode" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
          </div>
        </div>

        {/* Symptoms */}
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-2">Symptoms</p>
          <div className="flex flex-wrap gap-2">
            {symptomList.map((s) => {
              const selected = symptoms.find((x) => x.name === s);
              return (
                <div key={s} className={`flex items-center gap-2 rounded-xl border-2 px-3.5 py-2 transition-all duration-200 ${selected ? 'border-emerald-400 bg-emerald-50 shadow-soft' : 'border-emerald-100 bg-white hover:border-emerald-200'}`}>
                  <button type="button" className={`text-sm ${selected ? 'font-semibold text-emerald-700' : 'text-slate-600'}`} onClick={() => toggleSymptom(s)}>{s}</button>
                  {selected && (
                    <select className="text-xs input-field py-1 px-2" value={selected.severity} onChange={(e) => setSeverity(s, e.target.value)}>
                      <option>Low</option><option>High</option><option>Mild</option><option>Moderate</option><option>Severe</option>
                    </select>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Vitals */}
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-2">Vitals</p>
          <div className="grid md:grid-cols-3 gap-3">
            <div className="relative">
              <Thermometer size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400" />
              <input className="input-field pl-9" placeholder="Body Temperature" value={form.bodyTemperature} onChange={(e) => setForm({ ...form, bodyTemperature: e.target.value })} />
            </div>
            <div className="relative">
              <Wind size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400" />
              <input className="input-field pl-9" placeholder="SpO2" value={form.spo2} onChange={(e) => setForm({ ...form, spo2: e.target.value })} />
            </div>
            <div className="relative">
              <Heart size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400" />
              <input className="input-field pl-9" placeholder="Heart Rate" value={form.heartRate} onChange={(e) => setForm({ ...form, heartRate: e.target.value })} />
            </div>
            <input className="input-field" placeholder="Duration (days)" value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: e.target.value })} />
            <input className="input-field md:col-span-2" placeholder="Medical report URL (optional)" value={form.medicalReportUrl} onChange={(e) => setForm({ ...form, medicalReportUrl: e.target.value })} />
          </div>
        </div>

        <button className="btn-primary"><Send size={16} /> Submit & Predict</button>
      </form>

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 p-3 text-sm rounded-xl bg-rose-50 border border-rose-200 text-rose-600">
          {error}
        </motion.div>
      )}
      {result && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-4 rounded-xl border border-emerald-200 bg-emerald-50">
          <p className="font-semibold text-emerald-800">AI Risk: {result.risk} ({result.probability})</p>
          <p className="text-sm text-emerald-700 mt-1">{result.explanation}</p>
        </motion.div>
      )}
    </motion.div>
  );
}
