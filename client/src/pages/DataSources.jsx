import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import StatCard from '../components/StatCard';

function Section({ title, children }) {
  return (
    <div className="card p-5 space-y-3">
      <h3 className="text-xl font-semibold text-slate-800">{title}</h3>
      {children}
    </div>
  );
}

export default function DataSources() {
  const [city, setCity] = useState('Pune');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [overview, setOverview] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/api/external/overview', { params: { city } });
      setOverview(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load external data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const weatherPreview = useMemo(() => (overview?.weather?.samples || []).slice(0, 8), [overview]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">External Data Integrations</h2>
        <p className="text-slate-500 mt-1">Live connectors for disease trends, weather, geolocation and drug intelligence</p>
      </div>
      <div className="card p-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider block mb-1">City</label>
          <input className="input-field py-2 w-56" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <button className="btn-primary py-2.5" onClick={load} disabled={loading}>{loading ? 'Loading...' : 'Refresh APIs'}</button>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Active Sources" value="7" subtitle="GDELT, Open-Meteo, CDC, OpenFDA, OpenCage..." accent="text-emerald-600" />
        <StatCard title="GDELT Articles" value={String(overview?.gdelt?.count || 0)} subtitle="Disease/news trends" />
        <StatCard title="CDC Rows" value={String(overview?.cdc?.count || 0)} subtitle="Public health records" />
        <StatCard title="OpenAI" value={overview?.ai?.configured ? 'Configured' : 'Fallback'} subtitle={overview?.ai?.model || 'gpt-4o-mini'} />
      </div>

      {error && <div className="p-3 rounded-2xl bg-danger-50 border border-danger-200 text-danger-600 text-sm">{error}</div>}

      <div className="grid lg:grid-cols-2 gap-4">
        <Section title="GDELT Disease News">
          <div className="space-y-2">
            {(overview?.gdelt?.articles || []).slice(0, 6).map((a) => (
              <a key={a.url} href={a.url} target="_blank" rel="noreferrer" className="block p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-primary-300">
                <p className="font-medium text-slate-800">{a.title}</p>
                <p className="text-xs text-slate-500 mt-1">{a.source}</p>
              </a>
            ))}
            {!overview?.gdelt?.articles?.length && <p className="text-sm text-slate-500">No GDELT articles available.</p>}
          </div>
        </Section>

        <Section title="Open-Meteo (Hourly Weather)">
          <div className="space-y-2">
            {weatherPreview.map((w) => (
              <div key={w.time} className="flex justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-sm">
                <span>{new Date(w.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span>{w.temperature}°C · RH {w.humidity}% · Rain {w.precipitation}</span>
              </div>
            ))}
            {!weatherPreview.length && <p className="text-sm text-slate-500">No weather samples available.</p>}
          </div>
        </Section>

        <Section title="News API (Optional)">
          {overview?.news?.configured ? (
            <div className="space-y-2">
              {(overview?.news?.articles || []).slice(0, 5).map((a) => (
                <a key={a.url} href={a.url} target="_blank" rel="noreferrer" className="block p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-primary-300">
                  <p className="font-medium text-slate-800">{a.title}</p>
                  <p className="text-xs text-slate-500 mt-1">{a.source}</p>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Set `NEWS_API_KEY` in `server/.env` to enable NewsAPI feed.</p>
          )}
        </Section>

        <Section title="CDC + OpenFDA + Geocode">
          <div className="space-y-3 text-sm">
            <p className="text-slate-700"><strong>CDC rows:</strong> {overview?.cdc?.count || 0}</p>
            <p className="text-slate-700"><strong>OpenFDA matches:</strong> {overview?.openfda?.total || 0}</p>
            <p className="text-slate-700"><strong>OpenCage:</strong> {overview?.geocode?.configured ? `${overview?.geocode?.lat}, ${overview?.geocode?.lng}` : 'Fallback coordinates used'}</p>
            <p className="text-slate-700"><strong>India data portal:</strong> <a href="https://data.gov.in/" target="_blank" rel="noreferrer" className="text-primary-700 underline">data.gov.in</a></p>
            <p className="text-slate-700"><strong>Pytrends:</strong> {overview?.bonus?.pytrends || 'Supported via Python integration'}</p>
          </div>
        </Section>
      </div>
    </div>
  );
}
