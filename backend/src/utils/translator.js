const translate = require("googletrans").default;

// Detect language
async function detectLanguage(text) {
    try {
        const res = await translate(text, { to: "en" });
        return res.from.language.iso || "en";
    } catch (err) {
        return "en";
    }
}

// Translate text
async function translateText(text, targetLang) {
    try {
        const res = await translate(text, { to: targetLang });
        return res.text;
    } catch (err) {
        return text; // fallback
    }
}

module.exports = {
    detectLanguage,
    translateText
};