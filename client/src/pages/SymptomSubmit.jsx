import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Zap, MapPin, Thermometer, Heart, Wind, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react';
import api from '../services/api';

const symptomList = ['Fever', 'Cough', 'Fatigue', 'Headache', 'Breathing Issues', 'Body Pain', 'Nausea', 'Sore Throat', 'Diarrhea', 'Loss of Taste'];
const severityLevels = ['Low', 'Mild', 'Moderate', 'High', 'Severe'];
const severityColor = { Low: 'bg-primary-100 text-primary-700', Mild: 'bg-blue-100 text-blue-700', Moderate: 'bg-warning-100 text-warning-700', High: 'bg-orange-100 text-orange-700', Severe: 'bg-danger-100 text-danger-700' };

export default function SymptomSubmit() {
  const [form, setForm] = useState({
    name: '', age: '', gender: 'Male', city: '', area: '', pincode: '',
    bodyTemperature: '', spo2: '', heartRate: '', durationDays: '', medicalReportUrl: '', region: '',
  });
  const [symptoms, setSymptoms] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleSymptom = (name) => {
    setSymptoms((prev) => {
      const exists = prev.find((s) => s.name === name);
      if (exists) return prev.filter((s) => s.name !== name);
      return [...prev, { name, severity: 'Moderate' }];
    });
  };

  const setSeverity = (name, severity) => {
    setSymptoms((prev) => prev.map((s) => (s.name === name ? { ...s, severity } : s)));
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!symptoms.length) {
      setError('Please select at least one symptom');
      return;
    }
    setLoading(true);
    setError('');
    const payload = {
      personalDetails: { name: form.name, age: Number(form.age), gender: form.gender, city: form.city, area: form.area, pincode: form.pincode },
      location: { city: form.city, area: form.area, pincode: form.pincode, region: form.region || form.city },
      symptoms,
      vitals: { bodyTemperature: Number(form.bodyTemperature), spo2: Number(form.spo2), heartRate: Number(form.heartRate) },
      durationDays: Number(form.durationDays || 0),
      medicalReportUrl: form.medicalReportUrl,
    };
    try {
      const { data } = await api.post('/api/data/add', payload);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit record');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, icon: Icon, children }) => (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
        {Icon && <Icon size={12} />}{label}
      </label>
      {children}
    </div>
  );

  return (
    <div className="max-w-4xl animate-fade-up">
      <div className="mb-6">
        <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-white">Symptom Logger</h2>
        <p className="text-sm text-slate-500 mt-1">Record your symptoms and vitals for AI-powered risk assessment</p>
      </div>

      <form onSubmit={submit} className="space-y-6">
        {/* Personal Details */}
        <div className="card p-6">
          <h3 className="font-display font-semibold text-slate-800 dark:text-white mb-4">Personal Details</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Field label="Full Name"><input className="input-field" placeholder="John Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
            <Field label="Age"><input className="input-field" placeholder="25" type="number" min="0" max="120" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} required /></Field>
            <Field label="Gender">
              <select className="input-field" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                <option>Male</option><option>Female</option><option>Other</option>
              </select>
            </Field>
            <Field label="City" icon={MapPin}><input className="input-field" placeholder="Pune" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required /></Field>
            <Field label="Area"><input className="input-field" placeholder="Kothrud" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} /></Field>
            <Field label="Pincode"><input className="input-field" placeholder="411038" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} /></Field>
          </div>
        </div>

        {/* Symptoms - Tags UI */}
        <div className="card p-6">
          <h3 className="font-display font-semibold text-slate-800 dark:text-white mb-2">Symptoms</h3>
          <p className="text-xs text-slate-500 mb-4">Select all that apply, then adjust severity</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {symptomList.map((s) => {
              const selected = symptoms.find((x) => x.name === s);
              return (
                <motion.button key={s} type="button" whileTap={{ scale: 0.95 }}
                  onClick={() => toggleSymptom(s)}
                  className={`tag ${selected ? 'tag-active' : 'tag-inactive'}`}>
                  {s}
                  {selected && <X size={12} className="ml-1 opacity-70" />}
                </motion.button>
              );
            })}
          </div>

          {/* Severity controls for selected symptoms */}
          <AnimatePresence>
            {symptoms.length > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                {symptoms.map((s) => (
                  <div key={s.name} className="flex items-center gap-4">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 w-36">{s.name}</p>
                    <div className="flex gap-1.5 flex-1">
                      {severityLevels.map((level) => (
                        <button key={level} type="button" onClick={() => setSeverity(s.name, level)}
                          className={`text-xs px-3 py-1.5 rounded-full transition-all ${s.severity === level ? severityColor[level] + ' font-semibold shadow-sm' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-slate-200'}`}>
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Vitals */}
        <div className="card p-6">
          <h3 className="font-display font-semibold text-slate-800 dark:text-white mb-4">Vitals & Duration</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Field label="Body Temperature" icon={Thermometer}><input className="input-field" placeholder="98.6" type="number" min="90" max="110" step="0.1" value={form.bodyTemperature} onChange={(e) => setForm({ ...form, bodyTemperature: e.target.value })} /></Field>
            <Field label="SpO2 Level" icon={Wind}><input className="input-field" placeholder="98" type="number" min="50" max="100" value={form.spo2} onChange={(e) => setForm({ ...form, spo2: e.target.value })} /></Field>
            <Field label="Heart Rate" icon={Heart}><input className="input-field" placeholder="72" type="number" min="30" max="220" value={form.heartRate} onChange={(e) => setForm({ ...form, heartRate: e.target.value })} /></Field>
            <Field label="Duration (days)" icon={Calendar}><input className="input-field" placeholder="3" type="number" min="0" max="365" value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: e.target.value })} /></Field>
            <div className="md:col-span-2">
              <Field label="Medical Report URL (optional)"><input className="input-field" placeholder="https://..." value={form.medicalReportUrl} onChange={(e) => setForm({ ...form, medicalReportUrl: e.target.value })} /></Field>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button type="submit" disabled={loading}
          className="btn-primary flex items-center justify-center gap-2 py-3 px-8 text-base disabled:opacity-50">
          {loading ? <Loader2 size={18} className="animate-spin" /> : <><Zap size={18} /><span>Submit & Predict Risk</span></>}
        </button>
      </form>

      {/* Result */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mt-5 p-4 rounded-2xl bg-danger-50 border border-danger-200 flex items-start gap-3">
            <AlertTriangle size={18} className="text-danger-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-danger-600">{error}</p>
          </motion.div>
        )}
        {result && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="mt-5 p-5 rounded-2xl bg-primary-50 border border-primary-200">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle2 size={20} className="text-primary-600" />
              <h4 className="font-display font-semibold text-primary-800">AI Risk Assessment</h4>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-3 rounded-xl bg-white">
                <p className="text-xs text-slate-500 uppercase">Risk Level</p>
                <p className="text-xl font-bold text-slate-800 mt-1">{result.risk}</p>
              </div>
              <div className="p-3 rounded-xl bg-white">
                <p className="text-xs text-slate-500 uppercase">Probability</p>
                <p className="text-xl font-bold text-slate-800 mt-1">{result.probability || 'N/A'}</p>
              </div>
              <div className="p-3 rounded-xl bg-white">
                <p className="text-xs text-slate-500 uppercase">Explanation</p>
                <p className="text-sm text-slate-700 mt-1">{result.explanation || 'Assessment complete'}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
