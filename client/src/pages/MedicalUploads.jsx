import { useState } from 'react';

export default function MedicalUploads() {
  const [files, setFiles] = useState([]);
  const onFile = (e) => {
    const next = Array.from(e.target.files || []).map((f) => ({ name: f.name, size: `${Math.round(f.size / 1024)}KB` }));
    setFiles([...next, ...files]);
  };
  return (
    <div className="bg-white rounded-2xl border border-emerald-100 p-4">
      <h2 className="text-2xl font-bold mb-3">Medical Uploads</h2>
      <input type="file" multiple onChange={onFile} className="mb-4" />
      <div className="space-y-2">{files.map((f, i) => <div key={i} className="p-2 rounded bg-emerald-50 text-sm">{f.name} ({f.size})</div>)}{!files.length && <p className="text-sm text-slate-500">No uploaded reports yet.</p>}</div>
    </div>
  );
}
