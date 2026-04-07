const seasonalData = require("../data/seasonalData");

function getSeason(month) {
    if (month >= 3 && month <= 6) return "summer";
    if (month >= 7 && month <= 10) return "monsoon";
    return "winter";
}

exports.getSeasonalAlert = (req, res) => {
    try {
        const month = new Date().getMonth() + 1;
        const season = getSeason(month);

        const data = seasonalData[season];

        res.json({
            success: true,
            season,
            diseases: data.diseases,
            tips: data.tips
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch seasonal alert" });
    }
};