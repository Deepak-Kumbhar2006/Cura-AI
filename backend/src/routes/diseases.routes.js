const express = require("express");
const router = express.Router();

// Get trending diseases
router.get("/trending", (req, res) => {
  try {
    const trendingDiseases = [
      { name: "Influenza", cases: 590, trend: "↑ 15%", color: "#3b82f6", lastWeek: 560 },
      { name: "COVID-19", cases: 260, trend: "↑ 8%", color: "#8b5cf6", lastWeek: 245 },
      { name: "Dengue", cases: 180, trend: "↓ 5%", color: "#ec4899", lastWeek: 190 },
      { name: "Malaria", cases: 50, trend: "→ 0%", color: "#f59e0b", lastWeek: 50 },
      { name: "Tuberculosis", cases: 35, trend: "↑ 3%", color: "#10b981", lastWeek: 34 }
    ];
    
    res.json(trendingDiseases);
  } catch (err) {
    console.error("Error fetching trending diseases:", err);
    res.status(500).json({ message: "Failed to fetch diseases" });
  }
});

// Get disease details
router.get("/:disease", (req, res) => {
  try {
    const disease = req.params.disease.toLowerCase();
    
    const diseaseInfo = {
      influenza: {
        name: "Influenza",
        description: "Flu is a contagious respiratory illness caused by influenza viruses.",
        symptoms: ["Fever", "Cough", "Fatigue", "Body aches", "Chills"],
        transmission: "Respiratory droplets",
        severity: "Moderate",
        prevention: ["Vaccination", "Hand hygiene", "Avoid contact with sick people"],
        treatment: "Antiviral medications and rest"
      },
      covid19: {
        name: "COVID-19",
        description: "A disease caused by the SARS-CoV-2 virus.",
        symptoms: ["Fever", "Cough", "Loss of taste/smell", "Difficulty breathing"],
        transmission: "Respiratory droplets and aerosol",
        severity: "Variable",
        prevention: ["Vaccination", "Masking", "Physical distancing"],
        treatment: "Supportive care and antivirals in severe cases"
      },
      dengue: {
        name: "Dengue",
        description: "A mosquito-borne viral infection.",
        symptoms: ["High fever", "Joint pain", "Rash", "Vomiting"],
        transmission: "Aedes mosquito bite",
        severity: "Moderate to severe",
        prevention: ["Mosquito repellent", "Remove standing water", "Protective clothing"],
        treatment: "Symptomatic care and monitoring"
      }
    };
    
    const info = diseaseInfo[disease];
    if (!info) {
      return res.status(404).json({ message: "Disease not found" });
    }
    
    res.json(info);
  } catch (err) {
    console.error("Error fetching disease info:", err);
    res.status(500).json({ message: "Failed to fetch disease information" });
  }
});

module.exports = router;
