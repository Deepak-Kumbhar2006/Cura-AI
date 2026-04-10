import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet';
import {
  Bot,
  Brain,
  Download,
  Globe,
  ShieldAlert,
  Thermometer,
  Waves,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const PIE_COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6'];

const numberFormat = new Intl.NumberFormat('en-IN');

function formatNumber(value) {
  return numberFormat.format(Number(value || 0));
}

function levelClass(level) {
  if (level === 'high') return 'bg-rose-50 text-rose-700 border-rose-200';
  if (level === 'medium') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-emerald-50 text-emerald-700 border-emerald-200';
}

function mapColor(level) {
  if (level === 'high') return '#ef4444';
  if (level === 'medium') return '#f59e0b';
  return '#22c55e';
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeDate(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'number') return new Date(value).toISOString().slice(0, 10);
  if (typeof value === 'object') {
    if (typeof value._id === 'string') return value._id;
    if (value.date) return normalizeDate(value.date);
  }
  return String(value);
}

function toDailyTrend(series = []) {
  const normalized = asArray(series).map((item) => ({
    date: normalizeDate(item?.date),
    cases: Number(item?.cases || 0),
  })).filter((item) => item.date);

  const sorted = normalized.sort((a, b) => a.date.localeCompare(b.date));
  const windowed = sorted.slice(-45);
  return windowed.map((item, index) => {
    const prev = windowed[index - 1];
    const dateShort = item.date.includes('-') ? item.date.slice(5) : item.date;
    return {
      date: item.date,
      dateShort,
      totalCases: item.cases,
      newCases: prev ? Math.max(0, item.cases - prev.cases) : 0,
    };
  });
}

export default function DoctorDashboard() {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [regions, setRegions] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [trends, setTrends] = useState(null);
  const [environment, setEnvironment] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [hospitalLoad, setHospitalLoad] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [historicalIndex, setHistoricalIndex] = useState(0);
  const [humidityDelta, setHumidityDelta] = useState(0);
  const [casesMultiplier, setCasesMultiplier] = useState(1);
  const [vaccinationRate, setVaccinationRate] = useState(0);
  const [chatPrompt, setChatPrompt] = useState('');
  const [chatReply, setChatReply] = useState('');
  const [scenarioComparison, setScenarioComparison] = useState(null);
  const [globalHealth, setGlobalHealth] = useState(null);
  const [globalHealthLoading, setGlobalHealthLoading] = useState(false);

  const loadAll = async ({ silent = false, customHumidityDelta = humidityDelta, customCasesMultiplier = casesMultiplier, customVaccinationRate = vaccinationRate } = {}) => {
    if (!silent) setLoading(true);
    try {
      const [dashRes, regionRes, alertRes, trendRes, envRes, predictionRes] = await Promise.all([
        api.get('/api/dashboard'),
        api.get('/api/regions'),
        api.get('/api/alerts'),
        api.get('/api/trends'),
        api.get('/api/environment'),
        api.get('/api/predictions', { params: { humidityDelta: customHumidityDelta, casesMultiplier: customCasesMultiplier, vaccinationRate: customVaccinationRate } }),
      ]);

      setDashboard(dashRes.data);
      setRegions(asArray(regionRes.data?.regions));
      setAlerts(asArray(alertRes.data?.alerts));
      setTrends(trendRes.data || {});
      setEnvironment(asArray(envRes.data?.environment));
      setPredictions(asArray(predictionRes.data?.predictions));
      setHospitalLoad(asArray(predictionRes.data?.hospitalLoadEstimator));
      if (!selectedRegion && asArray(regionRes.data?.regions).length) setSelectedRegion(asArray(regionRes.data?.regions)[0]);
    } catch (_error) {
      toast.error('Unable to fetch live surveillance signals.');
    } finally {
      setLoading(false);
    }
  };

  const loadGlobalHealth = async () => {
    setGlobalHealthLoading(true);
    try {
      const { data } = await api.get('/api/global-health');
      setGlobalHealth(data);
    } catch (_error) {
      /* Global health data is supplementary */
    } finally {
      setGlobalHealthLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    loadGlobalHealth();
    const interval = setInterval(() => loadAll({ silent: true }), 45000);
    const ghInterval = setInterval(loadGlobalHealth, 120000);
    return () => { clearInterval(interval); clearInterval(ghInterval); };
  }, []);

  const trendSeries = useMemo(() => toDailyTrend(trends?.cases || []), [trends]);

  useEffect(() => {
    if (!trendSeries.length) return;
    setHistoricalIndex(trendSeries.length - 1);
  }, [trendSeries.length]);

  const selectedSnapshot = trendSeries[historicalIndex] || null;
  const trendComparisonData = asArray(trends?.trendComparison);

  const geoAlert = useMemo(() => {
    if (!selectedRegion) return null;
    return alerts.find((alert) => alert.region === selectedRegion.region) || null;
  }, [alerts, selectedRegion]);

  const runSimulation = async () => {
    await loadAll({ customHumidityDelta: humidityDelta, customCasesMultiplier: casesMultiplier, customVaccinationRate: vaccinationRate });
    try {
      const { data } = await api.get('/api/predictions/compare', { params: { humidityA: 0, casesA: 1, vaxA: 0, humidityB: humidityDelta, casesB: casesMultiplier, vaxB: vaccinationRate } });
      setScenarioComparison(data);
    } catch (_error) {
      setScenarioComparison(null);
    }
    toast.success(`Scenario executed: humidity ${humidityDelta >= 0 ? '+' : ''}${humidityDelta}%, cases x${casesMultiplier.toFixed(2)}, vaccination ${vaccinationRate}%`);
  };

  const exportReport = () => {
    if (!dashboard) return;
    const reportPayload = {
      generatedAt: new Date().toISOString(),
      dashboard,
      selectedRegion,
      predictions,
      hospitalLoad,
      topAlerts: alerts.slice(0, 25),
    };
    const blob = new Blob([JSON.stringify(reportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cura-surveillance-report-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const askAssistant = async () => {
    if (!chatPrompt.trim()) return;
    try {
      const response = await api.post('/api/chat', { message: chatPrompt });
      setChatReply(response.data.reply || 'No response generated.');
      setChatPrompt('');
    } catch (_error) {
      toast.error('Assistant is currently unavailable.');
    }
  };

  if (loading || !dashboard || !trends) return <DashboardSkeleton />;

  const highRiskCount = regions.filter((region) => region.riskLevel === 'high').length;

  return (
    <div className="space-y-5">
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="card p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-600 font-semibold">Cura-AI Command Center</p>
              <h1 className="text-2xl font-display font-bold text-slate-800 mt-1">Health Surveillance Dashboard</h1>
              <p className="mt-1 text-sm text-slate-500">
                Data fusion from WHO GHO, data.gov.in, disease.sh, Open-Meteo, AQICN and IDSP feeds.
              </p>
              <p className="mt-2 text-xs text-slate-400">
                Last Updated: {new Date(dashboard.lastUpdated).toLocaleString()} · Auto-refresh every 45s
              </p>
              {dashboard.selfLearning?.message && <p className="mt-1 text-xs text-emerald-600">{dashboard.selfLearning.message}</p>}
              <p className="mt-1 text-xs text-slate-400">Pipeline: {asArray(dashboard.pipelineStatus).filter((p) => p.status === 'ok').length}/{asArray(dashboard.pipelineStatus).length || 0} sources healthy</p>
              {globalHealth && <p className="mt-1 text-xs text-emerald-600">Global Health API: {globalHealth.sourceCount || 0} live sources ({(globalHealth.activeSources || []).join(', ')})</p>}
            </div>
            <button
              onClick={exportReport}
              className="btn-primary"
            >
              <Download size={16} /> Export Report
            </button>
          </div>
        </section>

        {highRiskCount > 0 && (
          <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <p className="flex items-center gap-2 font-semibold text-rose-700"><ShieldAlert size={18} /> Smart Alert: {highRiskCount} regions are currently in high-risk status.</p>
          </section>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          {[
            ['Total Cases', formatNumber(dashboard.totalCases)],
            ['Active Cases', formatNumber(dashboard.activeCases)],
            ['High Risk Regions', formatNumber(dashboard.highRiskRegions)],
            ['Alerts Today', formatNumber(dashboard.alertsToday)],
            ['AI Confidence', `${dashboard.aiConfidence}%`],
            ['Global COVID', globalHealth?.globalCovid ? formatNumber(globalHealth.globalCovid.active) + ' active' : 'Loading...'],
          ].map(([title, value], idx) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="metric-card"
            >
              <p className="text-xs uppercase tracking-wider text-slate-500 font-medium">{title}</p>
              <p className="mt-2 text-3xl font-bold font-display text-slate-800">{value}</p>
            </motion.div>
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <article className="card p-5 xl:col-span-2">
            <h3 className="mb-3 font-semibold">Real-time Case Trend</h3>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={trendSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="dateShort" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="newCases" stroke="#ef4444" strokeWidth={2} dot={false} name="New Cases" />
                  <Line type="monotone" dataKey="totalCases" stroke="#3b82f6" strokeWidth={2} dot={false} name="Total Cases" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="card p-5">
            <h3 className="mb-3 font-semibold">Disease Distribution</h3>
            <div className="h-72">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={trends.diseaseDistribution || []} dataKey="cases" nameKey="disease" outerRadius={95} label>
                    {(trends.diseaseDistribution || []).map((entry, index) => (
                      <Cell key={entry.disease} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatNumber(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </article>
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <article className="card p-5">
            <h3 className="mb-3 font-semibold">Age Risk Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={trends.ageRisk || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="ageGroup" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="riskIndex" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="card p-5 xl:col-span-2">
            <h3 className="mb-3 font-semibold">Trend Comparison: Current vs Predicted (7d)</h3>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={trendComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="region" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="currentActive" stroke="#10b981" strokeWidth={2} name="Current Active" />
                  <Line type="monotone" dataKey="predictedActive7d" stroke="#ef4444" strokeWidth={2} name="Predicted Active (7d)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </article>
        </section>

        <section className="grid gap-4 xl:grid-cols-5">
          <article className="card p-5 xl:col-span-3">
            <h3 className="mb-3 font-semibold">Interactive Risk Map</h3>
            <div className="h-80 overflow-hidden rounded-xl border border-slate-300">
              <MapContainer center={[22.9734, 78.6569]} zoom={5} scrollWheelZoom className="h-full w-full">
                <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {regions.filter((region) => region.lat && region.lng).map((region) => (
                  <CircleMarker
                    key={region.region}
                    center={[region.lat, region.lng]}
                    radius={Math.max(6, Math.min(24, region.riskScore / 4))}
                    pathOptions={{ color: mapColor(region.riskLevel), fillOpacity: 0.6 }}
                    eventHandlers={{ click: () => setSelectedRegion(region) }}
                  >
                    <Popup>
                      <div className="space-y-1 text-xs">
                        <p className="font-semibold">{region.region}</p>
                        <p>Risk Score: {region.riskScore}</p>
                        <p>Active Cases: {formatNumber(region.activeCases)}</p>
                        <p>Humidity: {region.humidity ?? 'NA'}%</p>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            </div>
          </article>

          <article className="card p-5 xl:col-span-2">
            <h3 className="mb-3 font-semibold">Selected Region Intelligence</h3>
            {selectedRegion ? (
              <div className="space-y-2 text-sm">
                <div className={`rounded-xl border p-3 ${levelClass(selectedRegion.riskLevel)}`}>
                  <p className="font-semibold">{selectedRegion.region}</p>
                  <p>Risk Score: {selectedRegion.riskScore}</p>
                  <p>AQI: {selectedRegion.aqi ?? 'N/A'} · Humidity: {selectedRegion.humidity ?? 'N/A'}%</p>
                  <p>Active Cases: {formatNumber(selectedRegion.activeCases)}</p>
                </div>
                {geoAlert ? (
                  <div className={`rounded-xl border p-3 ${levelClass(geoAlert.severity)}`}>
                    <p className="font-semibold">Geo Alert</p>
                    <p>{geoAlert.disease} detected in {geoAlert.region}.</p>
                    <p className="text-xs">{new Date(geoAlert.timestamp).toLocaleString()}</p>
                  </div>
                ) : (
                  <div className={`rounded-xl border p-3 border-emerald-100 bg-emerald-50/30 text-slate-600`}>
                    <p>No region-specific alert currently mapped to the selected location.</p>
                  </div>
                )}
              </div>
            ) : <p>Select a region marker to inspect details.</p>}
          </article>
        </section>

        <section className="grid gap-4 xl:grid-cols-5">
          <article className="card p-5 xl:col-span-3">
            <h3 className="mb-3 font-semibold">Live Outbreak Feed</h3>
            <div className="max-h-72 space-y-2 overflow-auto pr-1">
              {alerts.map((alert, idx) => (
                <div key={`${alert.region}-${alert.disease}-${idx}`} className={`rounded-xl border p-3 ${levelClass(alert.severity)}`}>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{alert.disease} · {alert.region}</p>
                    <p className="text-xs uppercase">{alert.severity}</p>
                  </div>
                  <p className="text-xs">{new Date(alert.timestamp).toLocaleString()} · Source: {alert.source}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="card p-5 xl:col-span-2">
            <h3 className="mb-3 font-semibold">AI Insights & Predictions</h3>
            <div className="space-y-2">
              {asArray(dashboard.insights).map((insight, idx) => (
                <div key={`${insight.type}-${idx}`} className={`rounded-xl border p-3 border-blue-200 bg-blue-50 text-blue-800`}>
                  <p className="text-sm">{insight.message}</p>
                  <p className="text-xs font-semibold">Confidence: {insight.confidence}%</p>
                </div>
              ))}
              <div className={`rounded-xl border p-3 border-emerald-100 bg-emerald-50/30`}>
                <p className="text-xs">Prediction Coverage: {predictions.length} regions · Data Sources: {(dashboard.dataSources || []).join(', ')}</p>
              </div>
            </div>
          </article>
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <article className="card p-5">
            <h3 className="mb-3 flex items-center gap-2 font-semibold"><Waves size={16} /> Simulation Mode</h3>
            <label className="mb-1 block text-sm">Humidity Adjustment: {humidityDelta >= 0 ? '+' : ''}{humidityDelta}%</label>
            <input type="range" min="-20" max="20" value={humidityDelta} onChange={(e) => setHumidityDelta(Number(e.target.value))} className="w-full" />
            <label className="mb-1 mt-3 block text-sm">Cases Multiplier: x{casesMultiplier.toFixed(2)}</label>
            <input type="range" min="0.5" max="3" step="0.05" value={casesMultiplier} onChange={(e) => setCasesMultiplier(Number(e.target.value))} className="w-full" />
            <label className="mb-1 mt-3 block text-sm">Vaccination Increase: {vaccinationRate}%</label>
            <input type="range" min="0" max="60" step="1" value={vaccinationRate} onChange={(e) => setVaccinationRate(Number(e.target.value))} className="w-full" />
            <button onClick={runSimulation} className="mt-3 w-full rounded-xl px-3 py-2 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-400 transition-colors">
              Run What-if Scenario
            </button>
          </article>

          <article className="card p-5">
            <h3 className="mb-3 font-semibold">Historical Replay Mode</h3>
            <input
              type="range"
              min="0"
              max={Math.max(0, trendSeries.length - 1)}
              value={historicalIndex}
              onChange={(e) => setHistoricalIndex(Number(e.target.value))}
              className="w-full"
            />
            {selectedSnapshot && (
              <div className={`mt-3 rounded-xl border p-3 text-sm border-emerald-100 bg-emerald-50/30`}>
                <p className="font-semibold">{selectedSnapshot.date}</p>
                <p>Total Cases: {formatNumber(selectedSnapshot.totalCases)}</p>
                <p>New Cases: {formatNumber(selectedSnapshot.newCases)}</p>
              </div>
            )}
          </article>

          <article className="card p-5">
            <h3 className="mb-3 font-semibold">Scenario Comparison (A vs B)</h3>
            {scenarioComparison ? (
              <div className="space-y-2 text-xs">
                <p>Scenario A: Humidity {scenarioComparison.scenarioA?.config?.humidityDelta}% | Cases x{scenarioComparison.scenarioA?.config?.casesMultiplier}</p>
                <p>Scenario B: Humidity {scenarioComparison.scenarioB?.config?.humidityDelta}% | Cases x{scenarioComparison.scenarioB?.config?.casesMultiplier}</p>
                <p>Top Region A: {scenarioComparison.scenarioA?.predictions?.[0]?.region || 'N/A'} ({scenarioComparison.scenarioA?.predictions?.[0]?.predictedActiveCases7d || 0})</p>
                <p>Top Region B: {scenarioComparison.scenarioB?.predictions?.[0]?.region || 'N/A'} ({scenarioComparison.scenarioB?.predictions?.[0]?.predictedActiveCases7d || 0})</p>
              </div>
            ) : <p className="text-sm text-slate-500">Run simulation to compare baseline vs intervention scenario.</p>}
          </article>

          <article className="card p-5">
            <h3 className="mb-3 font-semibold">Hospital Load Estimator</h3>
            <div className="max-h-40 space-y-2 overflow-auto text-sm">
              {hospitalLoad.slice(0, 5).map((row) => (
                <div key={row.region} className={`rounded-lg border p-2 border-emerald-100 bg-emerald-50/30`}>
                  <p className="font-semibold">{row.region}</p>
                  <p>Admissions: {formatNumber(row.predictedAdmissions)} · ICU: {formatNumber(row.icuDemand)}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <article className="card p-5">
            <h3 className="mb-3 font-semibold">Early Warning Signals</h3>
            <div className="space-y-2 text-sm">{asArray(dashboard.earlyWarnings).slice(0, 4).map((w, i) => (
              <div key={`${w.region}-${i}`} className={`rounded-lg border p-2 border-amber-200 bg-amber-50`}>
                <p className="font-semibold">{w.region}</p>
                <p>{w.message}</p>
                <p className="text-xs">Confidence {w.confidence}%</p>
              </div>
            ))}{!asArray(dashboard.earlyWarnings).length && <p>No pre-risk warning detected.</p>}</div>
          </article>

          <article className="card p-5">
            <h3 className="mb-3 font-semibold">City Risk Ranking</h3>
            <div className="space-y-2 text-sm">{asArray(dashboard.cityRiskRanking).slice(0, 5).map((row) => (
              <div key={row.region} className="flex items-center justify-between rounded-lg border p-2">
                <p>#{row.rank} {row.region}</p><p>{row.riskScore}</p>
              </div>
            ))}</div>
          </article>

          <article className="card p-5">
            <h3 className="mb-3 font-semibold">Decision & Resource Mode</h3>
            <div className="space-y-2 text-xs">{asArray(dashboard.decisionMode).slice(0, 3).map((d, idx) => <div key={`${d.region}-${idx}`} className="rounded-lg border p-2">{d.region}: {d.policy}</div>)}
            {asArray(dashboard.resourceAllocation).slice(0, 2).map((r) => <div key={r.region} className="rounded-lg border p-2">{r.region} → Doctors {r.doctorsToDeploy}, Kits {r.testKits}</div>)}
            </div>
          </article>
        </section>

        {/* ── Global Health Intelligence Panel ── */}
        {globalHealth && (
          <section className={`rounded-2xl border p-5 shadow-sm border-emerald-100/50 bg-white`}>
            <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold"><Globe size={18} /> Global Health Intelligence</h3>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {/* COVID Global Summary */}
              {globalHealth.globalCovid && (
                <div className={`rounded-xl border p-4 border-emerald-100 bg-emerald-50/30`}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">Global COVID-19</p>
                  <p className="mt-1 text-xl font-bold">{formatNumber(globalHealth.globalCovid.totalCases)}</p>
                  <p className="text-xs">Active: {formatNumber(globalHealth.globalCovid.active)} | Deaths: {formatNumber(globalHealth.globalCovid.deaths)}</p>
                  <p className="text-xs">Today: +{formatNumber(globalHealth.globalCovid.todayCases)} cases</p>
                  <p className="mt-1 text-[10px] text-slate-400">{globalHealth.globalCovid.affectedCountries} countries affected</p>
                </div>
              )}
              {/* India COVID */}
              {globalHealth.indiaCovid && (
                <div className={`rounded-xl border p-4 border-emerald-100 bg-emerald-50/30`}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-500">India COVID-19</p>
                  <p className="mt-1 text-xl font-bold">{formatNumber(globalHealth.indiaCovid.cases)}</p>
                  <p className="text-xs">Active: {formatNumber(globalHealth.indiaCovid.active)} | Deaths: {formatNumber(globalHealth.indiaCovid.deaths)}</p>
                  <p className="text-xs">Cases/M: {formatNumber(globalHealth.indiaCovid.casesPerMillion)}</p>
                  <p className="mt-1 text-[10px] text-slate-400">Pop: {formatNumber(globalHealth.indiaCovid.population)}</p>
                </div>
              )}
              {/* Environmental Health */}
              {globalHealth.environmentalHealth && (
                <div className={`rounded-xl border p-4 border-emerald-100 bg-emerald-50/30`}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-500"><Thermometer size={12} className="inline" /> Environmental</p>
                  <p className="mt-1 text-xl font-bold">{globalHealth.environmentalHealth.current?.temperature || '--'}°C</p>
                  <p className="text-xs">Humidity: {globalHealth.environmentalHealth.current?.humidity || '--'}%</p>
                  <p className="text-xs">Wind: {globalHealth.environmentalHealth.current?.windSpeed || '--'} km/h</p>
                  <p className="text-xs">UV: {globalHealth.environmentalHealth.current?.uvIndex || '--'}</p>
                  <p className="mt-1 text-[10px] text-slate-400">Source: Open-Meteo</p>
                </div>
              )}
              {/* WHO Indicators Summary */}
              {globalHealth.whoIndicators && (
                <div className={`rounded-xl border p-4 border-emerald-100 bg-emerald-50/30`}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-purple-500">WHO Indicators (India)</p>
                  <div className="mt-2 space-y-1">
                    {globalHealth.whoIndicators.indicators.slice(0, 4).map((ind) => (
                      <p key={ind.code} className="text-xs">
                        {ind.code}: <span className="font-semibold">{ind.values[0]?.value ?? 'N/A'}</span>
                        <span className="text-slate-400"> ({ind.values[0]?.year})</span>
                      </p>
                    ))}
                  </div>
                  <p className="mt-1 text-[10px] text-slate-400">{globalHealth.whoIndicators.indicators.length} indicators tracked</p>
                </div>
              )}
            </div>

            {/* World Bank + CDC Row */}
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {/* World Bank Health */}
              {globalHealth.worldBankHealth && (
                <div className={`rounded-xl border p-4 border-emerald-100 bg-emerald-50/30`}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-500">World Bank Health (India)</p>
                  <div className="mt-2 space-y-1">
                    {globalHealth.worldBankHealth.indicators.map((ind) => (
                      <div key={ind.code} className="flex items-center justify-between text-xs">
                        <span>{ind.label}</span>
                        <span className="font-semibold">{ind.entries[0]?.value != null ? Number(ind.entries[0].value).toFixed(1) : 'N/A'} <span className="text-slate-400">({ind.entries[0]?.year})</span></span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* CDC Resources */}
              {globalHealth.cdcResources && (
                <div className={`rounded-xl border p-4 border-emerald-100 bg-emerald-50/30`}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-rose-500">CDC Health Resources</p>
                  <div className="mt-2 max-h-36 space-y-1 overflow-auto">
                    {globalHealth.cdcResources.resources.slice(0, 5).map((r) => (
                      <div key={r.id} className="text-xs">
                        <p className="font-semibold">{r.name}</p>
                        <p className="text-slate-400 line-clamp-1">{r.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Top Affected Countries */}
              {globalHealth.topCountries && (
                <div className={`rounded-xl border p-4 border-emerald-100 bg-emerald-50/30`}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-cyan-500">Top Affected Countries</p>
                  <div className="mt-2 max-h-36 space-y-1 overflow-auto">
                    {globalHealth.topCountries.countries.slice(0, 8).map((c, i) => (
                      <div key={c.country} className="flex items-center justify-between text-xs">
                        <span>#{i + 1} {c.country}</span>
                        <span className="font-semibold">{formatNumber(c.active)} active</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <p className={`mt-3 text-[10px] text-slate-400`}>Last updated: {new Date(globalHealth.lastUpdated).toLocaleString()} | Sources: {(globalHealth.activeSources || []).join(', ')}</p>
          </section>
        )}

        <section className="grid gap-4 xl:grid-cols-2">
          <article className="card p-5">
            <h3 className="mb-3 flex items-center gap-2 font-semibold"><Bot size={16} /> Health Assistant Chatbot</h3>
            <div className="flex gap-2">
              <input
                value={chatPrompt}
                onChange={(e) => setChatPrompt(e.target.value)}
                className="input-field"
                placeholder="Ask about outbreaks, risks, or precautions"
              />
              <button onClick={askAssistant} className="btn-primary">Ask</button>
            </div>
            {chatReply && <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50/30 p-3 text-sm">{chatReply}</div>}
          </article>

          <article className="card p-5">
            <h3 className="mb-3 flex items-center gap-2 font-semibold"><Brain size={16} /> Prediction Feed</h3>
            <div className="max-h-48 space-y-2 overflow-auto text-sm">
              {predictions.map((prediction) => (
                <div key={prediction.region} className={`rounded-xl border p-3 ${levelClass(prediction.level)}`}>
                  <p className="font-semibold">{prediction.region} · {prediction.disease}</p>
                  <p>Predicted Active (7d): {formatNumber(prediction.predictedActiveCases7d)}</p>
                  <p>Confidence: {prediction.confidence}%</p>
                </div>
              ))}
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="skeleton h-28 rounded-2xl" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, idx) => <div key={idx} className="skeleton h-24 rounded-2xl" />)}
      </div>
      <div className="skeleton h-80 rounded-2xl" />
    </div>
  );
}
