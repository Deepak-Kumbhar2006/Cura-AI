import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Mail, Lock, ArrowRight, Loader2, User, Stethoscope, HeartPulse } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'patient' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-surface-50"
      style={{ backgroundImage: 'radial-gradient(ellipse at 20% 50%, #E8F5E940 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, #C8E6C920 0%, transparent 50%)' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="w-full max-w-md">
        <div className="text-center mb-8">
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: 'spring' }}
            className="h-16 w-16 rounded-3xl bg-gradient-to-br from-primary-600 to-primary-400 text-white grid place-items-center mx-auto mb-4 shadow-glow">
            <ShieldCheck size={28} />
          </motion.div>
          <h1 className="text-3xl font-display font-bold text-slate-800">Create account</h1>
          <p className="text-slate-500 mt-2">Join Cura AI Health Surveillance Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-card rounded-3xl p-8 space-y-5">
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Full Name</label>
            <div className="relative">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input-field pl-11" placeholder="John Doe" required
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input-field pl-11" placeholder="you@example.com" type="email" required
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input className="input-field pl-11" placeholder="Create a strong password" type="password" required
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-3 block">I am a</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'patient', label: 'Patient', icon: HeartPulse, desc: 'Track health & symptoms' },
                { value: 'doctor', label: 'Doctor', icon: Stethoscope, desc: 'Monitor & diagnose' },
              ].map((role) => (
                <button key={role.value} type="button"
                  onClick={() => setForm({ ...form, role: role.value })}
                  className={`p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
                    form.role === role.value
                      ? 'border-primary-500 bg-primary-50 shadow-sm'
                      : 'border-slate-200 hover:border-primary-200 hover:bg-primary-50/30'
                  }`}>
                  <role.icon size={22} className={form.role === role.value ? 'text-primary-600' : 'text-slate-400'} />
                  <p className={`font-semibold mt-2 text-sm ${form.role === role.value ? 'text-primary-800' : 'text-slate-700'}`}>{role.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{role.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-2xl bg-danger-50 border border-danger-100 text-danger-600 text-sm">
              {error}
            </motion.div>
          )}

          <button type="submit" disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base disabled:opacity-50">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <><span>Create Account</span><ArrowRight size={18} /></>}
          </button>

          <p className="text-sm text-center text-slate-500">
            Already have an account?{' '}
            <Link className="text-primary-600 font-semibold hover:text-primary-700 transition" to="/login">Sign in</Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
}
