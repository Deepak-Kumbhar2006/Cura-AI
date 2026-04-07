const knowledge = {
    "Common Cold": [
        "Stay hydrated and get rest.",
        "Use steam inhalation for relief.",
        "Consult a doctor if symptoms worsen."
    ],
    "Flu": [
        "Take proper rest and drink fluids.",
        "Use fever reducers if necessary.",
        "Consult a doctor if fever persists."
    ],
    "Migraine": [
        "Rest in a quiet and dark room.",
        "Avoid triggers like bright light.",
        "Consult a doctor for recurring migraines."
    ],
    "Food Poisoning": [
        "Drink plenty of fluids.",
        "Avoid solid food for a few hours.",
        "Seek medical help if severe."
    ],
    "COVID-19": [
        "Isolate yourself.",
        "Monitor oxygen levels.",
        "Consult a doctor immediately if breathing issues occur."
    ],
    "Diabetes": [
        "Monitor blood sugar regularly.",
        "Maintain a healthy diet.",
        "Consult a doctor for proper medication."
    ],
    "Hypertension": [
        "Reduce salt intake.",
        "Exercise regularly.",
        "Monitor blood pressure."
    ],
    "Asthma": [
        "Avoid triggers like dust and smoke.",
        "Use inhalers as prescribed.",
        "Seek medical help if breathing worsens."
    ]
};

function getGeneralAdvice(message) {
    const msg = message.toLowerCase();

    for (let disease in knowledge) {
        if (msg.includes(disease.toLowerCase())) {
            return knowledge[disease];
        }
    }

    return [];
}

module.exports = { getGeneralAdvice };