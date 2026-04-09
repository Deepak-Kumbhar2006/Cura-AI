import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pill, Plus, Clock, Check, X, AlertCircle, Calendar, Bell, ChevronRight, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const initialMeds = [
  { id: 1, name: 'Paracetamol 500mg', dosage: '1 tablet', frequency: 'Every 8 hours', time: ['08:00', '16:00', '00:00'], startDate: '2026-04-01', endDate: '2026-04-14', taken: [true, true, false], notes: 'Take after food', category: 'Pain Relief' },
  { id: 2, name: 'Azithromycin 250mg', dosage: '1 tablet', frequency: 'Once daily', time: ['09:00'], startDate: '2026-04-03', endDate: '2026-04-08', taken: [true], notes: 'Complete full course', category: 'Antibiotic' },
  { id: 3, name: 'ORS + Zinc', dosage: '1 sachet', frequency: 'Twice daily', time: ['10:00', '18:00'], startDate: '2026-04-05', endDate: '2026-04-12', taken: [false, false], notes: 'Dissolve in 200ml water', category: 'Supplement' },
  { id: 4, name: 'Doxycycline 100mg', dosage: '1 capsule', frequency: 'Twice daily', time: ['08:00', '20:00'], startDate: '2026-04-02', endDate: '2026-04-16', taken: [true, false], notes: 'Avoid dairy products', category: 'Antibiotic' },
  { id: 5, name: 'Vitamin D3', dosage: '1000 IU', frequency: 'Once daily', time: ['07:00'], startDate: '2026-03-01', endDate: '2026-06-01', taken: [true], notes: 'Take with breakfast', category: 'Supplement' },
];

const categories = ['All', 'Antibiotic', 'Pain Relief', 'Supplement', 'Other'];
const categoryColors = { Antibiotic: 'from-blue-500 to-indigo-500', 'Pain Relief': 'from-orange-400 to-red-500', Supplement: 'from-emerald-400 to-teal-500', Other: 'from-slate-400 to-slate-500' };

export default function MedicationTracker() {
  const [medications, setMedications] = useState(initialMeds);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('All');
  const [form, setForm] = useState({ name: '', dosage: '', frequency: 'Once daily', time: ['08:00'], startDate: '', endDate: '', notes: '', category: 'Other' });

  const handleAdd = () => {
    if (!form.name || !form.dosage) return toast.error('Medication name and dosage are required');
    setMedications((prev) => [...prev, {
      id: Date.now(), ...form, taken: form.time.map(() => false),
    }]);
    setForm({ name: '', dosage: '', frequency: 'Once daily', time: ['08:00'], startDate: '', endDate: '', notes: '', category: 'Other' });
    setShowForm(false);
    toast.success('Medication added!');
  };

  const toggleTaken = (medId, idx) => {
    setMedications((prev) => prev.map((m) => {
      if (m.id !== medId) return m;
      const newTaken = [...m.taken];
      newTaken[idx] = !newTaken[idx];
      return { ...m, taken: newTaken };
    }));
  };

  const removeMed = (id) => {
    setMedications((prev) => prev.filter((m) => m.id !== id));
    toast.success('Medication removed');
  };

  const filtered = filter === 'All' ? medications : medications.filter((m) => m.category === filter);
  const adherenceRate = medications.length > 0
    ? Math.round(medications.reduce((acc, m) => acc + m.taken.filter(Boolean).length, 0) / medications.reduce((acc, m) => acc + m.taken.length, 0) * 100)
    : 0;
  const totalDoses = medications.reduce((acc, m) => acc + m.taken.length, 0);
  const takenDoses = medications.reduce((acc, m) => acc + m.taken.filter(Boolean).length, 0);
  const missedDoses = totalDoses - takenDoses;

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-pink-500 via-rose-500 to-orange-500 text-white p-6 shadow-glow">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-36 translate-x-36" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-sm text-white/80 font-medium uppercase tracking-wider">Medication</p>
            <h2 className="text-3xl font-display font-bold mt-1">Medication Tracker</h2>
            <p className="text-sm text-white/70 mt-1">Track doses, set reminders, and maintain adherence</p>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-5 py-3 bg-white/20 hover:bg-white/30 rounded-2xl backdrop-blur transition font-medium">
            <Plus size={18} /> Add Medication
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary-500 to-emerald-500 text-white grid place-items-center"><Pill size={18} /></div>
            <div>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">{medications.length}</p>
              <p className="text-xs text-slate-500">Active Meds</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white grid place-items-center"><Check size={18} /></div>
            <div>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">{takenDoses}/{totalDoses}</p>
              <p className="text-xs text-slate-500">Doses Taken</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-danger-500 to-red-600 text-white grid place-items-center"><AlertCircle size={18} /></div>
            <div>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">{missedDoses}</p>
              <p className="text-xs text-slate-500">Missed</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className={`h-10 w-10 rounded-2xl bg-gradient-to-br ${adherenceRate >= 80 ? 'from-primary-500 to-emerald-500' : adherenceRate >= 50 ? 'from-warning-400 to-orange-500' : 'from-danger-500 to-red-600'} text-white grid place-items-center`}>
              <Bell size={18} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">{adherenceRate}%</p>
              <p className="text-xs text-slate-500">Adherence</p>
            </div>
          </div>
          <div className="mt-2 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${adherenceRate >= 80 ? 'bg-primary-500' : adherenceRate >= 50 ? 'bg-warning-500' : 'bg-danger-500'}`} style={{ width: `${adherenceRate}%` }} />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-2xl text-sm font-medium whitespace-nowrap transition-all ${filter === cat ? 'bg-primary-600 text-white shadow-sm' : 'bg-surface-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700'}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Add Medication Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 grid place-items-center p-4" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-md shadow-elevated" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-bold text-xl text-slate-800 dark:text-white">Add Medication</h3>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition"><X size={18} /></button>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Medication Name</p>
                  <input className="input-field w-full" placeholder="e.g. Paracetamol 500mg" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Dosage</p>
                    <input className="input-field w-full" placeholder="e.g. 1 tablet" value={form.dosage} onChange={(e) => setForm({ ...form, dosage: e.target.value })} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Category</p>
                    <select className="input-field w-full" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                      {categories.filter((c) => c !== 'All').map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Frequency</p>
                  <select className="input-field w-full" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
                    <option>Once daily</option>
                    <option>Twice daily</option>
                    <option>Every 8 hours</option>
                    <option>As needed</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Start Date</p>
                    <input type="date" className="input-field w-full" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">End Date</p>
                    <input type="date" className="input-field w-full" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Notes</p>
                  <textarea className="input-field w-full h-16 resize-none" placeholder="Special instructions..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>
              </div>

              <button onClick={handleAdd} className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-4">
                <Plus size={18} /> Add Medication
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Medication List */}
      <div className="space-y-3">
        {filtered.map((med, i) => {
          const color = categoryColors[med.category] || categoryColors.Other;
          const allTaken = med.taken.every(Boolean);
          return (
            <motion.div key={med.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`card p-5 hover:shadow-elevated transition-all duration-300 ${allTaken ? 'opacity-70' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${color} text-white grid place-items-center shadow-sm`}>
                    <Pill size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 dark:text-white">{med.name}</h4>
                    <p className="text-sm text-slate-500">{med.dosage} · {med.frequency}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1"><Calendar size={11} /> {med.startDate} to {med.endDate}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium ${allTaken ? 'bg-primary-50 text-primary-600' : 'bg-warning-50 text-warning-600'}`}>
                    {med.taken.filter(Boolean).length}/{med.taken.length} taken
                  </span>
                  <button onClick={() => removeMed(med.id)} className="p-1.5 rounded-xl hover:bg-danger-50 text-slate-400 hover:text-danger-600 transition">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Dose toggles */}
              <div className="flex items-center gap-2 mb-2">
                {med.time.map((t, idx) => (
                  <button key={idx} onClick={() => toggleTaken(med.id, idx)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      med.taken[idx]
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500 hover:bg-primary-50'
                    }`}>
                    {med.taken[idx] ? <Check size={12} /> : <Clock size={12} />}
                    {t}
                  </button>
                ))}
              </div>

              {med.notes && (
                <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                  <AlertCircle size={11} className="flex-shrink-0" /> {med.notes}
                </p>
              )}
            </motion.div>
          );
        })}

        {filtered.length === 0 && (
          <div className="card p-8 text-center">
            <Pill size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500">No medications in this category</p>
          </div>
        )}
      </div>
    </div>
  );
}
