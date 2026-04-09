import { useEffect, useState } from 'react';
import api from '../services/api';

const initialFlags = { highFever: false, lowSpo2: false, respiratoryDistress: false };

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
    <div className="space-y-4">
      <form onSubmit={submit} className="bg-white rounded-2xl border border-emerald-100 p-4 space-y-3">
        <h2 className="text-2xl font-bold">Medical Report Upload</h2>
        <p className="text-sm text-slate-500">Upload lab reports and mark clinical flags so prediction scoring can include report signals.</p>
        <input type="file" accept=".pdf,image/*" onChange={(e) => setSelected(e.target.files?.[0] || null)} className="w-full" required />
        <input className="w-full border rounded p-2" placeholder="Tags (comma separated)" value={tags} onChange={(e) => setTags(e.target.value)} />
        <textarea className="w-full border rounded p-2" placeholder="Notes for doctor" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        <div className="grid sm:grid-cols-3 gap-2 text-sm">
          {Object.keys(flags).map((key) => (
            <label key={key} className="flex items-center gap-2 border rounded-lg px-3 py-2">
              <input type="checkbox" checked={flags[key]} onChange={(e) => setFlags((f) => ({ ...f, [key]: e.target.checked }))} />
              <span>{key}</span>
            </label>
          ))}
        </div>
        <button disabled={!selected || status.loading} className="px-4 py-2 rounded bg-emerald-600 text-white disabled:opacity-60">
          {status.loading ? 'Uploading...' : 'Upload Report'}
        </button>
        {status.error && <p className="text-sm text-rose-600">{status.error}</p>}
        {status.message && <p className="text-sm text-emerald-700">{status.message}</p>}
      </form>

      <div className="bg-white rounded-2xl border border-emerald-100 p-4">
        <h3 className="text-xl font-semibold mb-3">Uploaded Reports</h3>
        <div className="space-y-2">
          {reports.map((report) => (
            <a key={report._id} href={`${import.meta.env.VITE_API_URL || ''}${report.fileUrl}`} target="_blank" rel="noreferrer" className="block rounded-lg border p-3 hover:bg-emerald-50">
              <p className="font-medium">{report.originalName}</p>
              <p className="text-xs text-slate-500">{new Date(report.createdAt).toLocaleString()} • {(report.size / 1024).toFixed(1)} KB</p>
              <p className="text-sm text-slate-600">{report.notes || 'No notes added.'}</p>
            </a>
          ))}
          {!reports.length && <p className="text-sm text-slate-500">No reports uploaded yet.</p>}
        </div>
      </div>
    </div>
  );
}
