import { useMemo, useState } from "react";
import API from "../services/api";

const PREMIUM_FEATURE_GROUPS = [
    {
        title: "Core Intelligence",
        tone: "live",
        items: [
            "AI Symptom Progression Simulator",
            "Personalized Health Risk Scoring",
            "Prescription Image Scanner + Drug Safety Checker",
            "Mental Health Emotion Detection",
            "Health Timeline Dashboard",
            "Smart Follow-up Question Engine",
            "Nearby Medical Help Recommendation (context-aware)",
            "Lab Report Analyzer",
            "Real-Time Emergency Detection Mode",
            "AI Health Coach (daily guidance)",
            "Privacy + Data Control System",
            "Multi-user Family Health Dashboard",
            "Disease Probability Visualization",
            "Voice + Tone Adaptive Responses",
            "\"What If\" Scenario Simulation",
        ],
    },
    {
        title: "Predictive + Adaptive Systems",
        tone: "simulated",
        items: [
            "Digital Twin Health Model",
            "Adaptive Treatment Recommendation Engine",
            "Offline Emergency AI Mode",
            "Long-Term Context Memory Engine",
            "Medication Adherence Intelligence",
            "Conversational Diagnosis Graph",
            "Health Habit Gamification System",
            "Nutritional Deficiency Predictor",
            "Food Image Scanner with Nutrition Breakdown",
            "Dynamic Severity Classification System",
            "Seasonal Disease Intelligence",
            "AI Second Opinion Mode",
            "Recovery Prediction Engine",
            "Conversation Summary Generator (doctor-ready)",
            "Allergy Intelligence System",
        ],
    },
    {
        title: "Experience + Personalization",
        tone: "enhanced",
        items: [
            "Wearable Data Sync / Simulation",
            "Multi-language + Local Dialect Support",
            "Preventive Care Planner",
            "Explainable AI (Why this treatment?)",
            "Micro-Habit Correction Engine",
            "Chat Behavior-Based Health Monitoring",
            "Drug Effectiveness Feedback Loop",
            "AI Health Audit Reports (weekly/monthly)",
            "Voice Stress & Breathing Analysis",
            "Medical History Compression System",
            "Pandemic / Disaster Mode",
            "AI Companion Mode (daily interaction)",
            "Body System Mapping Interface",
            "Habit vs Symptom Correlation Engine",
            "Smart Triage System (ER-style)",
        ],
    },
    {
        title: "Advanced Insight Stack",
        tone: "flagship",
        items: [
            "Family History-Based Risk Simulation",
            "Multi-image Diagnosis Comparison",
            "ELI5 Medical Explanation Mode",
            "Smart Supplement Advisor",
            "AI Health Goal Planner",
            "Silent Symptom Detection",
            "Medication Cost Optimizer",
            "Context-Aware Smart Reminder Engine",
            "Conversational Drill-Down Engine",
            "Environmental Impact Analyzer",
            "Health Confidence Score",
            "Emergency Contact Intelligence",
            "AI Recovery / Rehab Coach",
            "Cross-platform Sync (Web + Mobile + CLI)",
            "Self-Debugging AI System",
            "Health Knowledge Graph Backend",
            "Doctor-Ready Report Export (PDF/share)",
            "Adaptive UI Based on User Type",
            "Rare Disease Detection Flag",
            "Community Disease Pattern Detection",
        ],
    },
];

export default function AISuite() {
    const [symptoms, setSymptoms] = useState("");
    const [progression, setProgression] = useState(null);
    const [risk, setRisk] = useState(null);
    const [emotion, setEmotion] = useState(null);
    const [lab, setLab] = useState(null);
    const [advanced, setAdvanced] = useState(null);
    const [ultra, setUltra] = useState(null);
    const [skinResult, setSkinResult] = useState(null);
    const [skinPreview, setSkinPreview] = useState("");
    const [labText, setLabText] = useState("Hemoglobin: 10.9, Glucose: 112, Vitamin D: 17");
    const [labExplain, setLabExplain] = useState(null);
    const [loading, setLoading] = useState(false);

    const featureCount = useMemo(
        () => PREMIUM_FEATURE_GROUPS.reduce((sum, group) => sum + group.items.length, 0),
        [],
    );

    const runProgression = async (treated) => {
        setLoading(true);
        try {
            const { data } = await API.post("/api/intelligence/progression", { symptoms, treated });
            setProgression(data);
        } finally {
            setLoading(false);
        }
    };

    const runRisk = async () => {
        setLoading(true);
        try {
            const { data } = await API.post("/api/intelligence/risk-score", {
                age: 32, bmi: 27, sleepHours: 6, activityDaysPerWeek: 2, sugarLevel: 7,
            });
            setRisk(data);
        } finally {
            setLoading(false);
        }
    };

    const runEmotion = async () => {
        setLoading(true);
        try {
            const { data } = await API.post("/api/intelligence/emotion-check", { message: symptoms });
            setEmotion(data);
        } finally {
            setLoading(false);
        }
    };

    const runLab = async () => {
        setLoading(true);
        try {
            const { data } = await API.post("/api/intelligence/lab-analyzer", { hemoglobin: 10.8, fastingGlucose: 112 });
            setLab(data);
        } finally {
            setLoading(false);
        }
    };

    const runAdvanced = async () => {
        setLoading(true);
        try {
            const { data } = await API.post("/api/intelligence/advanced-insights", {
                symptoms,
                sleepHours: 6,
                steps: 4500,
                diet: "vegetarian, indoor lifestyle",
                diagnosis: "Gastritis",
                medsTaken: 5,
                medsPrescribed: 7,
                language: "hinglish",
            });
            setAdvanced(data);
        } finally {
            setLoading(false);
        }
    };

    const runUltra = async () => {
        setLoading(true);
        try {
            const { data } = await API.post("/api/intelligence/ultra-insights", {
                symptoms,
                sleepHours: 5.5,
                typingSpeedWpm: 22,
                lateNightChats: 4,
                familyHistory: "diabetes, heart disease",
                medsHelped: "no",
                weather: "humid",
                aqi: 140,
                goal: "lose 5kg",
                userType: "advanced",
                bodyPart: "chest",
            });
            setUltra(data);
        } finally {
            setLoading(false);
        }
    };

    const fileToDataUrl = (file) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

    const onSkinImageChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/")) return;
        setLoading(true);
        try {
            const dataUrl = await fileToDataUrl(file);
            setSkinPreview(dataUrl);
            const { data } = await API.post("/api/intelligence/skin-detect", {
                imageBase64: dataUrl,
                mimeType: file.type,
                notes: symptoms,
            });
            setSkinResult(data);
        } finally {
            setLoading(false);
        }
    };

    const runLabExplain = async () => {
        setLoading(true);
        try {
            const { data } = await API.post("/api/intelligence/lab-report-explain", { reportText: labText });
            setLabExplain(data);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="hb-premium-page" style={{ maxWidth: 1100, margin: "20px auto", padding: "0 20px", fontFamily: "'DM Sans', sans-serif" }}>
            <div className="hb-premium-hero hb-panel" style={{ padding: 22, marginBottom: 16 }}>
                <div>
                    <span className="hb-premium-pill">Flagship AI Platform</span>
                    <h1 className="hb-premium-title" style={{ margin: "10px 0 6px", fontSize: 32 }}>AI Health Intelligence Suite — Premium Edition</h1>
                    <p style={{ color: "#64748b", marginTop: 0, marginBottom: 12 }}>
                        High-end animated interface, unified risk intelligence, multi-modal diagnostics, and complete feature blueprint ({featureCount} modules).
                    </p>
                </div>
                <div className="hb-stat-grid">
                    <div className="hb-stat-card"><strong>{featureCount}</strong><span>AI Modules</span></div>
                    <div className="hb-stat-card"><strong>4</strong><span>Feature Layers</span></div>
                    <div className="hb-stat-card"><strong>24/7</strong><span>Smart Monitoring</span></div>
                </div>
            </div>

            <div className="hb-panel" style={{ padding: 18, marginBottom: 14 }}>
                <h2 style={{ marginTop: 0 }}>Interactive Intelligence Controls</h2>
                <textarea
                    className="hb-input"
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="Describe symptoms, mood, history, behavior, goals, or follow-up context..."
                    style={{ minHeight: 95, marginBottom: 12 }}
                />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 8 }}>
                    <button className="hb-btn" onClick={() => runProgression(false)} disabled={loading}>Simulate Untreated</button>
                    <button className="hb-btn hb-btn-secondary" onClick={() => runProgression(true)} disabled={loading}>Simulate Treated</button>
                    <button className="hb-btn" onClick={runRisk} disabled={loading}>Run Risk Score</button>
                    <button className="hb-btn hb-btn-secondary" onClick={runEmotion} disabled={loading}>Check Emotion</button>
                    <button className="hb-btn" onClick={runLab} disabled={loading}>Analyze Sample Lab</button>
                    <button className="hb-btn hb-btn-secondary" onClick={runAdvanced} disabled={loading}>Advanced AI (16-35)</button>
                    <button className="hb-btn" onClick={runUltra} disabled={loading}>Ultra AI (36-65)</button>
                </div>
            </div>

            <section className="hb-feature-stack" aria-label="Complete premium features">
                {PREMIUM_FEATURE_GROUPS.map((group, groupIndex) => (
                    <div key={group.title} className={`hb-feature-group hb-tone-${group.tone}`} style={{ animationDelay: `${groupIndex * 80}ms` }}>
                        <div className="hb-group-header">
                            <h3>{group.title}</h3>
                            <span>{group.items.length} features</span>
                        </div>
                        <div className="hb-feature-grid">
                            {group.items.map((item, itemIndex) => (
                                <article key={item} className="hb-feature-card" style={{ animationDelay: `${itemIndex * 30}ms` }}>
                                    <p>{item}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                ))}
            </section>

            <div className="hb-panel" style={{ padding: 14, marginBottom: 12 }}>
                <h3 style={{ marginTop: 0 }}>Skin Disease Detection (Image-based)</h3>
                <input type="file" accept="image/*" onChange={onSkinImageChange} />
                {skinPreview && <img src={skinPreview} alt="skin preview" style={{ marginTop: 10, width: 110, height: 110, objectFit: "cover", borderRadius: 10 }} />}
                {skinResult && (
                    <div style={{ marginTop: 10 }}>
                        <p><strong>Condition:</strong> {skinResult.condition}</p>
                        <p><strong>Confidence:</strong> {skinResult.confidence}%</p>
                        <p><strong>Severity:</strong> {skinResult.severity}</p>
                        <p>{skinResult.explanation}</p>
                    </div>
                )}
            </div>

            <div className="hb-panel" style={{ padding: 14, marginBottom: 12 }}>
                <h3 style={{ marginTop: 0 }}>Lab Report Explanation</h3>
                <textarea
                    className="hb-input"
                    value={labText}
                    onChange={(e) => setLabText(e.target.value)}
                    style={{ minHeight: 90, marginBottom: 8 }}
                />
                <button className="hb-btn" onClick={runLabExplain} disabled={loading}>Explain Lab Report</button>
                {labExplain && (
                    <div style={{ marginTop: 10 }}>
                        <p><strong>Summary:</strong> {labExplain.summary}</p>
                        {labExplain.findings?.map((f) => <p key={f}>• {f}</p>)}
                    </div>
                )}
            </div>

            {progression && (
                <div className="hb-panel" style={{ padding: 14, marginBottom: 12 }}>
                    <h3>Symptom Progression</h3>
                    {progression.timeline?.map((t) => <p key={t.day} style={{ margin: "6px 0" }}>Day {t.day}: {t.status}</p>)}
                </div>
            )}

            {risk && (
                <div className="hb-panel" style={{ padding: 14, marginBottom: 12 }}>
                    <h3>Personalized Health Risk Score</h3>
                    <p>Diabetes Risk: {risk.diabetesRisk.score}% ({risk.diabetesRisk.level})</p>
                    <p>Heart Risk: {risk.heartRisk.score}% ({risk.heartRisk.level})</p>
                </div>
            )}

            {emotion && (
                <div className="hb-panel" style={{ padding: 14, marginBottom: 12 }}>
                    <h3>Mental Health Emotion Detection</h3>
                    <p>Mood: {emotion.mood}</p>
                    <p>{emotion.suggestion}</p>
                </div>
            )}

            {lab && (
                <div className="hb-panel" style={{ padding: 14 }}>
                    <h3>Lab Report Analyzer</h3>
                    {lab.findings?.length ? lab.findings.map((f) => <p key={f}>• {f}</p>) : <p>No abnormalities detected.</p>}
                    <p style={{ color: "#64748b" }}>{lab.summary}</p>
                </div>
            )}

            {advanced && (
                <div className="hb-panel" style={{ padding: 14, marginTop: 12 }}>
                    <h3>Advanced AI Features Bundle</h3>
                    <p><strong>Digital Twin:</strong> Fatigue risk in 5 days = {advanced.digitalTwin?.fatigueRiskIn5Days}</p>
                    <p><strong>Severity:</strong> {advanced.dynamicSeverityClassification}</p>
                    <p><strong>Medication Adherence:</strong> {advanced.medicationAdherence?.adherencePercent}%</p>
                    <p><strong>Habit Score:</strong> {advanced.healthHabitGamification?.score} ({advanced.healthHabitGamification?.badge})</p>
                    <p><strong>Recovery Prediction:</strong> {advanced.recoveryPredictionEngine}</p>
                    <p><strong>Second Opinion:</strong> {advanced.aiSecondOpinion}</p>
                    <p><strong>Micro-Habit Correction:</strong> {advanced.microHabitCorrection?.join(" | ")}</p>
                    <p style={{ color: "#64748b" }}>{advanced.disclaimer}</p>
                </div>
            )}

            {ultra && (
                <div className="hb-panel" style={{ background: "#0f172a", color: "#e2e8f0", borderRadius: 14, padding: 14, marginTop: 12 }}>
                    <h3 style={{ marginTop: 0 }}>Ultra AI Feature Output (36–65)</h3>
                    <p style={{ marginTop: 0, color: "#94a3b8" }}>
                        Includes digital monitoring, triage, confidence scoring, habit correlation, rare-disease flagging, and more.
                    </p>
                    <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, lineHeight: 1.5 }}>
                        {JSON.stringify(ultra, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}
