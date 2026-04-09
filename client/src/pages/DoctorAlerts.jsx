import { useEffect, useState } from 'react';
import api from '../services/api';

export default function DoctorAlerts() {
  const [alerts, setAlerts] = useState([]);
  useEffect(() => {
    api.get('/api/alerts').then((r) => {
      const payload = Array.isArray(r.data) ? r.data : r.data?.alerts || [];
      setAlerts(payload);
    });
  }, []);

  return (
    <div className="space-y-3">
      <h2 className="text-3xl font-bold">Alerts</h2>
      {alerts.map((a, idx) => (
        <div key={`${a.region || a.location}-${idx}`} className="rounded-xl border p-4 bg-white">
          <p className="font-semibold">{a.region || a.location || 'Unknown region'} · {a.severity || a.risk || 'medium'}</p>
          <p>{a.message || `${a.disease || 'Outbreak signal'} reported by ${a.source || 'surveillance network'}.`}</p>
        </div>
      ))}
    </div>
  );
}
