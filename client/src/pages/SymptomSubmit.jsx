import { useState } from 'react';
import api from '../services/api';

const options = ['fever', 'cough', 'headache', 'fatigue'];

export default function SymptomSubmit() {
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [symptoms, setSymptoms] = useState([]);
  const [result, setResult] = useState(null);

  const toggle = (s) => setSymptoms((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);

  const submit = async (e) => {
    e.preventDefault();
    const { data } = await api.post('/api/data/add', { symptoms, location: { city, region } });
    setResult(data);
  };

  return (
    <div className="bg-white rounded-2xl border p-5 max-w-2xl">
      <h2 className="text-3xl font-bold mb-4">Submit Symptoms</h2>
      <form onSubmit={submit} className="space-y-3">
        <div className="flex flex-wrap gap-2">{options.map((s) => <button key={s} type="button" onClick={() => toggle(s)} className={`px-3 py-1 rounded-full border ${symptoms.includes(s) ? 'bg-emerald-600 text-white' : ''}`}>{s}</button>)}</div>
        <input className="w-full border rounded p-2" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} required />
        <input className="w-full border rounded p-2" placeholder="Region" value={region} onChange={(e) => setRegion(e.target.value)} />
        <button className="bg-emerald-600 text-white px-4 py-2 rounded">Predict Risk</button>
      </form>
      {result && <div className="mt-4 p-3 rounded bg-slate-50 border"><p>Risk: <b>{result.risk}</b> ({result.probability})</p><p>{result.explanation}</p></div>}
    </div>
  );
}
