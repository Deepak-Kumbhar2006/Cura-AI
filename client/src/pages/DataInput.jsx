import { useState } from 'react';
import api from '../services/api';

const symptomOptions = ['fever', 'cough', 'headache', 'fatigue', 'breathlessness'];

export default function DataInput() {
  const [form, setForm] = useState({
    symptoms: [],
    city: '',
    region: '',
    lat: '',
    lng: '',
    temperature: '',
    humidity: '',
  });
  const [result, setResult] = useState(null);

  const toggleSymptom = (symptom) => {
    setForm((prev) => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter((s) => s !== symptom)
        : [...prev.symptoms, symptom],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      symptoms: form.symptoms,
      location: {
        city: form.city,
        region: form.region,
        lat: Number(form.lat),
        lng: Number(form.lng),
      },
      environmental: {
        temperature: Number(form.temperature),
        humidity: Number(form.humidity),
      },
    };

    const { data } = await api.post('/api/data/add', payload);
    setResult(data.prediction);
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 max-w-3xl">
      <h2 className="text-2xl font-bold mb-4">Disease Data Input</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p className="font-medium mb-1">Symptoms</p>
          <div className="flex flex-wrap gap-2">
            {symptomOptions.map((symptom) => (
              <button type="button" key={symptom} onClick={() => toggleSymptom(symptom)} className={`px-3 py-1 rounded-full border ${form.symptoms.includes(symptom) ? 'bg-cyan-600 text-white' : ''}`}>
                {symptom}
              </button>
            ))}
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <input className="border p-2 rounded" placeholder="City" onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <input className="border p-2 rounded" placeholder="Region" onChange={(e) => setForm({ ...form, region: e.target.value })} />
          <input className="border p-2 rounded" placeholder="Latitude" onChange={(e) => setForm({ ...form, lat: e.target.value })} />
          <input className="border p-2 rounded" placeholder="Longitude" onChange={(e) => setForm({ ...form, lng: e.target.value })} />
          <input className="border p-2 rounded" placeholder="Temperature °C" onChange={(e) => setForm({ ...form, temperature: e.target.value })} />
          <input className="border p-2 rounded" placeholder="Humidity %" onChange={(e) => setForm({ ...form, humidity: e.target.value })} />
        </div>
        <button className="bg-cyan-600 text-white px-4 py-2 rounded">Submit and Predict</button>
      </form>
      {result && (
        <div className={`mt-4 p-4 rounded ${result.risk === 'High' ? 'bg-red-100' : result.risk === 'Medium' ? 'bg-yellow-100' : 'bg-green-100'}`}>
          <p>Risk: <strong>{result.risk}</strong></p>
          <p>Probability: <strong>{result.probability}</strong></p>
        </div>
      )}
    </div>
  );
}
