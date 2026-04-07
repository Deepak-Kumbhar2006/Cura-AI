import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Bell, MapPin, Clock, Shield } from 'lucide-react';
import api from '../services/api';

const severityConfig = {
  Critical: { bg: 'bg-danger-50 dark:bg-danger-500/10', border: 'border-danger-200 dark:border-danger-800/30', icon: 'text-danger-500', badge: 'badge-danger' },
  High: { bg: 'bg-danger-50 dark:bg-danger-500/10', border: 'border-danger-200 dark:border-danger-800/30', icon: 'text-danger-500', badge: 'badge-danger' },
  Medium: { bg: 'bg-warning-50 dark:bg-warning-500/10', border: 'border-warning-200 dark:border-warning-800/30', icon: 'text-warning-500', badge: 'badge-warning' },
  Low: { bg: 'bg-primary-50 dark:bg-primary-500/10', border: 'border-primary-200 dark:border-primary-800/30', icon: 'text-primary-500', badge: 'badge-success' },
};

export default function DoctorAlerts() {
  const [alerts, setAlerts] = useState([]);
  useEffect(() => { api.get('/api/alerts').then((r) => setAlerts(r.data)); }, []);

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-white">Alert Center</h2>
          <p className="text-sm text-slate-500">{alerts.length} active alerts across all regions</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-danger animate-pulse-soft flex items-center gap-1"><Bell size={12} />Live</span>
        </div>
      </div>

      <div className="space-y-3">
        {alerts.map((a, i) => {
          const cfg = severityConfig[a.risk] || severityConfig.Low;
          return (
            <motion.div key={a._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`card p-5 ${cfg.bg} border ${cfg.border}`}>
              <div className="flex items-start gap-4">
                <div className={`h-10 w-10 rounded-2xl grid place-items-center flex-shrink-0 ${a.risk === 'High' || a.risk === 'Critical' ? 'bg-danger-100 dark:bg-danger-900/30' : a.risk === 'Medium' ? 'bg-warning-100 dark:bg-warning-900/30' : 'bg-primary-100 dark:bg-primary-900/30'}`}>
                  <AlertTriangle size={18} className={cfg.icon} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`badge ${cfg.badge}`}>{a.risk}</span>
                    <span className="flex items-center gap-1 text-xs text-slate-500"><MapPin size={12} />{a.location}</span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{a.message}</p>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1"><Clock size={12} />Just now</p>
                </div>
              </div>
            </motion.div>
          );
        })}
        {!alerts.length && (
          <div className="card p-12 text-center">
            <Shield size={40} className="mx-auto mb-3 text-primary-300" />
            <p className="font-semibold text-slate-600 dark:text-slate-300">No Active Alerts</p>
            <p className="text-sm text-slate-400 mt-1">All regions are currently safe</p>
          </div>
        )}
      </div>
    </div>
  );
}
