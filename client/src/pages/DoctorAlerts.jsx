import { useEffect, useState } from 'react';
import api from '../services/api';

export default function DoctorAlerts() {
  const [alerts, setAlerts] = useState([]);
  useEffect(() => { api.get('/api/alerts').then((r) => setAlerts(r.data)); }, []);

  return (
    <div className="space-y-3">
      <h2 className="text-3xl font-bold">Alerts</h2>
      {alerts.map((a) => <div key={a._id} className="rounded-xl border p-4 bg-white"><p className="font-semibold">{a.location} · {a.risk}</p><p>{a.message}</p></div>)}
    </div>
  );
}
