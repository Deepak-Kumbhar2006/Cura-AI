function generateResponse(message, prediction) {
    const { disease, risk } = prediction;

    let advice = "";

    if (disease === "Flu") {
        advice = "Stay hydrated, take rest, and consider paracetamol.";
    } else if (disease === "Covid-19") {
        advice = "Isolate yourself and consult a doctor immediately.";
    } else if (disease === "Diabetes") {
        advice = "Monitor sugar levels and maintain a healthy diet.";
    } else {
        advice = "Please consult a healthcare professional.";
    }

    return `
Based on your symptoms, you may have ${disease}.
Risk Level: ${risk}

Advice:
${advice}

⚠️ This is not a medical diagnosis. Please consult a doctor if symptoms persist.
`;
}

module.exports = { generateResponse };