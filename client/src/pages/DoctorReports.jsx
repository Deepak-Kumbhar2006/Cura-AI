import { useEffect, useState } from 'react';
import api from '../services/api';

export default function DoctorReports() {
  const [records, setRecords] = useState([]);
  const [region, setRegion] = useState('');
  const [bulk, setBulk] = useState({ numberOfCases: '', diseaseType: '', region: '' });
  const [monthly, setMonthly] = useState({ month: new Date().toISOString().slice(0, 7), region: '', summary: '', totalCasesReviewed: '', highRiskCount: '', dominantDisease: '', recommendations: '' });
  const [library, setLibrary] = useState([]);
  const [error, setError] = useState('');

  const load = async () => {
    const [{ data }, reportRes] = await Promise.all([
      api.get('/api/data/all', { params: { region } }),
      api.get('/api/reports/mine'),
    ]);
    setRecords(data);
    setLibrary(reportRes.data.reports || []);
  };

  useEffect(() => { load().catch(() => setError('Failed to load data')); }, []);

  const saveDiagnosis = async (id, payload) => {
    try {
      await api.patch(`/api/data/${id}/diagnosis`, payload);
      setError('');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save diagnosis');
    }
  };

  const submitBulk = async (e) => {
    e.preventDefault();
    await api.post('/api/data/bulk', { ...bulk, numberOfCases: Number(bulk.numberOfCases) });
    setBulk({ numberOfCases: '', diseaseType: '', region: '' });
    await load();
  };

  const submitMonthly = async (e) => {
    e.preventDefault();
    await api.post('/api/reports/doctor/monthly', {
      ...monthly,
      totalCasesReviewed: Number(monthly.totalCasesReviewed || 0),
      highRiskCount: Number(monthly.highRiskCount || 0),
      recommendations: monthly.recommendations.split('\n').map((line) => line.trim()).filter(Boolean),
    });
    setMonthly((m) => ({ ...m, summary: '', totalCasesReviewed: '', highRiskCount: '', dominantDisease: '', recommendations: '' }));
    await load();
  };

  return (
    <div className="space-y-4">
      {error && <div className="p-2 rounded bg-rose-50 text-rose-600 text-sm border border-rose-200">{error}</div>}

      <div className="bg-white rounded-2xl border border-emerald-100 p-4 overflow-auto">
        <h2 className="text-3xl font-bold mb-3">Doctor Case Manager</h2>
        <div className="flex gap-2 mb-3"><input className="border rounded p-2" placeholder="Filter by region" value={region} onChange={(e) => setRegion(e.target.value)} /><button onClick={load} className="px-4 py-2 rounded bg-emerald-600 text-white">Apply</button></div>
        <table className="min-w-full text-sm"><thead><tr className="border-b"><th className="text-left py-2">Patient</th><th>Location</th><th>Symptoms + Vitals</th><th>Risk</th><th>Diagnosis</th></tr></thead><tbody>{records.map((r) => <tr key={r._id} className="border-b align-top"><td className="py-2">{r.personalDetails?.name || 'N/A'}<br /><span className="text-xs">{r.personalDetails?.age || '-'} / {r.personalDetails?.gender || '-'}</span></td><td>{r.location.city}, {r.location.area || r.location.region}</td><td>{r.symptoms.map((s) => `${s.name}(${s.severity})`).join(', ')}<br /><span className="text-xs">Temp {r.vitals?.bodyTemperature || '-'}°C | SpO2 {r.vitals?.spo2 || '-'} | HR {r.vitals?.heartRate || '-'}</span></td><td>{r.risk}</td><td><DiagnosisEditor record={r} onSave={saveDiagnosis} /></td></tr>)}</tbody></table>
      </div>

      <form onSubmit={submitMonthly} className="bg-white rounded-2xl border border-emerald-100 p-4 space-y-3">
        <h3 className="text-xl font-semibold">Monthly Medical Report (Doctor)</h3>
        <div className="grid md:grid-cols-3 gap-2">
          <input type="month" className="border rounded p-2" value={monthly.month} onChange={(e) => setMonthly({ ...monthly, month: e.target.value })} required />
          <input className="border rounded p-2" placeholder="Region" value={monthly.region} onChange={(e) => setMonthly({ ...monthly, region: e.target.value })} required />
          <input className="border rounded p-2" placeholder="Dominant disease" value={monthly.dominantDisease} onChange={(e) => setMonthly({ ...monthly, dominantDisease: e.target.value })} />
          <input className="border rounded p-2" placeholder="Cases reviewed" value={monthly.totalCasesReviewed} onChange={(e) => setMonthly({ ...monthly, totalCasesReviewed: e.target.value })} />
          <input className="border rounded p-2" placeholder="High-risk cases" value={monthly.highRiskCount} onChange={(e) => setMonthly({ ...monthly, highRiskCount: e.target.value })} />
        </div>
        <textarea className="border rounded p-2 w-full" rows={3} placeholder="Clinical summary" value={monthly.summary} onChange={(e) => setMonthly({ ...monthly, summary: e.target.value })} required />
        <textarea className="border rounded p-2 w-full" rows={2} placeholder="Recommendations (new line separated)" value={monthly.recommendations} onChange={(e) => setMonthly({ ...monthly, recommendations: e.target.value })} />
        <button className="bg-emerald-600 text-white rounded px-3 py-2">Save Monthly Report</button>
      </form>

      <form onSubmit={submitBulk} className="bg-white rounded-2xl border border-emerald-100 p-4">
        <h3 className="text-xl font-semibold mb-2">Bulk Data Entry (Hospital)</h3>
        <div className="grid md:grid-cols-4 gap-2">
          <input className="border rounded p-2" placeholder="Number of cases" value={bulk.numberOfCases} onChange={(e) => setBulk({ ...bulk, numberOfCases: e.target.value })} />
          <input className="border rounded p-2" placeholder="Disease type" value={bulk.diseaseType} onChange={(e) => setBulk({ ...bulk, diseaseType: e.target.value })} />
          <input className="border rounded p-2" placeholder="Region/City" value={bulk.region} onChange={(e) => setBulk({ ...bulk, region: e.target.value })} />
          <button className="bg-emerald-600 text-white rounded px-3">Add Bulk Cases</button>
        </div>
      </form>

      <div className="bg-white rounded-2xl border border-emerald-100 p-4">
        <h3 className="text-xl font-semibold mb-2">Patient Medical Report Library</h3>
        <div className="space-y-2">
          {library.map((report) => (
            <div key={report._id} className="border rounded-lg p-3">
              <p className="font-medium">{report.patientId?.name || 'Patient'} • {report.originalName}</p>
              <p className="text-xs text-slate-500">{new Date(report.createdAt).toLocaleString()} • {report.tags?.join(', ') || 'No tags'}</p>
              <p className="text-sm text-slate-600">{report.notes || 'No notes added.'}</p>
            </div>
          ))}
          {!library.length && <p className="text-sm text-slate-500">No patient uploads found yet.</p>}
        </div>
      </div>
    </div>
  );
}

function DiagnosisEditor({ record, onSave }) {
  const [state, setState] = useState({
    diseaseName: record.diagnosis?.diseaseName || '',
    severity: record.diagnosis?.severity || 'Mild',
    status: record.diagnosis?.status || 'Suspected',
    medicines: record.diagnosis?.medicines || '',
    advice: record.diagnosis?.advice || '',
  });

  return (
    <div className="space-y-1 min-w-[220px]">
      <input className="border rounded p-1 w-full" placeholder="Disease name" value={state.diseaseName} onChange={(e) => setState({ ...state, diseaseName: e.target.value })} />
      <div className="grid grid-cols-2 gap-1">
        <select className="border rounded p-1" value={state.severity} onChange={(e) => setState({ ...state, severity: e.target.value })}><option>Mild</option><option>Moderate</option><option>Severe</option></select>
        <select className="border rounded p-1" value={state.status} onChange={(e) => setState({ ...state, status: e.target.value })}><option>Suspected</option><option>Confirmed</option><option>Recovered</option></select>
      </div>
      <input className="border rounded p-1 w-full" placeholder="Medicines" value={state.medicines} onChange={(e) => setState({ ...state, medicines: e.target.value })} />
      <input className="border rounded p-1 w-full" placeholder="Advice" value={state.advice} onChange={(e) => setState({ ...state, advice: e.target.value })} />
      <button type="button" className="bg-emerald-600 text-white rounded px-2 py-1 text-xs" onClick={() => onSave(record._id, state)}>Save</button>
    </div>
  );
}
