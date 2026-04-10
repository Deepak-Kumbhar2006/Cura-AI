import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Tag, Flag, FolderOpen } from 'lucide-react';
import api from '../services/api';

const initialFlags = { highFever: false, lowSpo2: false, respiratoryDistress: false };
const flagLabels = { highFever: 'High Fever', lowSpo2: 'Low SpO2', respiratoryDistress: 'Respiratory Distress' };

export default function MedicalUploads() {
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('cbc,blood-test');
  const [flags, setFlags] = useState(initialFlags);
  const [reports, setReports] = useState([]);
  const [status, setStatus] = useState({ loading: false, error: '', message: '' });

  const loadReports = async () => {
    const { data } = await api.get('/api/reports/mine');
    setReports(data.reports || []);
  };

  useEffect(() => {
    loadReports().catch(() => setStatus((s) => ({ ...s, error: 'Unable to load reports' })));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setStatus({ loading: true, error: '', message: '' });
    try {
      const form = new FormData();
      form.append('file', selected);
      form.append('notes', notes);
      form.append('tags', tags);
      Object.entries(flags).forEach(([k, v]) => form.append(k, String(v)));
      await api.post('/api/reports/patient/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSelected(null);
      setNotes('');
      setTags('cbc,blood-test');
      setFlags(initialFlags);
      await loadReports();
      setStatus({ loading: false, error: '', message: 'Report uploaded successfully.' });
    } catch (err) {
      setStatus({ loading: false, error: err.response?.data?.message || 'Upload failed', message: '' });
    }
  };

  return (
    <div className="space-y-5">
      <motion.form initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} onSubmit={submit} className="card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-400 grid place-items-center">
            <Upload size={20} className="text-white" />
          </div>
          <div>
            <h2 className="section-title">Medical Report Upload</h2>
            <p className="text-sm text-slate-500">Upload lab reports and mark clinical flags for AI scoring</p>
          </div>
        </div>

        <div className="rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/20 p-6 text-center hover:border-emerald-300 transition-colors">
          <Upload size={28} className="mx-auto text-emerald-400 mb-2" />
          <p className="text-sm text-slate-600 mb-2">{selected ? selected.name : 'Choose a file to upload'}</p>
          <input type="file" accept=".pdf,image/*" onChange={(e) => setSelected(e.target.files?.[0] || null)} className="text-sm file:mr-3 file:rounded-xl file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-emerald-700 hover:file:bg-emerald-100 file:cursor-pointer file:transition-colors" required />
        </div>

        <div className="relative">
          <Tag size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400" />
          <input className="input-field pl-9" placeholder="Tags (comma separated)" value={tags} onChange={(e) => setTags(e.target.value)} />
        </div>
        <textarea className="input-field" placeholder="Notes for doctor" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />

        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Flag size={14} className="text-emerald-500" />
            <p className="text-sm font-semibold text-slate-700">Clinical Flags</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-2 text-sm">
            {Object.keys(flags).map((key) => (
              <label key={key} className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 cursor-pointer transition-all duration-200 ${flags[key] ? 'border-emerald-400 bg-emerald-50 shadow-soft' : 'border-emerald-100 bg-white hover:border-emerald-200'}`}>
                <input type="checkbox" className="accent-emerald-500" checked={flags[key]} onChange={(e) => setFlags((f) => ({ ...f, [key]: e.target.checked }))} />
                <span className={flags[key] ? 'font-medium text-emerald-700' : 'text-slate-600'}>{flagLabels[key] || key}</span>
              </label>
            ))}
          </div>
        </div>

        <button disabled={!selected || status.loading} className="btn-primary disabled:opacity-60">
          <Upload size={16} />
          {status.loading ? 'Uploading...' : 'Upload Report'}
        </button>
        {status.error && <p className="text-sm text-rose-600">{status.error}</p>}
        {status.message && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-emerald-700 font-medium">{status.message}</motion.p>}
      </motion.form>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <FolderOpen size={18} className="text-emerald-500" />
          <h3 className="text-lg font-display font-semibold text-slate-800">Uploaded Reports</h3>
        </div>
        <div className="space-y-2">
          {reports.map((report) => (
            <a key={report._id} href={`${import.meta.env.VITE_API_URL || ''}${report.fileUrl}`} target="_blank" rel="noreferrer" className="flex items-start gap-3 rounded-xl border border-emerald-100/60 bg-emerald-50/20 p-3 hover:bg-emerald-50/40 hover:-translate-y-0.5 transition-all duration-200">
              <div className="h-9 w-9 rounded-lg bg-emerald-100 grid place-items-center shrink-0 mt-0.5">
                <FileText size={16} className="text-emerald-600" />
              </div>
              <div>
                <p className="font-medium text-slate-800">{report.originalName}</p>
                <p className="text-xs text-slate-500 mt-0.5">{new Date(report.createdAt).toLocaleString()} · {(report.size / 1024).toFixed(1)} KB</p>
                <p className="text-sm text-slate-600 mt-0.5">{report.notes || 'No notes added.'}</p>
              </div>
            </a>
          ))}
          {!reports.length && <p className="text-sm text-slate-500">No reports uploaded yet.</p>}
        </div>
      </motion.div>
    </div>
  );
}
