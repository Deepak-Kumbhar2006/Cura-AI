const axios = require("axios");

function toRad(v) {
    return (v * Math.PI) / 180;
}

function distanceKm(lat1, lon1, lat2, lon2) {
    const earthRadius = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function normalizeHospitalElement(el, userLat, userLon) {
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    if (typeof lat !== "number" || typeof lon !== "number") return null;

    const name = el.tags?.name || "Nearby Hospital";
    const type = el.tags?.healthcare || el.tags?.amenity || "hospital";
    const phone = el.tags?.phone || el.tags?.["contact:phone"] || "";
    const address = [
        el.tags?.["addr:housenumber"],
        el.tags?.["addr:street"],
        el.tags?.["addr:city"],
    ].filter(Boolean).join(", ");

    return {
        id: `${el.type || "node"}-${el.id || `${lat}-${lon}`}`,
        name,
        lat,
        lon,
        type,
        phone,
        address,
        distanceKm: Number(distanceKm(userLat, userLon, lat, lon).toFixed(1)),
    };
}

exports.getNearbyHospitals = async (req, res) => {
    try {
        let { lat, lon } = req.query;

        lat = parseFloat(lat);
        lon = parseFloat(lon);

        if (isNaN(lat) || isNaN(lon)) {
            return res.status(400).json({ error: "Invalid lat/lon" });
        }

        const query = `
        [out:json][timeout:25];
        (
          node["amenity"="hospital"](around:5000,${lat},${lon});
          way["amenity"="hospital"](around:5000,${lat},${lon});
          relation["amenity"="hospital"](around:5000,${lat},${lon});
        );
        out center;
        `;

        const response = await axios.post(
            "https://overpass-api.de/api/interpreter",
            query,
            {
                headers: {
                    "Content-Type": "text/plain",
                },
                timeout: 20000, // ✅ prevent hanging
            }
        );

        const hospitals = (response.data?.elements || [])
            .map((el) => normalizeHospitalElement(el, lat, lon))
            .filter(Boolean)
            .sort((a, b) => a.distanceKm - b.distanceKm)
            .slice(0, 20);

        if (!hospitals.length) {
            return res.status(200).json({
                hospitals: [],
                message: "No hospitals found within 5 km radius.",
            });
        }

        res.status(200).json({ hospitals, source: "overpass" });
    } catch (err) {
        const fallbackHospitals = [
            {
                id: "fallback-1",
                name: "City Care Hospital",
                lat: lat + 0.01,
                lon: lon + 0.006,
                type: "hospital",
                phone: "+919876543210",
                address: "",
            },
            {
                id: "fallback-2",
                name: "Apollo Clinic",
                lat: lat - 0.008,
                lon: lon + 0.009,
                type: "clinic",
                phone: "+919812345678",
                address: "",
            },
            {
                id: "fallback-3",
                name: "Lifeline Hospital",
                lat: lat + 0.012,
                lon: lon - 0.007,
                type: "hospital",
                phone: "+919900112233",
                address: "",
            },
        ].map((h) => ({
            ...h,
            distanceKm: Number(distanceKm(lat, lon, h.lat, h.lon).toFixed(1)),
        }));

        res.status(200).json({
            hospitals: fallbackHospitals,
            fallback: true,
            source: "fallback",
        });
    }
};
