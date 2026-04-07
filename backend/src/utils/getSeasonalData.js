function getRegion(lat, lon) {
    if (lat > 18 && lat < 20 && lon > 72 && lon < 74) {
        return "mumbai";
    }
    return "default";
}

function getSeasonalData(lat, lon) {
    const region = getRegion(lat, lon);

    if (region === "mumbai") {
        return {
            location: "Mumbai",
            season: "Monsoon",
            diseases: ["Dengue", "Malaria", "Viral Fever"],
            tips: [
                "Avoid stagnant water",
                "Use mosquito repellent",
                "Drink clean water"
            ]
        };
    }

    return {
        location: "General",
        season: "Summer",
        diseases: ["Heat Stroke", "Dehydration"],
        tips: ["Drink water", "Stay cool"]
    };
}

function formatAlert(data) {
    return `
⚠️ *Seasonal Health Alert* (${data.location})

🌦 Season: ${data.season}

🦠 Diseases:
${data.diseases.map(d => `• ${d}`).join("\n")}

🛡 Tips:
${data.tips.map(t => `• ${t}`).join("\n")}
`;
}

module.exports = { getSeasonalData, formatAlert };