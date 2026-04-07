import { useEffect, useState } from 'react';
import api from '../services/api';

export default function PatientDashboard() {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    api.get('/api/data/all').then((res) => setRecords(res.data));
  }, []);

  const latest = records[0];

  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold">Patient Dashboard</h2>
      <div className="bg-white rounded-2xl border p-5">
        <p className="text-slate-500">Latest risk</p>
        <p className="text-4xl font-bold mt-1">{latest?.risk || 'No data'}</p>
        <p className="mt-2">Probability: {latest?.probability ?? '-'}</p>
        <p className="mt-2 text-slate-600">{latest?.explanation || 'Submit symptoms to generate your risk profile.'}</p>
      </div>
    </div>
  );
}
