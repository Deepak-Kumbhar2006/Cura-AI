import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Image, X, CloudUpload } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function MedicalUploads() {
  const [files, setFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const addFiles = (fileList) => {
    const next = Array.from(fileList || []).map((f) => ({
      raw: f,
      name: f.name,
      size: `${Math.round(f.size / 1024)}KB`,
      type: f.type,
      preview: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
      uploadedUrl: '',
      uploading: false,
    }));
    setFiles([...next, ...files]);
  };

  const onFile = (e) => addFiles(e.target.files);
  const onDrop = (e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); };
  const removeFile = (idx) => setFiles(files.filter((_, i) => i !== idx));

  const uploadAll = async () => {
    const pending = files.filter((f) => f.raw && !f.uploadedUrl);
    if (!pending.length) return toast('No new files to upload');

    for (const file of pending) {
      setFiles((prev) => prev.map((x) => (x.name === file.name && x.size === file.size ? { ...x, uploading: true } : x)));
      const form = new FormData();
      form.append('report', file.raw);
      try {
        const { data } = await api.post('/api/data/upload-report', form);
        setFiles((prev) =>
          prev.map((x) =>
            x.name === file.name && x.size === file.size ? { ...x, uploading: false, uploadedUrl: data.url } : x
          )
        );
      } catch (err) {
        setFiles((prev) => prev.map((x) => (x.name === file.name && x.size === file.size ? { ...x, uploading: false } : x)));
        toast.error(err.response?.data?.message || `Failed to upload ${file.name}`);
      }
    }
    toast.success('Report upload completed');
  };

  return (
    <div className="max-w-3xl animate-fade-up">
      <div className="mb-6">
        <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-white">Medical Uploads</h2>
        <p className="text-sm text-slate-500 mt-1">Upload medical reports, prescriptions, and diagnostic images</p>
      </div>

      {/* Drop Zone */}
      <div className="card p-5 mb-5">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
            dragOver ? 'border-primary-500 bg-primary-50/50' : 'border-slate-200 dark:border-slate-600 hover:border-primary-300 hover:bg-primary-50/30'
          }`}>
          <CloudUpload size={40} className={`mx-auto mb-3 ${dragOver ? 'text-primary-500' : 'text-slate-300'}`} />
          <p className="font-medium text-slate-700 dark:text-slate-300">Drop files here or click to browse</p>
          <p className="text-xs text-slate-400 mt-1">Supports PDF, JPG, PNG up to 10MB</p>
        </div>
        <input ref={inputRef} type="file" multiple onChange={onFile} className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp" />
        <div className="mt-4 flex justify-end">
          <button type="button" onClick={uploadAll} className="btn-primary">Upload Reports</button>
        </div>
      </div>

      {/* File List */}
      <div className="card p-5">
        <h3 className="font-display font-semibold text-slate-800 dark:text-white mb-4">Uploaded Files</h3>
        <div className="space-y-2">
          <AnimatePresence>
            {files.map((f, i) => (
              <motion.div key={`${f.name}-${i}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-4 p-4 rounded-2xl bg-surface-100 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700 hover:shadow-sm transition group">
                <div className="h-10 w-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 grid place-items-center flex-shrink-0">
                  {f.type?.startsWith('image/') ? <Image size={18} className="text-primary-600" /> : <FileText size={18} className="text-primary-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{f.name}</p>
                  <p className="text-xs text-slate-400">{f.size}</p>
                  {f.uploadedUrl && <p className="text-xs text-primary-600 truncate">Uploaded: {f.uploadedUrl}</p>}
                </div>
                {f.preview && <img src={f.preview} alt="" className="h-10 w-10 rounded-lg object-cover" />}
                {f.uploading && <p className="text-xs text-primary-600">Uploading...</p>}
                <button onClick={() => removeFile(i)} className="p-1.5 rounded-lg hover:bg-danger-50 text-slate-400 hover:text-danger-500 opacity-0 group-hover:opacity-100 transition">
                  <X size={16} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {!files.length && (
            <div className="text-center py-8">
              <Upload size={32} className="mx-auto mb-2 text-slate-300" />
              <p className="text-sm text-slate-400">No uploaded reports yet</p>
              <p className="text-xs text-slate-400">Upload your first medical document</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
