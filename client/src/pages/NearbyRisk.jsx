import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import api from '../services/api';

const color = { Low: 'green', Medium: 'orange', High: 'red' };

export default function NearbyRisk() {
  const [records, setRecords] = useState([]);
  useEffect(() => { api.get('/api/data/all').then((r) => setRecords(r.data)); }, []);

  return (
    <div className="bg-white rounded-2xl border p-4 h-[520px]">
      <h2 className="text-2xl font-bold mb-2">Nearby Risk Map</h2>
      <MapContainer center={[20, 78]} zoom={4} className="h-[450px] rounded-xl">
        <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {records.filter((r) => r.location?.lat && r.location?.lng).map((r) => (
          <CircleMarker key={r._id} center={[r.location.lat, r.location.lng]} radius={8} pathOptions={{ color: color[r.risk] || 'blue' }}>
            <Popup>{r.location.city}: {r.risk} ({r.probability})</Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
