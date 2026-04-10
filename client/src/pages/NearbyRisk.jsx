import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Thermometer, Droplets } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup, Marker } from 'react-leaflet';
import api from '../services/api';

const color = { Low: 'green', Medium: 'orange', High: 'red' };

function offsetCoordinate(base, i) {
  const delta = 0.04 + i * 0.01;
  return [base[0] + delta, base[1] + delta];
}

export default function NearbyRisk() {
  const [records, setRecords] = useState([]);
  const [center, setCenter] = useState([18.52, 73.85]);
  const [locationName, setLocationName] = useState('Pune');
  const [trendPayload, setTrendPayload] = useState(null);
  const [error, setError] = useState('');

  const loadTrends = async (lat, lng, name = 'Current Location') => {
    const { data } = await api.get('/api/trends/local', {
      params: { lat, lng, location: name },
    });
    setTrendPayload(data);
  };

  useEffect(() => {
    api.get('/api/data/all').then((r) => setRecords(r.data)).catch(() => {});

    if (!navigator.geolocation) {
      loadTrends(center[0], center[1], locationName).catch(() => setError('Unable to load local trend intelligence.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCenter([lat, lng]);
        setLocationName('Current Location');
        loadTrends(lat, lng, 'Current Location').catch(() => setError('Unable to load local trend intelligence.'));
      },
      () => {
        loadTrends(center[0], center[1], locationName).catch(() => setError('Unable to load local trend intelligence.'));
      },
      { enableHighAccuracy: true, timeout: 7000 }
    );
  }, []);

  const trendMarkers = useMemo(() => {
    if (!trendPayload?.trends?.length) return [];
    return trendPayload.trends.slice(0, 3).map((item, i) => ({
      ...item,
      point: offsetCoordinate(center, i),
    }));
  }, [trendPayload, center]);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card p-5 h-[700px] flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-400 grid place-items-center">
          <MapPin size={20} className="text-white" />
        </div>
        <div>
          <h2 className="section-title">Disease Risk Map</h2>
          <p className="text-sm text-slate-500">Live location + real-time intelligence from Open-Meteo, GDELT, and CDC</p>
        </div>
      </div>

      {error && <p className="text-sm text-rose-600 mb-2">{error}</p>}

      <div className="grid md:grid-cols-3 gap-3 mb-4 text-sm">
        <div className="metric-card py-3 flex items-center gap-2">
          <MapPin size={16} className="text-emerald-500" />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400">Area</p>
            <p className="font-semibold text-slate-800">{trendPayload?.location || locationName}</p>
          </div>
        </div>
        <div className="metric-card py-3 flex items-center gap-2">
          <Thermometer size={16} className="text-rose-500" />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400">Temperature</p>
            <p className="font-semibold text-slate-800">{trendPayload?.weather?.temperature ?? '--'}°C</p>
          </div>
        </div>
        <div className="metric-card py-3 flex items-center gap-2">
          <Droplets size={16} className="text-blue-500" />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-400">Humidity</p>
            <p className="font-semibold text-slate-800">{trendPayload?.weather?.humidity ?? '--'}%</p>
          </div>
        </div>
      </div>

      <div className="flex-1 rounded-xl overflow-hidden border border-emerald-100">
        <MapContainer center={center} zoom={8} className="h-full w-full">
          <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          <Marker position={center}>
            <Popup>You are here ({locationName})</Popup>
          </Marker>

          {trendMarkers.map((t) => (
            <CircleMarker key={t.disease} center={t.point} radius={10} pathOptions={{ color: color[t.risk] || 'blue' }}>
              <Popup>
                <b>{t.disease.toUpperCase()}</b><br />
                Risk: {t.risk}<br />
                Score: {t.score}<br />
                {t.reason}
              </Popup>
            </CircleMarker>
          ))}

          {records.filter((r) => r.location?.lat && r.location?.lng).map((r) => (
            <CircleMarker key={r._id} center={[r.location.lat, r.location.lng]} radius={7} pathOptions={{ color: color[r.risk] || 'blue' }}>
              <Popup>{r.location.city}: {r.risk} ({r.probability})</Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </motion.div>
  );
}
