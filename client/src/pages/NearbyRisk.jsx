import { useEffect, useMemo, useState } from 'react';
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
    <div className="bg-white rounded-2xl border p-4 h-[680px]">
      <h2 className="text-2xl font-bold mb-2">Nearby Risk & Trending Disease Map</h2>
      <p className="text-sm text-slate-600 mb-3">Live location + real-time disease intelligence from Open-Meteo, GDELT, and CDC signals.</p>
      {error && <p className="text-sm text-rose-600 mb-2">{error}</p>}

      <div className="grid md:grid-cols-3 gap-2 mb-3 text-sm">
        <div className="bg-emerald-50 rounded-xl p-2">Area: <b>{trendPayload?.location || locationName}</b></div>
        <div className="bg-emerald-50 rounded-xl p-2">Temp: <b>{trendPayload?.weather?.temperature ?? '--'}°C</b></div>
        <div className="bg-emerald-50 rounded-xl p-2">Humidity: <b>{trendPayload?.weather?.humidity ?? '--'}%</b></div>
      </div>

      <MapContainer center={center} zoom={8} className="h-[470px] rounded-xl">
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
  );
}
