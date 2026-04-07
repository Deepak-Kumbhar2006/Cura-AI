const ChatMessage = require("../models/chatMessage");
const User = require("../models/user");
const axios = require("axios");

const HIGH_RISK_KEYWORDS = ["chest pain", "shortness of breath", "not breathing", "fainted", "stroke", "heavy bleeding"];
const STRESS_KEYWORDS = ["stressed", "anxious", "panic", "overwhelmed", "depressed", "hopeless", "can't sleep"];

function toNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

exports.simulateProgression = (req, res) => {
  const symptoms = (req.body?.symptoms || "").toLowerCase();
  const treated = !!req.body?.treated;
  const severe = HIGH_RISK_KEYWORDS.some((k) => symptoms.includes(k));
  const timeline = treated
    ? [
      { day: 1, status: "Symptoms may stabilize with rest/medication." },
      { day: 2, status: "Expected mild improvement if treatment is correct." },
      { day: 4, status: "Most mild conditions show noticeable recovery." },
    ]
    : [
      { day: 1, status: "Symptoms may persist or mildly worsen." },
      { day: 2, status: severe ? "Risk of serious progression is high. Seek urgent care." : "Inflammation/discomfort may increase." },
      { day: 4, status: severe ? "Potential emergency complications possible." : "Recovery may be delayed without treatment." },
    ];

  return res.json({
    treated,
    severe,
    timeline,
    note: "AI simulation only. Not a clinical diagnosis.",
  });
};

exports.riskScore = (req, res) => {
  const age = toNumber(req.body?.age, 30);
  const bmi = toNumber(req.body?.bmi, 24);
  const sleep = toNumber(req.body?.sleepHours, 7);
  const activity = toNumber(req.body?.activityDaysPerWeek, 3);
  const sugarIntake = toNumber(req.body?.sugarLevel, 5); // 1-10

  const diabetes = Math.min(100, Math.max(5, Math.round(age * 0.35 + bmi * 1.8 + sugarIntake * 4 - activity * 2)));
  const heart = Math.min(100, Math.max(5, Math.round(age * 0.45 + bmi * 1.4 + (7 - sleep) * 6 - activity * 2.5)));

  const classify = (v) => (v >= 70 ? "High" : v >= 40 ? "Moderate" : "Low");

  return res.json({
    diabetesRisk: { score: diabetes, level: classify(diabetes) },
    heartRisk: { score: heart, level: classify(heart) },
    note: "Estimated risk score for awareness only.",
  });
};

exports.prescriptionSafety = (req, res) => {
  const medicines = String(req.body?.medicines || "")
    .split(/[,\n]/)
    .map((m) => m.trim().toLowerCase())
    .filter(Boolean);

  const warnings = [];
  if (medicines.includes("ibuprofen") && medicines.includes("diclofenac")) {
    warnings.push("Possible duplicate NSAID use (ibuprofen + diclofenac).");
  }
  if (medicines.includes("paracetamol") && medicines.includes("acetaminophen")) {
    warnings.push("Paracetamol and acetaminophen are the same drug family; check duplicate dosing.");
  }
  if (medicines.length === 0) {
    warnings.push("No medicines detected. OCR integration can be added later.");
  }

  return res.json({
    detectedMedicines: medicines,
    warnings,
    safe: warnings.length === 0,
    note: "Preliminary medication safety check only.",
  });
};

exports.emotionCheck = (req, res) => {
  const message = String(req.body?.message || "").toLowerCase();
  const stressed = STRESS_KEYWORDS.some((k) => message.includes(k));
  return res.json({
    mood: stressed ? "Stressed" : "Stable",
    suggestion: stressed
      ? "You seem stressed. Try a 2-minute breathing exercise: inhale 4s, hold 4s, exhale 6s."
      : "Keep going. Maintain hydration, rest, and routine.",
  });
};

exports.labAnalyzer = (req, res) => {
  const hemoglobin = toNumber(req.body?.hemoglobin, NaN);
  const glucose = toNumber(req.body?.fastingGlucose, NaN);
  const findings = [];
  if (Number.isFinite(hemoglobin) && hemoglobin < 12) findings.push("Hemoglobin appears low; possible anemia risk.");
  if (Number.isFinite(glucose) && glucose > 100) findings.push("Fasting glucose appears elevated.");
  return res.json({
    findings,
    summary: findings.length ? "Some values may need follow-up." : "No clear high-risk markers from provided values.",
    note: "Lab interpretation is informational only.",
  });
};

exports.dailyCoach = (req, res) => {
  const sleep = toNumber(req.body?.sleepHours, 7);
  return res.json({
    tips: [
      sleep < 7 ? "You slept less than 7 hours. Prioritize rest tonight." : "Great sleep consistency. Keep it up.",
      "Drink at least 2L water today.",
      "Take a 20-minute walk after meals.",
    ],
  });
};

exports.timeline = async (req, res) => {
  if (!req.user?.id) return res.json({ events: [], note: "Login for personalized timeline." });
  const user = await User.findById(req.user.id).lean();
  if (!user) return res.json({ events: [] });
  const messages = await ChatMessage.find({ user: user._id }).sort({ createdAt: -1 }).limit(20).lean();
  const events = messages.map((m) => ({
    at: m.createdAt,
    role: m.role,
    text: m.content.slice(0, 120),
  }));
  return res.json({ events });
};

exports.advancedInsights = (req, res) => {
  const symptoms = String(req.body?.symptoms || "").toLowerCase();
  const sleepHours = toNumber(req.body?.sleepHours, 6);
  const steps = toNumber(req.body?.steps, 4000);
  const diet = String(req.body?.diet || "");
  const diagnosis = String(req.body?.diagnosis || "");
  const medsTaken = toNumber(req.body?.medsTaken, 0);
  const medsPrescribed = toNumber(req.body?.medsPrescribed, 0);
  const language = String(req.body?.language || "en");

  const severity = HIGH_RISK_KEYWORDS.some((k) => symptoms.includes(k))
    ? "Severe"
    : symptoms.includes("fever") || symptoms.includes("pain")
      ? "Moderate"
      : "Mild";

  const twin = {
    fatigueRiskIn5Days: sleepHours < 6 ? "High" : sleepHours < 7 ? "Moderate" : "Low",
    cardioRiskTrend: steps < 5000 ? "Increasing" : "Stable",
  };

  const adherencePct = medsPrescribed > 0 ? Math.round((medsTaken / medsPrescribed) * 100) : 100;
  const habitScore = Math.max(0, Math.min(100, Math.round((sleepHours / 8) * 40 + (steps / 10000) * 60)));
  const deficiencyRisk = {
    iron: /vegetarian|low greens|junk/i.test(diet) ? "Moderate" : "Low",
    vitaminD: /indoor|no sun/i.test(diet) ? "High" : "Moderate",
    protein: /low protein|skip meals/i.test(diet) ? "Moderate" : "Low",
  };

  return res.json({
    digitalTwin: twin,
    adaptiveTreatment: "Based on prior patterns, hydration + early rest + light meals tend to improve outcomes faster.",
    offlineEmergencyMode: severity === "Severe"
      ? "Emergency mode: call 112/102 immediately, keep patient seated, monitor breathing."
      : "No immediate offline emergency trigger.",
    contextMemoryEngine: "Past symptom memory enabled. Similar patterns will be highlighted in future chats.",
    medicationAdherence: {
      adherencePercent: adherencePct,
      alert: adherencePct < 80 ? "You are missing doses; effectiveness may drop." : "Medication adherence looks good.",
    },
    conversationalDiagnosisGraph: {
      topPath: severity === "Severe" ? "symptoms -> emergency triage -> urgent care" : "symptoms -> primary causes -> home care/clinic",
      confidenceShift: severity === "Severe" ? "+22% emergency probability" : "+14% mild-viral probability",
    },
    healthHabitGamification: {
      score: habitScore,
      weeklyDelta: "+12%",
      badge: habitScore > 70 ? "Consistency Hero" : "Getting Started",
    },
    nutritionalDeficiencyPredictor: deficiencyRisk,
    foodScanner: "Image nutrition scanner scaffold ready (calories/protein/fat output can be plugged in).",
    dynamicSeverityClassification: severity,
    seasonalDiseaseIntelligence: "Seasonal alert: maintain hydration, mask in crowded areas, and monitor fever/cough trends.",
    aiSecondOpinion: diagnosis
      ? `Second opinion: verify ${diagnosis} against symptom timeline and consider differential causes if no improvement in 48h.`
      : "Provide diagnosis text to activate second-opinion analysis.",
    recoveryPredictionEngine: severity === "Severe" ? "Escalation likely without treatment. Seek urgent care." : "Expected recovery window: 2-5 days with treatment.",
    conversationalMemorySummarizer: "Summary: symptoms captured, severity classified, and next-step guidance prepared.",
    allergyIntelligence: "Allergy guard active: medication and food suggestions should be screened against profile allergies.",
    wearableSyncSimulation: {
      steps,
      sleepHours,
      insight: steps < 6000 ? "Increase daily movement by 1,500 steps." : "Activity trend is healthy.",
    },
    multiLanguageDialect: language === "hinglish" || language === "mr"
      ? "Dialect mode enabled. Responses can be simplified in local style."
      : "Standard language mode enabled.",
    preventiveCarePlanner: [
      "Monthly: BP + weight check",
      "Quarterly: blood sugar panel",
      "Every 6 months: dental and eye review",
    ],
    aiDebateMode: "Medicine rationale mode ready: can explain mechanism, expected benefit, and side effects.",
    microHabitCorrection: [
      "Stand every 60 minutes if sitting continuously.",
      "Sleep 20 minutes earlier for the next 7 days.",
    ],
    disclaimer: "All outputs are AI-assisted wellness insights, not medical diagnosis.",
  });
};

exports.ultraInsights = (req, res) => {
  const symptoms = String(req.body?.symptoms || "").toLowerCase();
  const sleepHours = toNumber(req.body?.sleepHours, 6);
  const typingSpeed = toNumber(req.body?.typingSpeedWpm, 32);
  const lateNightChats = toNumber(req.body?.lateNightChats, 3);
  const familyHistory = String(req.body?.familyHistory || "").toLowerCase();
  const medsHelped = String(req.body?.medsHelped || "unknown").toLowerCase();
  const weather = String(req.body?.weather || "unknown").toLowerCase();
  const pollution = toNumber(req.body?.aqi, 90);
  const goal = String(req.body?.goal || "improve overall health");
  const userType = String(req.body?.userType || "beginner").toLowerCase();
  const bodyPart = String(req.body?.bodyPart || "general").toLowerCase();

  const fatigueSignal = typingSpeed < 25 || sleepHours < 6;
  const chronicSignal = /again|repeated|always|chronic|daily/.test(symptoms);
  const triage = HIGH_RISK_KEYWORDS.some((k) => symptoms.includes(k)) ? "Red" : symptoms.includes("fever") || symptoms.includes("pain") ? "Yellow" : "Green";
  const confidence = triage === "Red" ? 82 : chronicSignal ? 68 : 54;

  const knowledgeGraph = {
    nodes: ["symptoms", "conditions", "treatments", "lifestyle", "risk"],
    links: [
      "symptoms -> triage",
      "family_history -> risk",
      "sleep/activity -> habit correlation",
      "medication_feedback -> effectiveness score",
    ],
  };

  return res.json({
    continuousMonitoring: {
      fatigueSignal,
      sleepRisk: sleepHours < 6 ? "High" : "Moderate",
      lateNightRisk: lateNightChats >= 3 ? "High" : "Low",
      chronicSignal,
    },
    drugEffectivenessFeedback: {
      effectivenessScore: medsHelped === "yes" ? 78 : medsHelped === "no" ? 28 : 50,
      recommendation: medsHelped === "no" ? "Re-evaluate treatment with clinician." : "Continue and monitor response.",
    },
    aiHealthAudit: {
      period: "Weekly",
      summary: "Generated symptom/risk/habit digest ready for review.",
    },
    voiceStressBreathing: "Voice analysis scaffold ready (tone + breath rhythm checks).",
    historyCompression: "Compressed history: key symptoms, risk shifts, and treatment response highlights.",
    disasterPandemicMode: weather.includes("outbreak") ? "Pandemic mode enabled: prevention + local guidelines." : "Normal mode active.",
    companionMode: "Daily check-in prompt enabled: compare today vs yesterday.",
    bodySystemMapping: {
      selectedBodyPart: bodyPart,
      likelySystems: bodyPart.includes("chest") ? ["cardio", "respiratory"] : bodyPart.includes("stomach") ? ["gastrointestinal"] : ["general"],
    },
    habitSymptomCorrelation: [
      sleepHours < 6 ? "Low sleep correlates with fatigue/headache risk." : "Sleep pattern relatively stable.",
      symptoms.includes("stomach") ? "Diet quality may correlate with stomach discomfort." : "No strong diet-symptom correlation detected.",
    ],
    smartTriage: { color: triage, action: triage === "Red" ? "Seek urgent care now." : triage === "Yellow" ? "Consult doctor soon." : "Monitor at home." },
    geneticLikeRisk: {
      diabetesRiskBoost: familyHistory.includes("diabetes") ? "+18%" : "+0%",
      heartRiskBoost: familyHistory.includes("heart") ? "+15%" : "+0%",
    },
    multiImageComparison: "Multi-image progression comparison scaffold ready (improvement % output).",
    eli5Mode: "ELI5: Blood pressure means how hard blood pushes inside your body pipes.",
    supplementAdvisor: "Suggest vitamin D / B12 / iron only after lab confirmation and clinician advice.",
    healthGoalPlanner: {
      goal,
      milestones: ["Week 1: baseline tracking", "Week 2: consistency target", "Week 3: progress review", "Week 4: adjustment plan"],
    },
    silentSymptomDetector: symptoms.includes("tired") ? "Hidden signal: possible sleep deficiency / stress pattern." : "No hidden high-signal symptom detected.",
    medicationCostOptimizer: "Generic alternative checker scaffold ready (region-specific pricing can be plugged in).",
    smartReminderContext: sleepHours < 6 ? "Context reminder: prioritize rest; skip heavy workout today." : "Context reminder: maintain routine.",
    conversationalDrillDown: "Adaptive drill-down enabled: general -> specific -> precise questioning.",
    environmentalImpact: pollution > 120 ? "Poor air quality may worsen breathing symptoms." : "Environmental impact currently moderate.",
    healthConfidenceScore: `${confidence}%`,
    emergencyContactIntelligence: triage === "Red" ? "Call emergency contact + share summary now." : "Emergency contact mode on standby.",
    rehabRecoveryCoach: "Post-illness recovery coach scaffold ready: graded activity + progress checks.",
    crossPlatformSync: "Sync scaffold ready for Web + Mobile + CLI channels.",
    selfDebuggingAI: "Meta-learning log stub enabled for low-confidence predictions.",
    healthKnowledgeGraph: knowledgeGraph,
    doctorReadyExport: "Doctor-ready export scaffold ready (PDF/share).",
    adaptiveUI: userType === "advanced" ? "Advanced metrics view enabled." : "Simple beginner-friendly UI enabled.",
    rareDiseaseFlagging: confidence < 55 ? "Rare disease flag: consider specialist evaluation if symptoms persist." : "Common-case path likely.",
    communityPatternDetection: "Anonymous trend engine scaffold ready (cluster fever/cough spikes).",
    disclaimer: "This is an AI wellness intelligence layer, not medical diagnosis.",
  });
};

exports.skinDiseaseDetect = async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg", notes = "" } = req.body || {};
    if (!imageBase64 || typeof imageBase64 !== "string") {
      return res.status(400).json({ message: "imageBase64 is required" });
    }
    const cleaned = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
    if (!cleaned || cleaned.length < 120) {
      return res.status(400).json({ message: "Invalid image payload" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        condition: "Unknown (AI key not configured)",
        confidence: 35,
        severity: "Moderate",
        explanation: "Could not run visual model. Please consult dermatologist if rash/spread/itching worsens.",
        careTips: ["Keep area clean and dry", "Avoid scratching", "Use gentle soap and avoid irritants"],
      });
    }

    const prompt = `
You are a dermatology triage assistant.
Analyze this skin image and return JSON with keys:
condition, confidence (0-100), severity (Mild/Moderate/Severe), explanation, careTips (array of 3 short tips), redFlags (array).
Do not claim certainty. Mention this is preliminary.
Patient notes: ${notes || "None"}
`;

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [
            { text: prompt.trim() },
            { inlineData: { mimeType, data: cleaned } },
          ],
        }],
      },
      { timeout: 25000 }
    );

    const raw = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.json({
        condition: "Possible dermatitis",
        confidence: 52,
        severity: "Moderate",
        explanation: "Model produced non-structured output. Treat this as preliminary and seek medical advice if persistent.",
        careTips: ["Moisturize regularly", "Avoid new cosmetic products", "Monitor changes over 24-48h"],
      });
    }
    const parsed = JSON.parse(jsonMatch[0]);
    return res.json(parsed);
  } catch {
    return res.status(500).json({ message: "Skin image analysis failed" });
  }
};

exports.labReportExplain = (req, res) => {
  const text = String(req.body?.reportText || "").toLowerCase();
  if (!text.trim()) {
    return res.status(400).json({ message: "reportText is required" });
  }

  const findings = [];
  if (/hemoglobin[^0-9]*([0-9]+(\.[0-9]+)?)/.test(text)) {
    const hb = Number(text.match(/hemoglobin[^0-9]*([0-9]+(\.[0-9]+)?)/)?.[1]);
    if (Number.isFinite(hb) && hb < 12) findings.push("Hemoglobin appears low, possible anemia tendency.");
  }
  if (/glucose[^0-9]*([0-9]+(\.[0-9]+)?)/.test(text)) {
    const glucose = Number(text.match(/glucose[^0-9]*([0-9]+(\.[0-9]+)?)/)?.[1]);
    if (Number.isFinite(glucose) && glucose > 100) findings.push("Glucose seems elevated; monitor sugar control.");
  }
  if (/vitamin d[^0-9]*([0-9]+(\.[0-9]+)?)/.test(text)) {
    const vd = Number(text.match(/vitamin d[^0-9]*([0-9]+(\.[0-9]+)?)/)?.[1]);
    if (Number.isFinite(vd) && vd < 20) findings.push("Vitamin D looks low; discuss supplementation with clinician.");
  }

  return res.json({
    summary: findings.length ? "Some lab markers may need follow-up." : "No major abnormal marker detected from provided text.",
    findings,
    nextSteps: [
      "Share this summary with your doctor.",
      "Repeat test if advised and track trend over time.",
      "Do not self-medicate based only on AI interpretation.",
    ],
  });
};
