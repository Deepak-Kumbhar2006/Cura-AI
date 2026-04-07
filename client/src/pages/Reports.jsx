import { useEffect, useState } from 'react';
import api from '../services/api';

export default function Reports() {
  const [records, setRecords] = useState([]);
  const [filters, setFilters] = useState({ region: '', startDate: '', endDate: '' });

  const fetchRecords = async () => {
    const { data } = await api.get('/api/data/all', { params: filters });
    setRecords(data);
  };

  useEffect(() => { fetchRecords(); }, []);

  return (
    <div className="bg-white rounded-xl shadow p-4 overflow-auto">
      <h2 className="text-2xl font-bold mb-4">Reports</h2>
      <div className="grid md:grid-cols-4 gap-2 mb-4">
        <input className="border p-2 rounded" placeholder="Region" onChange={(e) => setFilters({ ...filters, region: e.target.value })} />
        <input className="border p-2 rounded" type="date" onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
        <input className="border p-2 rounded" type="date" onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
        <button className="bg-cyan-600 text-white rounded" onClick={fetchRecords}>Filter</button>
      </div>
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2">Date</th><th>Location</th><th>Symptoms</th><th>Risk</th><th>Probability</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record._id} className="border-b">
              <td className="py-2">{new Date(record.recordedAt).toLocaleDateString()}</td>
              <td>{record.location.city}, {record.location.region}</td>
              <td>{record.symptoms.join(', ')}</td>
              <td>{record.prediction?.risk}</td>
              <td>{record.prediction?.probability}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
