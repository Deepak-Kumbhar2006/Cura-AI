const actions = [
  'Deploy 3 mobile fever clinics to Metro North within 24 hours',
  'Prioritize influenza vaccine stock reallocation to high-density regions',
  'Issue public advisory on pollution-related respiratory precautions',
  'Scale dengue vector-control teams in humid regions above 70% RH',
];

export default function DecisionSupport() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-5xl font-bold">Decision Support System</h2>
        <p className="text-slate-500 text-2xl">Actionable recommendations powered by predictive analytics</p>
      </div>
      <div className="card p-6">
        <h3 className="text-3xl font-semibold mb-4">Recommended Interventions</h3>
        <ul className="space-y-3">
          {actions.map((a) => <li className="rounded-xl border border-slate-200 p-4 bg-slate-50 text-lg" key={a}>{a}</li>)}
        </ul>
      </div>
    </div>
  );
}
