import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import api from '../services/api';

const colorByRisk = { Low: 'green', Medium: 'orange', High: 'red' };

export default function MapView() {
  const [records, setRecords] = useState([]);

  useEffect(() => {
    api.get('/api/data/all').then((res) => setRecords(res.data));
  }, []);

  return (
    <div className="bg-white rounded-xl shadow p-4 h-[520px]">
      <h2 className="text-2xl font-bold mb-4">Outbreak Zone Map</h2>
      <MapContainer center={[20, 78]} zoom={3} className="h-[440px] rounded">
        <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {records.filter((r) => r.location?.lat && r.location?.lng).map((record) => (
          <CircleMarker
            key={record._id}
            center={[record.location.lat, record.location.lng]}
            radius={10}
            pathOptions={{ color: colorByRisk[record.prediction?.risk] || 'blue' }}
          >
            <Popup>
              <strong>{record.location.city}</strong><br />
              Risk: {record.prediction?.risk}<br />
              Probability: {record.prediction?.probability}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
