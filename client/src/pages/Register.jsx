import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, User, Mail, Lock, ArrowRight, Stethoscope, HeartPulse } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'patient' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
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
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 50%, #ecfdf5 100%)' }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
            className="inline-flex h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-400 text-white items-center justify-center shadow-soft-lg mb-4"
          >
            <ShieldCheck size={32} />
          </motion.div>
          <h1 className="text-2xl font-display font-bold text-slate-800">Create your account</h1>
          <p className="text-sm text-slate-500 mt-1">Join CuraAI health surveillance platform</p>
        </div>

        {/* Form Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-emerald-100/60 shadow-soft-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400" />
                <input className="input-field pl-10" placeholder="John Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400" />
                <input type="email" className="input-field pl-10" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-400" />
                <input type="password" className="input-field pl-10" placeholder="Create a password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">I am a</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, role: 'patient' })}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 transition-all duration-200 text-sm font-medium ${
                    form.role === 'patient'
                      ? 'border-emerald-400 bg-emerald-50 text-emerald-700 shadow-soft'
                      : 'border-emerald-100 bg-white text-slate-600 hover:border-emerald-200'
                  }`}
                >
                  <HeartPulse size={18} /> Patient
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, role: 'doctor' })}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 transition-all duration-200 text-sm font-medium ${
                    form.role === 'doctor'
                      ? 'border-emerald-400 bg-emerald-50 text-emerald-700 shadow-soft'
                      : 'border-emerald-100 bg-white text-slate-600 hover:border-emerald-200'
                  }`}
                >
                  <Stethoscope size={18} /> Doctor
                </button>
              </div>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-rose-600 bg-rose-50 border border-rose-200/60 rounded-xl px-4 py-2.5">
                {error}
              </motion.div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base disabled:opacity-60">
              {loading ? (
                <span className="flex items-center gap-2"><span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating account...</span>
              ) : (
                <span className="flex items-center gap-2">Create account <ArrowRight size={16} /></span>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{' '}
          <Link className="text-emerald-600 font-semibold hover:text-emerald-700 transition-colors" to="/login">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
