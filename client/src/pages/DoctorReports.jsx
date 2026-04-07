import { useEffect, useState } from 'react';
import api from '../services/api';

export default function DoctorReports() {
  const [records, setRecords] = useState([]);
  const [region, setRegion] = useState('');

  const load = async () => {
    const { data } = await api.get('/api/data/all', { params: { region } });
    setRecords(data);
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="bg-white rounded-2xl border p-4 overflow-auto">
      <h2 className="text-3xl font-bold mb-3">Reports</h2>
      <div className="flex gap-2 mb-3"><input className="border rounded p-2" placeholder="Filter by region" value={region} onChange={(e) => setRegion(e.target.value)} /><button onClick={load} className="px-4 py-2 rounded bg-emerald-600 text-white">Apply</button></div>
      <table className="min-w-full text-sm"><thead><tr className="border-b"><th className="text-left py-2">Time</th><th>Location</th><th>Symptoms</th><th>Temp</th><th>Humidity</th><th>Risk</th></tr></thead><tbody>{records.map((r) => <tr key={r._id} className="border-b"><td className="py-2">{new Date(r.createdAt).toLocaleString()}</td><td>{r.location.city}, {r.location.region}</td><td>{r.symptoms.join(', ')}</td><td>{r.temperature}</td><td>{r.humidity}</td><td>{r.risk}</td></tr>)}</tbody></table>
    </div>
  );
}
