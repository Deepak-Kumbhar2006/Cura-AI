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
  Moon,
  ShieldAlert,
  Sun,
  Waves,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const PIE_COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6'];

const numberFormat = new Intl.NumberFormat('en-IN');

function formatNumber(value) {
  return numberFormat.format(Number(value || 0));
}

function levelClass(level, darkMode) {
  if (level === 'high') return darkMode ? 'bg-red-950/40 text-red-200 border-red-700' : 'bg-red-50 text-red-700 border-red-200';
  if (level === 'medium') return darkMode ? 'bg-amber-950/40 text-amber-200 border-amber-700' : 'bg-amber-50 text-amber-700 border-amber-200';
  return darkMode ? 'bg-emerald-950/40 text-emerald-200 border-emerald-700' : 'bg-emerald-50 text-emerald-700 border-emerald-200';
}

function mapColor(level) {
  if (level === 'high') return '#ef4444';
  if (level === 'medium') return '#f59e0b';
  return '#22c55e';
}

function toDailyTrend(series = []) {
  const sorted = [...series].sort((a, b) => a.date.localeCompare(b.date));
  const windowed = sorted.slice(-45);
  return windowed.map((item, index) => {
    const prev = windowed[index - 1];
    return {
      date: item.date,
      dateShort: item.date.slice(5),
      totalCases: item.cases,
      newCases: prev ? Math.max(0, item.cases - prev.cases) : 0,
    };
  });
}

export default function DoctorDashboard() {
  const [darkMode, setDarkMode] = useState(false);
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
  const [chatPrompt, setChatPrompt] = useState('');
  const [chatReply, setChatReply] = useState('');

  const loadAll = async ({ silent = false, customHumidityDelta = humidityDelta } = {}) => {
    if (!silent) setLoading(true);
    try {
      const [dashRes, regionRes, alertRes, trendRes, envRes, predictionRes] = await Promise.all([
        api.get('/api/dashboard'),
        api.get('/api/regions'),
        api.get('/api/alerts'),
        api.get('/api/trends'),
        api.get('/api/environment'),
        api.get('/api/predictions', { params: { humidityDelta: customHumidityDelta } }),
      ]);

      setDashboard(dashRes.data);
      setRegions(regionRes.data.regions || []);
      setAlerts(alertRes.data.alerts || []);
      setTrends(trendRes.data);
      setEnvironment(envRes.data.environment || []);
      setPredictions(predictionRes.data.predictions || []);
      setHospitalLoad(predictionRes.data.hospitalLoadEstimator || []);
      if (!selectedRegion && regionRes.data.regions?.length) setSelectedRegion(regionRes.data.regions[0]);
    } catch (_error) {
      toast.error('Unable to fetch live surveillance signals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    const interval = setInterval(() => loadAll({ silent: true }), 45000);
    return () => clearInterval(interval);
  }, []);

  const trendSeries = useMemo(() => toDailyTrend(trends?.cases || []), [trends]);

  useEffect(() => {
    if (!trendSeries.length) return;
    setHistoricalIndex(trendSeries.length - 1);
  }, [trendSeries.length]);

  const selectedSnapshot = trendSeries[historicalIndex] || null;
  const trendComparisonData = trends?.trendComparison || [];

  const geoAlert = useMemo(() => {
    if (!selectedRegion) return null;
    return alerts.find((alert) => alert.region === selectedRegion.region) || null;
  }, [alerts, selectedRegion]);

  const runSimulation = async () => {
    await loadAll({ customHumidityDelta: humidityDelta });
    toast.success(`Simulation executed with humidity delta ${humidityDelta >= 0 ? '+' : ''}${humidityDelta}%`);
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

  if (loading || !dashboard || !trends) return <DashboardSkeleton darkMode={darkMode} setDarkMode={setDarkMode} />;

  const highRiskCount = regions.filter((region) => region.riskLevel === 'high').length;

  return (
    <div className={`min-h-screen rounded-3xl p-4 md:p-6 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'}`}>
      <div className="mx-auto max-w-7xl space-y-5">
        <section className={`rounded-2xl border p-5 shadow-sm ${darkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Cura-AI Command Center</p>
              <h1 className="text-2xl font-bold">Government-Grade Health Surveillance Dashboard</h1>
              <p className={`mt-1 text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Data fusion from WHO GHO, data.gov.in, disease.sh, Open-Meteo, AQICN and IDSP feeds.
              </p>
              <p className={`mt-2 text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Last Updated: {new Date(dashboard.lastUpdated).toLocaleString()} · Auto-refresh every 45 seconds
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDarkMode((prev) => !prev)}
                className={`rounded-xl border px-3 py-2 text-sm transition ${darkMode ? 'border-slate-600 bg-slate-800 hover:bg-slate-700' : 'border-slate-300 bg-white hover:bg-slate-100'}`}
              >
                <span className="flex items-center gap-2">{darkMode ? <Sun size={16} /> : <Moon size={16} />}{darkMode ? 'Light' : 'Dark'} Mode</span>
              </button>
              <button
                onClick={exportReport}
                className={`rounded-xl px-3 py-2 text-sm font-semibold text-white transition ${darkMode ? 'bg-blue-600 hover:bg-blue-500' : 'bg-blue-700 hover:bg-blue-600'}`}
              >
                <span className="flex items-center gap-2"><Download size={16} /> Export Report</span>
              </button>
            </div>
          </div>
        </section>

        {highRiskCount > 0 && (
          <section className={`rounded-2xl border p-4 ${darkMode ? 'border-red-800 bg-red-950/40 text-red-100' : 'border-red-200 bg-red-50 text-red-700'}`}>
            <p className="flex items-center gap-2 font-semibold"><ShieldAlert size={18} /> Smart Alert: {highRiskCount} regions are currently in high-risk status.</p>
          </section>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {[
            ['Total Cases', formatNumber(dashboard.totalCases)],
            ['Active Cases', formatNumber(dashboard.activeCases)],
            ['High Risk Regions', formatNumber(dashboard.highRiskRegions)],
            ['Alerts Today', formatNumber(dashboard.alertsToday)],
            ['AI Confidence', `${dashboard.aiConfidence}%`],
          ].map(([title, value], idx) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className={`rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${darkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}
            >
              <p className={`text-xs uppercase tracking-wide ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{title}</p>
              <p className="mt-2 text-3xl font-semibold">{value}</p>
            </motion.div>
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <article className={`rounded-2xl border p-4 shadow-sm xl:col-span-2 ${darkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            <h3 className="mb-3 font-semibold">Real-time Case Trend</h3>
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={trendSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
                  <XAxis dataKey="dateShort" stroke={darkMode ? '#cbd5e1' : '#334155'} />
                  <YAxis stroke={darkMode ? '#cbd5e1' : '#334155'} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="newCases" stroke="#ef4444" strokeWidth={2} dot={false} name="New Cases" />
                  <Line type="monotone" dataKey="totalCases" stroke="#3b82f6" strokeWidth={2} dot={false} name="Total Cases" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className={`rounded-2xl border p-4 shadow-sm ${darkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
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
          <article className={`rounded-2xl border p-4 shadow-sm ${darkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            <h3 className="mb-3 font-semibold">Age Risk Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={trends.ageRisk || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
                  <XAxis dataKey="ageGroup" stroke={darkMode ? '#cbd5e1' : '#334155'} />
                  <YAxis stroke={darkMode ? '#cbd5e1' : '#334155'} />
                  <Tooltip />
                  <Bar dataKey="riskIndex" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className={`rounded-2xl border p-4 shadow-sm xl:col-span-2 ${darkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            <h3 className="mb-3 font-semibold">Trend Comparison: Current vs Predicted (7d)</h3>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={trendComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#334155' : '#e2e8f0'} />
                  <XAxis dataKey="region" stroke={darkMode ? '#cbd5e1' : '#334155'} />
                  <YAxis stroke={darkMode ? '#cbd5e1' : '#334155'} />
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
          <article className={`rounded-2xl border p-4 shadow-sm xl:col-span-3 ${darkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
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

          <article className={`rounded-2xl border p-4 shadow-sm xl:col-span-2 ${darkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            <h3 className="mb-3 font-semibold">Selected Region Intelligence</h3>
            {selectedRegion ? (
              <div className="space-y-2 text-sm">
                <div className={`rounded-xl border p-3 ${levelClass(selectedRegion.riskLevel, darkMode)}`}>
                  <p className="font-semibold">{selectedRegion.region}</p>
                  <p>Risk Score: {selectedRegion.riskScore}</p>
                  <p>AQI: {selectedRegion.aqi ?? 'N/A'} · Humidity: {selectedRegion.humidity ?? 'N/A'}%</p>
                  <p>Active Cases: {formatNumber(selectedRegion.activeCases)}</p>
                </div>
                {geoAlert ? (
                  <div className={`rounded-xl border p-3 ${levelClass(geoAlert.severity, darkMode)}`}>
                    <p className="font-semibold">Geo Alert</p>
                    <p>{geoAlert.disease} detected in {geoAlert.region}.</p>
                    <p className="text-xs">{new Date(geoAlert.timestamp).toLocaleString()}</p>
                  </div>
                ) : (
                  <div className={`rounded-xl border p-3 ${darkMode ? 'border-slate-700 bg-slate-800 text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                    <p>No region-specific alert currently mapped to the selected location.</p>
                  </div>
                )}
              </div>
            ) : <p>Select a region marker to inspect details.</p>}
          </article>
        </section>

        <section className="grid gap-4 xl:grid-cols-5">
          <article className={`rounded-2xl border p-4 shadow-sm xl:col-span-3 ${darkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            <h3 className="mb-3 font-semibold">Live Outbreak Feed</h3>
            <div className="max-h-72 space-y-2 overflow-auto pr-1">
              {alerts.map((alert, idx) => (
                <div key={`${alert.region}-${alert.disease}-${idx}`} className={`rounded-xl border p-3 ${levelClass(alert.severity, darkMode)}`}>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{alert.disease} · {alert.region}</p>
                    <p className="text-xs uppercase">{alert.severity}</p>
                  </div>
                  <p className="text-xs">{new Date(alert.timestamp).toLocaleString()} · Source: {alert.source}</p>
                </div>
              ))}
            </div>
          </article>

          <article className={`rounded-2xl border p-4 shadow-sm xl:col-span-2 ${darkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            <h3 className="mb-3 font-semibold">AI Insights & Predictions</h3>
            <div className="space-y-2">
              {dashboard.insights.map((insight, idx) => (
                <div key={`${insight.type}-${idx}`} className={`rounded-xl border p-3 ${darkMode ? 'border-blue-900 bg-blue-950/40 text-blue-100' : 'border-blue-200 bg-blue-50 text-blue-800'}`}>
                  <p className="text-sm">{insight.message}</p>
                  <p className="text-xs font-semibold">Confidence: {insight.confidence}%</p>
                </div>
              ))}
              <div className={`rounded-xl border p-3 ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'}`}>
                <p className="text-xs">Prediction Coverage: {predictions.length} regions · Data Sources: {(dashboard.dataSources || []).join(', ')}</p>
              </div>
            </div>
          </article>
        </section>

        <section className="grid gap-4 xl:grid-cols-3">
          <article className={`rounded-2xl border p-4 shadow-sm ${darkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            <h3 className="mb-3 flex items-center gap-2 font-semibold"><Waves size={16} /> Simulation Mode</h3>
            <label className="mb-1 block text-sm">Humidity Adjustment: {humidityDelta >= 0 ? '+' : ''}{humidityDelta}%</label>
            <input type="range" min="-20" max="20" value={humidityDelta} onChange={(e) => setHumidityDelta(Number(e.target.value))} className="w-full" />
            <button onClick={runSimulation} className={`mt-3 w-full rounded-xl px-3 py-2 text-sm font-semibold text-white ${darkMode ? 'bg-amber-600 hover:bg-amber-500' : 'bg-amber-500 hover:bg-amber-400'}`}>
              Run What-if Scenario
            </button>
          </article>

          <article className={`rounded-2xl border p-4 shadow-sm ${darkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
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
              <div className={`mt-3 rounded-xl border p-3 text-sm ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'}`}>
                <p className="font-semibold">{selectedSnapshot.date}</p>
                <p>Total Cases: {formatNumber(selectedSnapshot.totalCases)}</p>
                <p>New Cases: {formatNumber(selectedSnapshot.newCases)}</p>
              </div>
            )}
          </article>

          <article className={`rounded-2xl border p-4 shadow-sm ${darkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            <h3 className="mb-3 font-semibold">Hospital Load Estimator</h3>
            <div className="max-h-40 space-y-2 overflow-auto text-sm">
              {hospitalLoad.slice(0, 5).map((row) => (
                <div key={row.region} className={`rounded-lg border p-2 ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'}`}>
                  <p className="font-semibold">{row.region}</p>
                  <p>Admissions: {formatNumber(row.predictedAdmissions)} · ICU: {formatNumber(row.icuDemand)}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <article className={`rounded-2xl border p-4 shadow-sm ${darkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            <h3 className="mb-3 flex items-center gap-2 font-semibold"><Bot size={16} /> Health Assistant Chatbot</h3>
            <div className="flex gap-2">
              <input
                value={chatPrompt}
                onChange={(e) => setChatPrompt(e.target.value)}
                className={`flex-1 rounded-xl border px-3 py-2 text-sm ${darkMode ? 'border-slate-600 bg-slate-800 text-slate-100' : 'border-slate-300 bg-white text-slate-900'}`}
                placeholder="Ask about outbreaks, risks, or precautions"
              />
              <button onClick={askAssistant} className={`rounded-xl px-3 py-2 text-sm font-semibold text-white ${darkMode ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-emerald-700 hover:bg-emerald-600'}`}>Ask</button>
            </div>
            {chatReply && <div className={`mt-3 rounded-xl border p-3 text-sm ${darkMode ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-slate-50'}`}>{chatReply}</div>}
          </article>

          <article className={`rounded-2xl border p-4 shadow-sm ${darkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            <h3 className="mb-3 flex items-center gap-2 font-semibold"><Brain size={16} /> Prediction Feed</h3>
            <div className="max-h-48 space-y-2 overflow-auto text-sm">
              {predictions.map((prediction) => (
                <div key={prediction.region} className={`rounded-xl border p-3 ${levelClass(prediction.level, darkMode)}`}>
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

function DashboardSkeleton({ darkMode, setDarkMode }) {
  return (
    <div className={`space-y-4 rounded-3xl p-5 ${darkMode ? 'bg-slate-950' : 'bg-slate-100'}`}>
      <div className="flex justify-end">
        <button
          onClick={() => setDarkMode((prev) => !prev)}
          className={`rounded-xl border px-3 py-2 text-sm ${darkMode ? 'border-slate-600 bg-slate-800 text-slate-100' : 'border-slate-300 bg-white text-slate-800'}`}
        >
          Toggle Theme
        </button>
      </div>
      <div className="h-24 animate-pulse rounded-2xl bg-slate-300" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, idx) => <div key={idx} className="h-28 animate-pulse rounded-2xl bg-slate-300" />)}
      </div>
      <div className="h-96 animate-pulse rounded-2xl bg-slate-300" />
    </div>
  );
}
