import { useState } from 'react';
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
    <div className="bg-white rounded-2xl border border-emerald-100 p-5 max-w-4xl">
      <h2 className="text-3xl font-bold mb-4">Patient Input Form</h2>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid md:grid-cols-3 gap-3">
          <input className="border rounded p-2" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className="border rounded p-2" placeholder="Age" type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} required />
          <select className="border rounded p-2" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}><option>Male</option><option>Female</option><option>Other</option></select>
          <input className="border rounded p-2" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
          <input className="border rounded p-2" placeholder="Area" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} />
          <input className="border rounded p-2" placeholder="Pincode" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
        </div>

        <div>
          <p className="font-semibold mb-2">Symptoms (with severity)</p>
          <div className="flex flex-wrap gap-2">
            {symptomList.map((s) => {
              const selected = symptoms.find((x) => x.name === s);
              return (
                <div key={s} className="flex items-center gap-2 border rounded-full px-3 py-1 bg-emerald-50">
                  <button type="button" className={`text-sm ${selected ? 'font-bold text-emerald-700' : ''}`} onClick={() => toggleSymptom(s)}>{s}</button>
                  {selected && (
                    <select className="text-xs border rounded" value={selected.severity} onChange={(e) => setSeverity(s, e.target.value)}>
                      <option>Low</option><option>High</option><option>Mild</option><option>Moderate</option><option>Severe</option>
                    </select>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <input className="border rounded p-2" placeholder="Body Temperature" value={form.bodyTemperature} onChange={(e) => setForm({ ...form, bodyTemperature: e.target.value })} />
          <input className="border rounded p-2" placeholder="SpO2" value={form.spo2} onChange={(e) => setForm({ ...form, spo2: e.target.value })} />
          <input className="border rounded p-2" placeholder="Heart Rate" value={form.heartRate} onChange={(e) => setForm({ ...form, heartRate: e.target.value })} />
          <input className="border rounded p-2" placeholder="Duration (days)" value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: e.target.value })} />
          <input className="border rounded p-2 md:col-span-2" placeholder="Medical report URL (optional)" value={form.medicalReportUrl} onChange={(e) => setForm({ ...form, medicalReportUrl: e.target.value })} />
        </div>

        <button className="bg-emerald-600 text-white px-4 py-2 rounded">Submit & Predict</button>
      </form>

      {error && <div className="mt-3 p-2 text-sm rounded bg-rose-50 border border-rose-200 text-rose-600">{error}</div>}
      {result && (
        <div className="mt-4 p-3 rounded border bg-emerald-50">
          <p>AI Risk: <b>{result.risk}</b> ({result.probability})</p>
          <p>{result.explanation}</p>
          {result.aiSignals && (
            <p className="text-sm mt-2">
              External: <b>{result.aiSignals.externalRisk}</b> · GDELT {result.aiSignals.gdeltCount} ·
              Humidity {result.aiSignals.meteoAvgHumidity}% · Boost {result.aiSignals.boost}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
