import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import API from "../services/api";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

const userIcon = new L.Icon({
    iconUrl: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
    iconSize: [36, 36],
});

const hospitalIcon = new L.Icon({
    iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
    iconSize: [32, 32],
});

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
    const [selected, setSelected] = useState(null);
    const [calling, setCalling] = useState(false);
    const [loadingHospitals, setLoadingHospitals] = useState(false);
    const [geoError, setGeoError] = useState("");
    const [fetchError, setFetchError] = useState("");

    const resolveLocation = async () => {
        navigator.geolocation.getCurrentPosition(
            ({ coords: { latitude, longitude } }) => {
                setGeoError("");
                setPosition([latitude, longitude]);
            },
            async () => {
                try {
                    const fallbackRes = await fetch("https://ipapi.co/json/");
                    const fallbackData = await fallbackRes.json();
                    if (fallbackData?.latitude && fallbackData?.longitude) {
                        setPosition([fallbackData.latitude, fallbackData.longitude]);
                        setGeoError("Using approximate location (IP based). Enable GPS for more accurate results.");
                        return;
                    }
                } catch {
                    // ignore and use static fallback
                }
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
                setLoadingHospitals(true);
                const { data } = await API.get("/api/hospitals/nearby", {
                    params: { lat, lon },
                });
                const normalized = (data?.hospitals || [])
                    .filter((h) => typeof h.lat === "number" && typeof h.lon === "number")
                    .map((h, idx) => ({
                        id: h.id || `h-${idx}`,
                        name: h.name || "Nearby Hospital",
                        lat: h.lat,
                        lon: h.lon,
                        phone: h.phone || "",
                        type: h.type || "Hospital",
                        address: h.address || "",
                        distanceKm: typeof h.distanceKm === "number"
                            ? h.distanceKm
                            : Number(distanceKm(lat, lon, h.lat, h.lon)),
                    }))
                    .sort((a, b) => a.distanceKm - b.distanceKm);
                setHospitals(normalized.length ? normalized : buildFallbackHospitals(lat, lon).map((h) => ({
                    ...h,
                    distanceKm: Number(distanceKm(lat, lon, h.lat, h.lon)),
                })));
            } catch {
                const localFallback = buildFallbackHospitals(lat, lon).map((h) => ({
                    ...h,
                    distanceKm: Number(distanceKm(lat, lon, h.lat, h.lon)),
                }));
                setHospitals(localFallback);
                setFetchError("Could not load live hospitals. Showing fallback nearby options.");
            } finally {
                setLoadingHospitals(false);
            }
        }
        fetchHospitals();
    }, [position]);

    function callHospital(hospital) {
        if (!hospital.phone) return;
        setCalling(hospital.id);
        setTimeout(() => {
            window.location.href = `tel:${hospital.phone}`;
            setCalling(false);
        }, 400);
    }

    function handleEmergency() {
        if (!hospitals.length) {
            window.location.href = "tel:112";
            return;
        }
        const firstCallable = hospitals.find((h) => h.phone);
        if (firstCallable) {
            callHospital(firstCallable);
        } else {
            window.location.href = "tel:112";
        }
    }

    if (!position) {
        return (
            <div style={{
                minHeight: "calc(100vh - 64px)", display: "flex",
                alignItems: "center", justifyContent: "center",
                flexDirection: "column", gap: 16,
                background: "linear-gradient(160deg, #fff1f2 0%, #f0f9ff 100%)",
                fontFamily: "'DM Sans', sans-serif"
            }}>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <div style={{
                    width: 52, height: 52, borderRadius: "50%",
                    border: "3px solid #fee2e2", borderTop: "3px solid #ef4444",
                    animation: "spin 0.9s linear infinite"
                }} />
                <p style={{ color: "#64748b", fontSize: 15 }}>
                    {geoError || "Locating you…"}
                </p>
            </div>
        );
    }

    const nearest = hospitals[0];
    const nearestDistance = nearest
        ? (Number.isFinite(nearest.distanceKm)
            ? nearest.distanceKm.toFixed(1)
            : distanceKm(position[0], position[1], nearest.lat, nearest.lon))
        : null;

    return (
        <div className="hb-premium-page" style={{
            minHeight: "calc(100vh - 64px)",
            background: "linear-gradient(160deg, #fff1f2 0%, #f0f9ff 60%, #f0fdf4 100%)",
            fontFamily: "'DM Sans', sans-serif",
            padding: "28px 24px 48px",
        }}>
            <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display&display=swap" rel="stylesheet" />

            <style>{`
        .hosp-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 16px 18px;
          display: flex;
          align-items: center;
          gap: 14px;
          cursor: pointer;
          transition: box-shadow 0.15s, border-color 0.15s, transform 0.15s;
        }
        .hosp-card:hover {
          box-shadow: 0 4px 20px rgba(14,165,233,0.10);
          border-color: #bae6fd;
          transform: translateY(-1px);
        }
        .hosp-card.active {
          border-color: #0ea5e9;
          box-shadow: 0 0 0 3px rgba(14,165,233,0.12);
        }
        .call-btn {
          padding: 8px 16px;
          border-radius: 10px;
          border: none;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          display: flex;
          align-items: center;
          gap: 5px;
          white-space: nowrap;
          transition: opacity 0.15s, transform 0.15s;
          flex-shrink: 0;
        }
        .call-btn:hover { opacity: 0.9; transform: scale(1.03); }
        .call-btn:active { transform: scale(0.97); }
        .leaflet-popup-content-wrapper {
          border-radius: 12px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.12) !important;
          font-family: 'DM Sans', sans-serif !important;
        }
        .leaflet-popup-content { margin: 12px 14px !important; }
      `}</style>

            <div style={{ maxWidth: 1100, margin: "0 auto" }}>

                {/* Page header */}
                <div style={{ marginBottom: 24 }}>
                    <h1 style={{
                        fontFamily: "'DM Serif Display', serif",
                        fontSize: 26, color: "#0f172a", margin: "0 0 4px",
                        letterSpacing: "-0.3px"
                    }}>
                        Nearby Hospitals 🏥
                    </h1>
                    <p style={{ color: "#64748b", fontSize: 14, margin: 0 }}>
                        Showing hospitals near your current location
                    </p>
                    {geoError && (
                        <p style={{ color: "#dc2626", fontSize: 13, margin: "8px 0 0" }}>
                            {geoError}
                        </p>
                    )}
                    {fetchError && (
                        <p style={{ color: "#dc2626", fontSize: 13, margin: "8px 0 0" }}>
                            {fetchError}
                            <button
                                onClick={resolveLocation}
                                style={{
                                    marginLeft: 10, border: "1px solid #fecaca",
                                    background: "#fff", color: "#b91c1c", borderRadius: 8,
                                    padding: "2px 8px", cursor: "pointer", fontSize: 12,
                                }}
                            >
                                Retry
                            </button>
                        </p>
                    )}
                </div>

                {/* Emergency banner */}
                <div style={{
                    background: "linear-gradient(135deg, #ef4444, #dc2626)",
                    borderRadius: 16, padding: "18px 22px",
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between", gap: 16,
                    marginBottom: 24,
                    boxShadow: "0 4px 20px rgba(239,68,68,0.25)"
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{
                            width: 44, height: 44, borderRadius: 12,
                            background: "rgba(255,255,255,0.15)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 22, flexShrink: 0
                        }}>🚨</div>
                        <div>
                            <p style={{ margin: 0, color: "#fff", fontWeight: 700, fontSize: 15 }}>
                                Emergency? Call nearest hospital instantly
                            </p>
                            {loadingHospitals && (
                                <p style={{ margin: "2px 0 0", color: "#fecaca", fontSize: 13 }}>
                                    Finding nearest hospitals...
                                </p>
                            )}
                            {!loadingHospitals && nearest && (
                                <p style={{ margin: "2px 0 0", color: "#fecaca", fontSize: 13 }}>
                                    {nearest.name} · {nearestDistance} km away
                                </p>
                            )}
                            {!loadingHospitals && !nearest && (
                                <p style={{ margin: "2px 0 0", color: "#fecaca", fontSize: 13 }}>
                                    No nearby hospitals found. Tap call for emergency services.
                                </p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={handleEmergency}
                        style={{
                            padding: "10px 22px", borderRadius: 12,
                            border: "2px solid rgba(255,255,255,0.4)",
                            background: "rgba(255,255,255,0.15)",
                            color: "#fff", fontSize: 14, fontWeight: 700,
                            cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                            backdropFilter: "blur(4px)", whiteSpace: "nowrap",
                            transition: "background 0.15s"
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.25)"}
                        onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.15)"}
                    >
                        📞 Call Now
                    </button>
                </div>

                {/* Two-column layout */}
                <div style={{
                    display: "grid",
                    gridTemplateColumns: "340px 1fr",
                    gap: 20,
                    alignItems: "start"
                }}>

                    {/* Hospital list */}
                    <div className="hb-premium-card" style={{ display: "flex", flexDirection: "column", gap: 10, padding: 12 }}>

                        <p style={{
                            fontSize: 11, fontWeight: 600, letterSpacing: "0.07em",
                            textTransform: "uppercase", color: "#94a3b8", margin: "0 0 4px 2px"
                        }}>
                            {hospitals.length} hospitals found
                        </p>

                        {hospitals.map((h, i) => {
                            const dist = Number.isFinite(h.distanceKm)
                                ? h.distanceKm.toFixed(1)
                                : distanceKm(position[0], position[1], h.lat, h.lon);
                            const isNearest = i === 0;
                            return (
                                <div
                                    key={h.id}
                                    className={`hosp-card${selected === h.id ? " active" : ""}`}
                                    onClick={() => setSelected(h.id === selected ? null : h.id)}
                                >
                                    {/* Icon */}
                                    <div style={{
                                        width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                                        background: isNearest ? "#fef2f2" : "#f0f9ff",
                                        display: "flex", alignItems: "center",
                                        justifyContent: "center", fontSize: 20
                                    }}>
                                        {isNearest ? "🏥" : "🏨"}
                                    </div>

                                    {/* Info */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#0f172a" }}>
                                                {h.name}
                                            </p>
                                            {isNearest && (
                                                <span style={{
                                                    fontSize: 10, fontWeight: 700, padding: "2px 7px",
                                                    background: "#fef2f2", color: "#ef4444",
                                                    borderRadius: 20, border: "1px solid #fecaca",
                                                    letterSpacing: "0.04em", textTransform: "uppercase"
                                                }}>Nearest</span>
                                            )}
                                        </div>
                                        <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8" }}>
                                            {h.type} · {dist} km
                                        </p>
                                        {h.address && (
                                            <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b" }}>
                                                {h.address}
                                            </p>
                                        )}
                                    </div>

                                    {/* Call button */}
                                    <button
                                        className="call-btn"
                                        onClick={e => { e.stopPropagation(); callHospital(h); }}
                                        style={{
                                            background: calling === h.id
                                                ? "linear-gradient(135deg, #94a3b8, #64748b)"
                                                : "linear-gradient(135deg, #22c55e, #16a34a)"
                                        }}
                                        disabled={!h.phone}
                                    >
                                        {calling === h.id ? "⏳" : h.phone ? "📞" : "🚫"}
                                    </button>
                                </div>
                            );
                        })}

                        {/* Legend */}
                        <div style={{
                            marginTop: 8, padding: "12px 14px",
                            background: "#f8fafc", borderRadius: 12,
                            border: "1px solid #e2e8f0",
                            display: "flex", gap: 16
                        }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#3b82f6" }} />
                                <span style={{ fontSize: 12, color: "#64748b" }}>Your location</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
                                <span style={{ fontSize: 12, color: "#64748b" }}>Hospital</span>
                            </div>
                        </div>
                    </div>

                    {/* Map */}
                    <div className="hb-premium-card" style={{
                        borderRadius: 20, overflow: "hidden",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 4px 24px rgba(0,0,0,0.07)"
                    }}>
                        <MapContainer
                            key={position.join(",")}
                            center={position}
                            zoom={14}
                            style={{ height: 520, width: "100%" }}
                        >
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                            <Marker position={position} icon={userIcon}>
                                <Popup>
                                    <div style={{ textAlign: "center", padding: "4px 0" }}>
                                        <div style={{ fontSize: 20 }}>📍</div>
                                        <p style={{ margin: "4px 0 0", fontWeight: 600, fontSize: 13 }}>You are here</p>
                                    </div>
                                </Popup>
                            </Marker>

                            {hospitals.map((h) => (
                                <Marker key={h.id} position={[h.lat, h.lon]} icon={hospitalIcon}>
                                    <Popup>
                                        <div style={{ minWidth: 160 }}>
                                            <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: 14, color: "#0f172a" }}>
                                                {h.name}
                                            </p>
                                            <p style={{ margin: "0 0 10px", fontSize: 12, color: "#94a3b8" }}>
                                                {h.type} · {(Number.isFinite(h.distanceKm)
                                                    ? h.distanceKm.toFixed(1)
                                                    : distanceKm(position[0], position[1], h.lat, h.lon))} km
                                            </p>
                                            <button
                                                onClick={() => callHospital(h)}
                                                disabled={!h.phone}
                                                style={{
                                                    width: "100%", padding: "8px", borderRadius: 8,
                                                    border: "none", background: "linear-gradient(135deg, #22c55e, #16a34a)",
                                                    color: "#fff", fontWeight: 600, fontSize: 13,
                                                    cursor: h.phone ? "pointer" : "not-allowed",
                                                    opacity: h.phone ? 1 : 0.6,
                                                    fontFamily: "'DM Sans', sans-serif"
                                                }}
                                            >
                                                {h.phone ? "📞 Call Hospital" : "Phone unavailable"}
                                            </button>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    </div>

                </div>
            </div>
        </div>
    );
}
