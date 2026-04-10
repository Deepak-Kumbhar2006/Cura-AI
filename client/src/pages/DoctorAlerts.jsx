import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Bell, Shield } from 'lucide-react';
import api from '../services/api';

function severityStyle(level) {
  const s = (level || 'medium').toLowerCase();
  if (s === 'high' || s === 'critical') return 'border-rose-200 bg-rose-50 text-rose-700';
  if (s === 'medium') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-emerald-200 bg-emerald-50 text-emerald-700';
}

function severityBadge(level) {
  const s = (level || 'medium').toLowerCase();
  if (s === 'high' || s === 'critical') return 'badge-rose';
  if (s === 'medium') return 'badge-amber';
  return 'badge-green';
}

export default function DoctorAlerts() {
  const [alerts, setAlerts] = useState([]);
  useEffect(() => {
    api.get('/api/alerts').then((r) => {
      const payload = Array.isArray(r.data) ? r.data : r.data?.alerts || [];
      setAlerts(payload);
    });
  }, []);

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-400 grid place-items-center">
          <Bell size={20} className="text-white" />
        </div>
        <div>
          <h2 className="section-title">Alert Center</h2>
          <p className="text-sm text-slate-500">{alerts.length} active alert{alerts.length !== 1 ? 's' : ''}</p>
        </div>
      </motion.div>

      <div className="space-y-3">
        {alerts.map((a, idx) => (
          <motion.div
            key={`${a.region || a.location}-${idx}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
            className={`rounded-2xl border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover ${severityStyle(a.severity || a.risk)}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {['high', 'critical'].includes((a.severity || a.risk || '').toLowerCase()) ? (
                    <Shield size={18} className="text-rose-500" />
                  ) : (
                    <AlertTriangle size={18} className="text-amber-500" />
                  )}
                </div>
                <div>
                  <p className="font-semibold">{a.region || a.location || 'Unknown region'}</p>
                  <p className="text-sm mt-0.5">{a.message || `${a.disease || 'Outbreak signal'} reported by ${a.source || 'surveillance network'}.`}</p>
                  {a.timestamp && <p className="text-xs mt-1 opacity-70">{new Date(a.timestamp).toLocaleString()}</p>}
                </div>
              </div>
              <span className={`badge ${severityBadge(a.severity || a.risk)} shrink-0`}>{a.severity || a.risk || 'medium'}</span>
            </div>
          </motion.div>
        ))}
        {!alerts.length && (
          <div className="card p-8 text-center">
            <Bell size={32} className="mx-auto text-emerald-300 mb-2" />
            <p className="text-slate-500">No active alerts at the moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
