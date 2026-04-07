// 🔥 Expanded Disease Knowledge
const diseases = [
    {
        name: "Flu",
        symptoms: ["fever", "cough", "headache", "body pain"],
    },
    {
        name: "Covid-19",
        symptoms: ["fever", "cough", "breathing", "loss of taste"],
    },
    {
        name: "Diabetes",
        symptoms: ["fatigue", "thirst", "urination"],
    },
    {
        name: "Food Poisoning",
        symptoms: ["vomiting", "dizziness", "fatigue"],
    },
    {
        name: "Migraine",
        symptoms: ["headache", "dizziness"],
    },
];

// 🔥 Smart Symptom Map (with variations + spelling mistakes)
const symptomMap = {
    fever: ["fever", "high temperature", "temperature"],
    cough: ["cough", "coughing"],
    headache: ["headache", "head pain"],
    vomiting: ["vomit", "vomiting", "vomatting", "nausea"],
    dizziness: ["dizzy", "dizziness", "lightheaded"],
    fatigue: ["tired", "fatigue", "weakness"],
    thirst: ["thirst", "dry mouth"],
    urination: ["urination", "frequent urination"],
    breathing: ["breathing", "shortness of breath"],
    "loss of taste": ["loss of taste", "no taste"],
};

// 🔥 Extract Symptoms (SMART)
function extractSymptoms(message) {
    const found = [];

    Object.keys(symptomMap).forEach((key) => {
        symptomMap[key].forEach((variant) => {
            if (message.includes(variant)) {
                if (!found.includes(key)) {
                    found.push(key);
                }
            }
        });
    });

    return found;
}

// 🔥 Detect if user directly says disease
function detectDirectDisease(message) {
    const msg = message.toLowerCase();

    if (msg.includes("flu")) return "Flu";
    if (msg.includes("covid")) return "Covid-19";
    if (msg.includes("diabetes")) return "Diabetes";

    return null;
}

// 🔥 MAIN PREDICTION FUNCTION
function predictDisease(message) {
    message = message.toLowerCase();

    // ✅ Direct disease detection
    const direct = detectDirectDisease(message);
    if (direct) {
        return {
            disease: direct,
            risk: "Medium",
            confidence: 0.9,
        };
    }

    const userSymptoms = extractSymptoms(message);

    if (userSymptoms.length === 0) {
        return {
            disease: "Unknown",
            risk: "Low",
            confidence: 0,
        };
    }

    let bestMatch = null;
    let maxScore = 0;

    diseases.forEach((disease) => {
        let matchCount = disease.symptoms.filter((s) =>
            userSymptoms.includes(s)
        ).length;

        // 🔥 weighted score
        let score = matchCount / disease.symptoms.length;

        if (score > maxScore) {
            maxScore = score;
            bestMatch = disease;
        }
    });

    // 🔥 Risk calculation (better)
    let risk = "Low";
    if (maxScore >= 0.5) risk = "Medium";
    if (maxScore >= 0.75) risk = "High";

    return {
        disease: bestMatch?.name || "Unknown",
        risk,
        confidence: maxScore.toFixed(2),
        symptomsDetected: userSymptoms,
    };
}

module.exports = { predictDisease };