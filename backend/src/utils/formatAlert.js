function formatAlert(alert) {
    return `
⚠️ *Seasonal Health Alert* (${alert.location})

🌦 Season: ${alert.season}

🦠 Diseases:
${alert.diseases.map(d => `• ${d}`).join("\n")}

🛡 Tips:
${alert.tips.map(t => `• ${t}`).join("\n")}

Stay safe 💙
`;
}

module.exports = formatAlert;