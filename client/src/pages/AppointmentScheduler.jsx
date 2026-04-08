import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Phone, Plus, Check, X, Video, Stethoscope } from 'lucide-react';
import toast from 'react-hot-toast';

const doctors = [
  { id: 1, name: 'Dr. Aisha Sharma', specialty: 'General Medicine', avatar: 'AS', available: ['10:00', '11:00', '14:00', '15:00', '16:00'] },
  { id: 2, name: 'Dr. Rajesh Patel', specialty: 'Pulmonology', avatar: 'RP', available: ['09:00', '10:30', '13:00', '14:30'] },
  { id: 3, name: 'Dr. Priya Nair', specialty: 'Infectious Disease', avatar: 'PN', available: ['08:00', '11:00', '13:30', '15:00', '16:30'] },
  { id: 4, name: 'Dr. Vikram Singh', specialty: 'Cardiology', avatar: 'VS', available: ['10:00', '12:00', '14:00', '16:00'] },
  { id: 5, name: 'Dr. Meena Gupta', specialty: 'Dermatology', avatar: 'MG', available: ['09:30', '11:30', '14:00', '15:30'] },
];

const typeOptions = [
  { id: 'in-person', label: 'In-Person', icon: Stethoscope },
  { id: 'video', label: 'Video Call', icon: Video },
  { id: 'phone', label: 'Phone Call', icon: Phone },
];

export default function AppointmentScheduler() {
  const [appointments, setAppointments] = useState([
    { id: 1, doctor: 'Dr. Aisha Sharma', specialty: 'General Medicine', date: '2026-04-10', time: '10:00', type: 'in-person', status: 'confirmed', reason: 'Follow-up checkup' },
    { id: 2, doctor: 'Dr. Rajesh Patel', specialty: 'Pulmonology', date: '2026-04-12', time: '14:30', type: 'video', status: 'pending', reason: 'Breathing difficulty' },
    { id: 3, doctor: 'Dr. Priya Nair', specialty: 'Infectious Disease', date: '2026-04-08', time: '11:00', type: 'in-person', status: 'completed', reason: 'Dengue follow-up' },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ doctor: '', date: '', time: '', type: 'in-person', reason: '' });
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const handleBook = () => {
    if (!form.doctor || !form.date || !form.time) return toast.error('Please fill all required fields');
    const doc = doctors.find((d) => d.name === form.doctor);
    setAppointments((prev) => [...prev, {
      id: Date.now(), doctor: form.doctor, specialty: doc?.specialty || '', date: form.date,
      time: form.time, type: form.type, status: 'pending', reason: form.reason,
    }]);
    setForm({ doctor: '', date: '', time: '', type: 'in-person', reason: '' });
    setSelectedDoctor(null);
    setShowForm(false);
    toast.success('Appointment booked successfully!');
  };

  const cancelAppointment = (id) => {
    setAppointments((prev) => prev.filter((a) => a.id !== id));
    toast.success('Appointment cancelled');
  };

  const statusBadge = { confirmed: 'badge-success', pending: 'badge-warning', completed: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300', cancelled: 'badge-danger' };
  const typeBadge = { 'in-person': 'bg-blue-50 text-blue-600', video: 'bg-purple-50 text-purple-600', phone: 'bg-teal-50 text-teal-600' };

  const upcoming = appointments.filter((a) => a.status !== 'completed').sort((a, b) => new Date(a.date) - new Date(b.date));
  const past = appointments.filter((a) => a.status === 'completed');

  return (
    <div className="space-y-5 animate-fade-up">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-600 via-emerald-500 to-teal-500 text-white p-6 shadow-glow">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-36 translate-x-36" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-sm text-white/80 font-medium uppercase tracking-wider">Appointments</p>
            <h2 className="text-3xl font-display font-bold mt-1">Schedule & Manage</h2>
            <p className="text-sm text-white/70 mt-1">Book appointments with specialists and track visits</p>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-5 py-3 bg-white/20 hover:bg-white/30 rounded-2xl backdrop-blur transition font-medium">
            <Plus size={18} /> Book Appointment
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5 text-center">
          <p className="text-3xl font-bold text-primary-600">{upcoming.length}</p>
          <p className="text-sm text-slate-500 mt-1">Upcoming</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-3xl font-bold text-warning-600">{appointments.filter((a) => a.status === 'pending').length}</p>
          <p className="text-sm text-slate-500 mt-1">Pending</p>
        </div>
        <div className="card p-5 text-center">
          <p className="text-3xl font-bold text-slate-600 dark:text-slate-400">{past.length}</p>
          <p className="text-sm text-slate-500 mt-1">Completed</p>
        </div>
      </div>

      {/* Booking Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 grid place-items-center p-4" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-elevated max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-display font-bold text-xl text-slate-800 dark:text-white">Book Appointment</h3>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition"><X size={18} /></button>
              </div>

              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Appointment Type</p>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {typeOptions.map((t) => (
                  <button key={t.id} onClick={() => setForm({ ...form, type: t.id })}
                    className={`p-3 rounded-2xl border-2 transition text-center ${form.type === t.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30' : 'border-slate-200 dark:border-slate-600 hover:border-primary-200'}`}>
                    <t.icon size={20} className={`mx-auto mb-1 ${form.type === t.id ? 'text-primary-600' : 'text-slate-400'}`} />
                    <p className="text-xs font-medium">{t.label}</p>
                  </button>
                ))}
              </div>

              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">Select Doctor</p>
              <div className="space-y-2 mb-4 max-h-48 overflow-auto">
                {doctors.map((d) => (
                  <button key={d.id} onClick={() => { setForm({ ...form, doctor: d.name }); setSelectedDoctor(d); }}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 transition text-left ${form.doctor === d.name ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30' : 'border-slate-100 dark:border-slate-700 hover:border-primary-200'}`}>
                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 text-white grid place-items-center text-sm font-bold flex-shrink-0">{d.avatar}</div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">{d.name}</p>
                      <p className="text-xs text-slate-500">{d.specialty}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Date</p>
                  <input type="date" className="input-field w-full" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Time Slot</p>
                  {selectedDoctor ? (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedDoctor.available.map((t) => (
                        <button key={t} onClick={() => setForm({ ...form, time: t })}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${form.time === t ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-primary-50'}`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  ) : <p className="text-xs text-slate-400 py-2">Select a doctor first</p>}
                </div>
              </div>

              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Reason (optional)</p>
              <textarea className="input-field w-full h-20 resize-none mb-4" placeholder="Describe your concern..." value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />

              <button onClick={handleBook} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                <Check size={18} /> Confirm Booking
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upcoming Appointments */}
      <div>
        <h3 className="font-display font-semibold text-slate-800 dark:text-white mb-4">Upcoming Appointments</h3>
        {upcoming.length === 0 ? (
          <div className="card p-8 text-center">
            <Calendar size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500">No upcoming appointments</p>
            <button onClick={() => setShowForm(true)} className="btn-primary mt-3 text-sm">Book Now</button>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((apt, i) => (
              <motion.div key={apt.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="card p-5 hover:shadow-elevated transition-all duration-300">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 text-white grid place-items-center font-bold text-sm">
                      {apt.doctor.split(' ').map((w) => w[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 dark:text-white">{apt.doctor}</h4>
                      <p className="text-sm text-slate-500">{apt.specialty}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(apt.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {apt.time}</span>
                      </div>
                      {apt.reason && <p className="text-xs text-slate-400 mt-1">Reason: {apt.reason}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${typeBadge[apt.type]} text-[10px]`}>{apt.type}</span>
                    <span className={`badge ${statusBadge[apt.status]} text-[10px]`}>{apt.status}</span>
                    {apt.status !== 'completed' && (
                      <button onClick={() => cancelAppointment(apt.id)} className="p-1.5 rounded-xl hover:bg-danger-50 text-slate-400 hover:text-danger-600 transition">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Past Appointments */}
      {past.length > 0 && (
        <div>
          <h3 className="font-display font-semibold text-slate-800 dark:text-white mb-4">Past Appointments</h3>
          <div className="space-y-2">
            {past.map((apt) => (
              <div key={apt.id} className="card p-4 opacity-70">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-slate-200 dark:bg-slate-600 text-slate-500 grid place-items-center font-bold text-xs">
                      {apt.doctor.split(' ').map((w) => w[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-slate-700 dark:text-slate-300">{apt.doctor}</p>
                      <p className="text-xs text-slate-400">{new Date(apt.date).toLocaleDateString()} · {apt.time}</p>
                    </div>
                  </div>
                  <span className={`badge ${statusBadge[apt.status]} text-[10px]`}>{apt.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
