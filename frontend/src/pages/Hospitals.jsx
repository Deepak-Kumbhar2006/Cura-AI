import { useEffect, useState } from "react";
import API from "../services/api";

function buildFallbackHospitals(lat, lon) {
    return [
        { id: "local-1", name: "City Care Hospital", lat: lat + 0.008, lon: lon + 0.006, phone: "+919876543210", type: "General Hospital", address: "Nearby City Center" },
        { id: "local-2", name: "Lifeline Emergency", lat: lat - 0.01, lon: lon + 0.005, phone: "+919900112233", type: "Emergency Care", address: "Main Road" },
        { id: "local-3", name: "Community Health Clinic", lat: lat + 0.012, lon: lon - 0.009, phone: "", type: "Clinic", address: "Sector Medical Block" },
    ];
}

function distanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
}

export default function Hospitals() {
    const [position, setPosition] = useState(null);
    const [hospitals, setHospitals] = useState([]);
    const [geoError, setGeoError] = useState("");
    const [fetchError, setFetchError] = useState("");

    const resolveLocation = async () => {
        navigator.geolocation.getCurrentPosition(
            ({ coords: { latitude, longitude } }) => {
                setGeoError("");
                setPosition([latitude, longitude]);
            },
            async () => {
                setPosition([20.5937, 78.9629]);
                setGeoError("Location access denied. Showing hospitals near a default location.");
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    useEffect(() => {
        resolveLocation();
    }, []);

    useEffect(() => {
        if (!position) return;
        const [lat, lon] = position;

        async function fetchHospitals() {
            try {
                setFetchError("");
                const { data } = await API.get("/api/hospitals/nearby", {
                    params: { lat, lon },
                });
                const normalized = (data?.hospitals || []).map((h, idx) => ({
                    id: h.id || `h-${idx}`,
                    name: h.name || "Nearby Hospital",
                    lat: h.lat,
                    lon: h.lon,
                    phone: h.phone || "",
                    type: h.type || "Hospital",
                    address: h.address || "",
                    distanceKm: Number(distanceKm(lat, lon, h.lat, h.lon)),
                }));
                setHospitals(normalized.length ? normalized : buildFallbackHospitals(lat, lon));
            } catch {
                setFetchError("Could not load live hospitals. Showing fallback nearby options.");
                setHospitals(buildFallbackHospitals(lat, lon));
            }
        }

        fetchHospitals();
    }, [position]);

    if (!position) {
        return <div style={{ padding: 24 }}>Locating you…</div>;
    }

    const [lat, lon] = position;

    return (
        <div style={{ padding: 24 }}>
            <h2>Nearby Hospitals</h2>
            <p>Hospitals near your current location.</p>
            {geoError && <p style={{ color: "#dc2626" }}>{geoError}</p>}
            {fetchError && <p style={{ color: "#dc2626" }}>{fetchError}</p>}

            <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
                {hospitals.map((hospital) => (
                    <div key={hospital.id} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 12 }}>
                        <h3 style={{ margin: 0 }}>{hospital.name}</h3>
                        <p style={{ margin: "6px 0" }}>{hospital.type}</p>
                        <p style={{ margin: "6px 0" }}>{hospital.address || "Address unavailable"}</p>
                        <p style={{ margin: "6px 0" }}>
                            Distance: {distanceKm(lat, lon, hospital.lat, hospital.lon)} km
                        </p>
                        {hospital.phone && (
                            <a href={`tel:${hospital.phone}`} style={{ marginRight: 12 }}>
                                Call {hospital.phone}
                            </a>
                        )}
                        <a
                            href={`https://www.google.com/maps/search/?api=1&query=${hospital.lat},${hospital.lon}`}
                            target="_blank"
                            rel="noreferrer"
                        >
                            Open in Maps
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
}
