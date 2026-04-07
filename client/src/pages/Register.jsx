import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'patient' });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow max-w-sm w-full space-y-3">
        <h2 className="text-xl font-bold">Create Cura account</h2>
        <input className="w-full border p-2 rounded" placeholder="Name" onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="w-full border p-2 rounded" placeholder="Email" onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="w-full border p-2 rounded" type="password" placeholder="Password" onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <select className="w-full border p-2 rounded" onChange={(e) => setForm({ ...form, role: e.target.value })} value={form.role}>
          <option value="patient">patient</option>
          <option value="doctor">doctor</option>
        </select>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button className="w-full bg-emerald-600 text-white rounded py-2">Register</button>
        <p className="text-sm">Already have account? <Link className="text-emerald-600" to="/login">Login</Link></p>
      </form>
    </div>
  );
}
