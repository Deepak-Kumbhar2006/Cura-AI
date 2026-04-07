export default function SettingsPrivacy() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-5xl font-bold">Settings & Privacy</h2>
        <p className="text-slate-500 text-2xl">Security, compliance, and governance controls</p>
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-6">
          <h3 className="text-3xl font-semibold mb-4">Privacy Controls</h3>
          <ul className="space-y-2 text-lg text-slate-700">
            <li>• HIPAA-style data minimization and pseudonymization</li>
            <li>• Encryption at rest and in transit (TLS/AES-256)</li>
            <li>• Role-based access policy and audit logging</li>
          </ul>
        </div>
        <div className="card p-6">
          <h3 className="text-3xl font-semibold mb-4">Deployment Controls</h3>
          <ul className="space-y-2 text-lg text-slate-700">
            <li>• Environment scoped secrets</li>
            <li>• Rate limiting and JWT expiry</li>
            <li>• Data retention policies and backup schedules</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
