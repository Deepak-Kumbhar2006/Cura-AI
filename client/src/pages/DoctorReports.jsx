import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Save, Plus, AlertTriangle, ClipboardList, Users } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const riskBadge = { High: 'badge-danger', Medium: 'badge-warning', Low: 'badge-success' };

export default function DoctorReports() {
  const [records, setRecords] = useState([]);
  const [region, setRegion] = useState('');
  const [bulk, setBulk] = useState({ numberOfCases: '', diseaseType: '', region: '' });
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const { data } = await api.get('/api/data/all', { params: { region } });
      setRecords(data);
    } catch { toast.error('Failed to load cases'); }
  };

  useEffect(() => { load(); }, []);

  const saveDiagnosis = async (id, payload) => {
    try {
      await api.patch(`/api/data/${id}/diagnosis`, payload);
      setError('');
      toast.success('Diagnosis saved');
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save diagnosis');
    }
  };

  const submitBulk = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/data/bulk', { ...bulk, numberOfCases: Number(bulk.numberOfCases) });
      setBulk({ numberOfCases: '', diseaseType: '', region: '' });
      toast.success('Bulk cases added');
      load();
    } catch { toast.error('Failed to add bulk cases'); }
  };

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-white">Case Manager</h2>
          <p className="text-sm text-slate-500">Manage patient cases, diagnoses, and treatment plans</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input-field pl-9 py-2 text-sm w-48" placeholder="Filter by region..." value={region} onChange={(e) => setRegion(e.target.value)} />
          </div>
          <button onClick={load} className="btn-primary py-2 flex items-center gap-1.5"><Filter size={14} />Apply</button>
        </div>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="p-3 rounded-2xl bg-danger-50 border border-danger-200 flex items-center gap-2 text-sm text-danger-600">
          <AlertTriangle size={16} />{error}
        </motion.div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 bg-surface-100 dark:bg-slate-800/50">
                <th className="text-left py-3 px-4 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Patient</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Location</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Symptoms & Vitals</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">Risk</th>
                <th className="text-left py-3 px-4 font-semibold text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider min-w-[280px]">Diagnosis</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r._id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-primary-50/30 dark:hover:bg-slate-700/30 transition align-top">
                  <td className="py-3 px-4">
                    <p className="font-medium text-slate-800 dark:text-slate-200">{r.personalDetails?.name || 'N/A'}</p>
                    <p className="text-xs text-slate-500">{r.personalDetails?.age || '-'} / {r.personalDetails?.gender || '-'}</p>
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-400 text-sm">{r.location?.city}, {r.location?.area || r.location?.region}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1 mb-1">
                      {(r.symptoms || []).map((s) => (
                        <span key={s.name} className="tag tag-inactive text-[10px] py-0.5">{s.name} ({s.severity})</span>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400">T: {r.vitals?.bodyTemperature || '-'}°C · SpO2: {r.vitals?.spo2 || '-'} · HR: {r.vitals?.heartRate || '-'}</p>
                  </td>
                  <td className="py-3 px-4"><span className={`badge ${riskBadge[r.risk] || 'badge-info'}`}>{r.risk}</span></td>
                  <td className="py-3 px-4"><DiagnosisEditor record={r} onSave={saveDiagnosis} /></td>
                </tr>
              ))}
              {!records.length && (
                <tr><td colSpan={5} className="py-12 text-center text-slate-400">
                  <ClipboardList size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No patient cases found</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Entry */}
      <form onSubmit={submitBulk} className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Plus size={16} className="text-primary-600" />
          <h3 className="font-display font-semibold text-slate-800 dark:text-white">Bulk Data Entry</h3>
          <span className="badge badge-info">Hospital Mode</span>
        </div>
        <div className="grid md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">Number of Cases</label>
            <input className="input-field" placeholder="50" type="number" value={bulk.numberOfCases} onChange={(e) => setBulk({ ...bulk, numberOfCases: e.target.value })} required />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">Disease Type</label>
            <input className="input-field" placeholder="Dengue" value={bulk.diseaseType} onChange={(e) => setBulk({ ...bulk, diseaseType: e.target.value })} required />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">Region / City</label>
            <input className="input-field" placeholder="Pune" value={bulk.region} onChange={(e) => setBulk({ ...bulk, region: e.target.value })} required />
          </div>
          <div className="flex items-end">
            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2"><Plus size={16} />Add Cases</button>
          </div>
        </div>
      </form>
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
    <div className="space-y-2 min-w-[260px]">
      <input className="input-field py-2 text-sm" placeholder="Disease name" value={state.diseaseName} onChange={(e) => setState({ ...state, diseaseName: e.target.value })} />
      <div className="grid grid-cols-2 gap-2">
        <select className="input-field py-2 text-sm" value={state.severity} onChange={(e) => setState({ ...state, severity: e.target.value })}>
          <option>Mild</option><option>Moderate</option><option>Severe</option>
        </select>
        <select className="input-field py-2 text-sm" value={state.status} onChange={(e) => setState({ ...state, status: e.target.value })}>
          <option>Suspected</option><option>Confirmed</option><option>Recovered</option>
        </select>
      </div>
      <input className="input-field py-2 text-sm" placeholder="Medicines" value={state.medicines} onChange={(e) => setState({ ...state, medicines: e.target.value })} />
      <input className="input-field py-2 text-sm" placeholder="Advice" value={state.advice} onChange={(e) => setState({ ...state, advice: e.target.value })} />
      <button type="button" className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1" onClick={() => onSave(record._id, state)}>
        <Save size={12} />Save Diagnosis
      </button>
    </div>
  );
}
