import { useEffect, useState } from 'react';
import api from '../services/api';

const riskColor = { Low: 'text-emerald-600', Medium: 'text-amber-600', High: 'text-rose-600' };

export default function PatientDashboard() {
  const [records, setRecords] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    Promise.all([api.get('/api/data/all'), api.get('/api/dashboard/stats'), api.get('/api/alerts').catch(() => ({ data: [] }))]).then(([r, s, a]) => {
      setRecords(r.data);
      setStats(s.data);
      setAlerts(a.data);
    });
  }, []);

  const latest = records[0];

  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold">Patient Dashboard</h2>
      <div className="grid lg:grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-emerald-100 p-5">
          <p className="text-slate-500">Personal Health Summary</p>
          <p className="mt-2">Name: <b>{latest?.personalDetails?.name || '-'}</b> | Age: {latest?.personalDetails?.age || '-'}</p>
          <p>Latest vitals: Temp {latest?.vitals?.bodyTemperature || '-'}°C, SpO2 {latest?.vitals?.spo2 || '-'}%, HR {latest?.vitals?.heartRate || '-'}</p>
          <p className={`text-3xl font-bold mt-2 ${riskColor[latest?.risk] || ''}`}>Risk: {latest?.risk || 'No data'}</p>
          <p className="text-sm mt-1">Probability: {latest?.probability ?? '-'}</p>
        </div>
        <div className="bg-white rounded-2xl border border-emerald-100 p-5">
          <p className="text-slate-500 mb-2">Recommendations</p>
          {(stats?.recommendations || ['Consult doctor', 'Stay hydrated', 'Track symptoms daily']).map((tip) => (
            <p key={tip} className="text-sm bg-emerald-50 rounded p-2 mb-2">• {tip}</p>
          ))}
          <p className="mt-3 text-sm text-rose-600">Nearby alerts: {alerts[0]?.message || 'No critical nearby alert currently.'}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-emerald-100 p-5">
        <h3 className="font-semibold mb-2">Symptoms History Timeline</h3>
        <div className="space-y-2 max-h-64 overflow-auto">
          {records.map((r) => (
            <div key={r._id} className="border-l-4 border-emerald-300 pl-3 py-1">
              <p className="text-sm font-semibold">{new Date(r.createdAt).toLocaleString()} — {r.risk}</p>
              <p className="text-sm">Symptoms: {r.symptoms.map((s) => `${s.name} (${s.severity})`).join(', ')}</p>
            </div>
          ))}
          {!records.length && <p className="text-sm text-slate-500">No history yet.</p>}
        </div>
      </div>
    </div>
  );
}
