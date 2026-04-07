import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { MapPin, Shield } from 'lucide-react';
import api from '../services/api';

const color = { Low: '#43A047', Medium: '#F59E0B', High: '#E53E3E' };
const riskBadge = { High: 'badge-danger', Medium: 'badge-warning', Low: 'badge-success' };

export default function NearbyRisk() {
  const [records, setRecords] = useState([]);
  useEffect(() => { api.get('/api/data/all').then((r) => setRecords(r.data)); }, []);

  const mapped = records.filter((r) => r.location?.lat && r.location?.lng);

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-white">Risk Map</h2>
          <p className="text-sm text-slate-500">{mapped.length} data points plotted across regions</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-danger-500" />High Risk</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-warning-500" />Medium</span>
          <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-primary-500" />Safe</span>
        </div>
      </div>

      <div className="card overflow-hidden" style={{ height: 520 }}>
        <MapContainer center={[20, 78]} zoom={5} className="h-full w-full" style={{ borderRadius: 16 }}>
          <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {mapped.map((r) => (
            <CircleMarker key={r._id} center={[r.location.lat, r.location.lng]} radius={10}
              pathOptions={{ color: color[r.risk] || '#3B82F6', fillColor: color[r.risk] || '#3B82F6', fillOpacity: 0.6, weight: 2 }}>
              <Popup>
                <div className="p-1">
                  <p className="font-semibold text-sm">{r.location.city}</p>
                  <p className="text-xs text-slate-500">{r.risk} Risk · {r.probability || 'N/A'}</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      {!mapped.length && (
        <div className="card p-12 text-center">
          <MapPin size={40} className="mx-auto mb-3 text-primary-300" />
          <p className="font-semibold text-slate-600 dark:text-slate-300">No Geo Data Available</p>
          <p className="text-sm text-slate-400 mt-1">Patient records with coordinates will appear on the map</p>
        </div>
      )}
    </div>
  );
}
