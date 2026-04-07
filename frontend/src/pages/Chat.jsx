import { useState, useRef, useEffect } from "react";
import API from "../services/api";
import SeasonalAlert from "../components/SeasonalAlert";
/* ── Google Fonts ── */
if (typeof document !== "undefined" && !document.getElementById("hb-fonts")) {
    const link = document.createElement("link");
    link.id = "hb-fonts"; link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&family=Syne:wght@700;800&display=swap";
    document.head.appendChild(link);
}
/* ─── Intake questions ─────────────────────────────────────────────────────── */
const INTAKE_QUESTIONS = [
    {
        key: "symptom",
        text: "Hi! I\u2019m your HealthBot assistant \u{1F44B}\n\nI\u2019ll ask a few quick questions so I can guide you better.\n\nWhat is bothering you most right now?",
        placeholder: "Example: headache, fever, sore throat\u2026",
    },
    {
        key: "duration",
        text: "When did this start, and is it getting better, worse, or the same?",
        placeholder: "Example: since last night, 3 days, getting worse\u2026",
    },
    {
        key: "severity",
        text: "How strong is it on a scale of 1\u201310 (1 = mild, 10 = very severe)?",
        placeholder: "Example: 6 out of 10",
        chips: ["1\u20133 \u00B7 Mild", "4\u20136 \u00B7 Moderate", "7\u20139 \u00B7 Severe", "10 \u00B7 Unbearable"],
    },
    {
        key: "location",
        text: "Where do you feel it most? Does the discomfort spread anywhere else?",
        placeholder: "Example: left side of head, spreads to neck\u2026",
    },
    {
        key: "extra",
        text: "Any other symptoms I should know about? (type 'none' if no)",
        placeholder: "Example: nausea, dizziness, chills\u2026",
    },
];
const QUICK_PROMPTS = [
    "I have fever and body ache",
    "I feel tired and dizzy",
    "I have sore throat and cough",
    "I have stomach pain and nausea",
];
const LANG_MAP = {
    en: { placeholder: "Type your answer\u2026" },
    hi: { placeholder: "\u0905\u092A\u0928\u093E \u0909\u0924\u094D\u0924\u0930 \u0932\u093F\u0916\u0947\u0902\u2026" },
    mr: { placeholder: "\u0924\u0941\u092E\u091A\u0947 \u0909\u0924\u094D\u0924\u0930 \u0932\u093F\u0939\u093E\u2026" },
};
const EMERGENCY_KEYWORDS = [
    "chest pain", "heart attack", "not breathing", "unconscious",
    "heavy bleeding", "stroke", "severe pain", "accident", "fainted",
];
/* ── Keywords that indicate high-severity conditions ── */
const HIGH_SEVERITY_SYMPTOMS = [
    "chest pain", "heart attack", "stroke", "not breathing", "unconscious",
    "heavy bleeding", "severe pain", "accident", "fainted", "seizure",
    "difficulty breathing", "shortness of breath", "blood in stool",
    "blood in urine", "high fever", "severe headache", "paralysis",
    "loss of consciousness", "suicidal", "overdose", "poisoning",
    "meningitis", "appendicitis", "anaphylaxis", "sepsis",
];
const MODERATE_SEVERITY_SYMPTOMS = [
    "persistent cough", "prolonged fever", "vomiting", "dehydration",
    "dizziness", "blurred vision", "numbness", "swelling",
    "persistent pain", "infection", "rash with fever", "ear pain",
    "urinary pain", "joint pain", "chest tightness",
];
/* ─── Helpers ──────────────────────────────────────────────────────────────── */
/**
 * Split bot reply into max 3-4 logical section cards instead of one card per sentence.
 * Tries to detect section headers first, then falls back to paragraph splitting.
 */
function splitIntoCards(text) {
    if (!text || !text.trim()) return [text];
    // Pattern to detect common section headers in the AI response
    const sectionPattern = /\n(?=(?:\*{0,2})(?:Prediction|Assessment|Diagnosis|Likely Condition|Most likely|Possible Causes?|Other possible|Causes?|Precaution|Recommendation|Advice|Treatment|Note|Warning|Risk|When to seek|Urgent|Emergency|Follow[- ]?up|Next steps|Symptoms?|Prevention|Summary|Overview|Home Remedies|Self[- ]?care|Do['']?s and Don['']?ts|Disclaimer|Important)s?[\s:*])/gi;
    let parts = text.split(sectionPattern).map(s => s.trim()).filter(Boolean);
    // If section-header split didn't produce multiple parts, try double-newline split
    if (parts.length <= 1) {
        parts = text.split(/\n\n+/).map(s => s.trim()).filter(Boolean);
    }
    // If still a single block, just return it as one card
    if (parts.length <= 1) {
        return [text.trim()];
    }
    // Cap at 4 cards max — merge any extras into the last card
    if (parts.length > 4) {
        const consolidated = parts.slice(0, 3);
        consolidated.push(parts.slice(3).join("\n\n"));
        return consolidated;
    }
    return parts;
}
function delay(ms) { return new Promise(res => setTimeout(res, ms)); }
/**
 * Infer the correct risk level using:
 *  1. Backend-provided risk (if present)
 *  2. User self-reported severity from intake
 *  3. Symptom keyword matching for dangerous conditions
 */
function inferRisk(predictionRisk, answers) {
    const backendRisk = (predictionRisk || "").toLowerCase();
    // Check symptom text against known high/moderate severity keywords
    const allText = [
        answers?.symptom || "",
        answers?.extra || "",
        answers?.location || "",
    ].join(" ").toLowerCase();
    const hasHighKeyword = HIGH_SEVERITY_SYMPTOMS.some(k => allText.includes(k));
    const hasModerateKeyword = MODERATE_SEVERITY_SYMPTOMS.some(k => allText.includes(k));
    // Parse user-reported severity (1-10 scale or chip selection)
    const sevText = (answers?.severity || "").toLowerCase();
    let sevNum = parseInt(sevText) || 0;
    if (sevText.includes("unbearable")) sevNum = 10;
    else if (sevText.includes("severe")) sevNum = Math.max(sevNum, 8);
    else if (sevText.includes("moderate")) sevNum = Math.max(sevNum, 5);
    else if (sevText.includes("mild")) sevNum = Math.max(sevNum, 2);
    // Determine risk: highest signal wins
    if (backendRisk === "high" || hasHighKeyword || sevNum >= 7) {
        return "High";
    }
    if (backendRisk === "medium" || hasModerateKeyword || sevNum >= 4) {
        return "Medium";
    }
    if (backendRisk === "low") {
        return "Low";
    }
    // Default: use backend value if present, otherwise Low
    return predictionRisk || "Low";
}
function riskConfig(risk, dark) {
    switch (risk?.toLowerCase()) {
        case "high": return { bg: dark ? "rgba(239,68,68,.15)" : "rgba(220,38,38,.08)", color: dark ? "#ef4444" : "#dc2626", dot: dark ? "#ef4444" : "#dc2626", label: "HIGH RISK" };
        case "medium": return { bg: dark ? "rgba(245,158,11,.15)" : "rgba(217,119,6,.08)", color: dark ? "#f59e0b" : "#d97706", dot: dark ? "#f59e0b" : "#d97706", label: "MEDIUM RISK" };
        default: return { bg: dark ? "rgba(16,185,129,.15)" : "rgba(5,150,105,.08)", color: dark ? "#10b981" : "#059669", dot: dark ? "#10b981" : "#059669", label: "LOW RISK" };
    }
}
/* ─── Sub-components ───────────────────────────────────────────────────────── */
function EcgLine() {
    return (
        <div style={{ width: 120, height: 28, overflow: "hidden" }}>
            <svg viewBox="0 0 120 28" style={{ width: "100%", height: "100%" }}>
                <polyline className="ecg-line"
                    points="0,14 20,14 28,14 32,2 36,26 40,14 50,14 54,8 58,14 80,14 84,4 88,24 92,14 120,14" />
            </svg>
        </div>
    );
}
function TypingDots() {
    return <div className="dot-bounce"><span /><span /><span /></div>;
}
/* ─── Styles ───────────────────────────────────────────────────────────────── */
const STYLES = `
  .hb-root {
    --bg:#f0fdf4; --surface:#ffffff; --card:#f8fffe;
    --border:rgba(16,185,129,0.15); --green:#059669;
    --green-light:#d1fae5; --green-dim:#ecfdf5; --green-mid:#a7f3d0;
    --blue:#0284c7; --red:#dc2626; --yellow:#d97706;
    --text:#064e3b; --text-body:#1f2937; --muted:#6b7280;
    --user-bubble:linear-gradient(135deg,#059669,#047857); --user-text:#ffffff;
    --bot-bubble:#ffffff; --bot-border:rgba(16,185,129,0.2);
    --profile-bg:rgba(2,132,199,0.07); --profile-bdr:rgba(2,132,199,0.2);
    --input-bg:#ffffff; --input-bar:#f0fdf4;
    --shadow:0 4px 24px rgba(5,150,105,0.1);
    --shadow-user:0 4px 16px rgba(5,150,105,0.3);
    font-family:'DM Sans',sans-serif;
    background:var(--bg); min-height:100vh; color:var(--text-body);
  }
  .hb-root.hb-dark {
    --bg:#0b0f1a; --surface:#111827; --card:#161d2e;
    --border:rgba(255,255,255,0.07); --green:#10b981;
    --green-light:#064e3b; --green-dim:#064e3b; --green-mid:#065f46;
    --blue:#3b82f6; --red:#ef4444; --yellow:#f59e0b;
    --text:#e2e8f0; --text-body:#e2e8f0; --muted:#64748b;
    --user-bubble:linear-gradient(135deg,#1d4ed8,#2563eb); --user-text:#ffffff;
    --bot-bubble:#111827; --bot-border:rgba(255,255,255,0.07);
    --profile-bg:rgba(59,130,246,0.1); --profile-bdr:rgba(59,130,246,0.25);
    --input-bg:#161d2e; --input-bar:#111827;
    --shadow:0 24px 60px rgba(0,0,0,.5);
    --shadow-user:0 4px 20px rgba(29,78,216,0.3);
  }
  .hb-root:not(.hb-dark) {
    background:
      radial-gradient(ellipse at 10% 20%,rgba(167,243,208,0.4) 0%,transparent 50%),
      radial-gradient(ellipse at 90% 80%,rgba(110,231,183,0.3) 0%,transparent 50%),
      radial-gradient(ellipse at 50% 50%,rgba(240,253,244,1) 0%,#e6faf2 100%);
  }
  .ecg-line {
    stroke:var(--green); stroke-width:1.8; fill:none;
    stroke-dasharray:300; stroke-dashoffset:300;
    animation:ecg-draw 2.2s ease-in-out infinite;
  }
  @keyframes ecg-draw {
    0%  { stroke-dashoffset:300; opacity:1; }
    70% { stroke-dashoffset:0;   opacity:1; }
    90% { stroke-dashoffset:0;   opacity:0; }
    100%{ stroke-dashoffset:300; opacity:0; }
  }
  .dot-bounce { display:inline-flex; gap:4px; align-items:center; }
  .dot-bounce span {
    width:6px; height:6px; border-radius:50%; background:var(--green);
    animation:bounce 1.2s ease-in-out infinite;
  }
  .dot-bounce span:nth-child(2){ animation-delay:.2s; }
  .dot-bounce span:nth-child(3){ animation-delay:.4s; }
  @keyframes bounce {
    0%,80%,100%{ transform:translateY(0); opacity:.4; }
    40%        { transform:translateY(-6px); opacity:1; }
  }
  .msg-in { animation:slideIn .25s cubic-bezier(.22,1,.36,1) both; }
  @keyframes slideIn { from{ opacity:0; transform:translateY(10px); } to{ opacity:1; transform:translateY(0); } }
  .hb-input { color:var(--text-body) !important; }
  .hb-input::placeholder{ color:var(--muted); }
  .hb-input:focus{ outline:none; box-shadow:0 0 0 2px var(--green); }
  .hb-scroll::-webkit-scrollbar{ width:4px; }
  .hb-scroll::-webkit-scrollbar-track{ background:transparent; }
  .hb-scroll::-webkit-scrollbar-thumb{ background:var(--green-mid); border-radius:4px; }
  .send-btn:not(:disabled):hover{ box-shadow:0 0 18px rgba(16,185,129,.5); }
  .send-btn{ transition:box-shadow .2s, opacity .2s; }
  .theme-btn {
    background:var(--card); border:1px solid var(--border);
    border-radius:10px; width:36px; height:36px;
    display:flex; align-items:center; justify-content:center;
    cursor:pointer; font-size:16px; transition:all .2s;
  }
  .theme-btn:hover{ border-color:var(--green); background:var(--green-dim); }
  .lang-select {
    background:var(--card); color:var(--text-body);
    border:1px solid var(--border); border-radius:8px;
    padding:4px 10px; font-size:13px; cursor:pointer;
    font-family:'DM Sans',sans-serif;
  }
  .lang-select:focus{ outline:none; box-shadow:0 0 0 2px var(--green); }
  .quick-chip {
    background:var(--surface); border:1px solid var(--border);
    border-radius:999px; padding:7px 15px;
    font-size:12px; color:var(--muted); cursor:pointer;
    transition:all .15s; white-space:nowrap;
    font-family:'DM Sans',sans-serif;
    box-shadow:0 1px 4px rgba(5,150,105,0.07);
  }
  .quick-chip:hover{ border-color:var(--green); color:var(--green); background:var(--green-dim); }
  .intake-chip {
    background:var(--surface); border:1.5px solid var(--border);
    border-radius:999px; padding:8px 16px;
    font-size:12px; color:var(--muted); cursor:pointer;
    transition:all .15s; white-space:nowrap;
    font-family:'DM Sans',sans-serif;
  }
  .intake-chip:hover{ border-color:var(--green); color:var(--green); background:var(--green-dim); }
  .risk-pill {
    display:inline-flex; align-items:center; gap:4px;
    font-family:'DM Mono',monospace; font-size:10px; font-weight:500;
    padding:2px 9px; border-radius:999px; margin-top:8px; letter-spacing:.04em;
  }
  .analyze-btn {
    background:linear-gradient(135deg,#10b981,#059669);
    border:none; border-radius:14px; padding:12px 32px; color:#fff;
    font-size:15px; font-weight:700; cursor:pointer;
    font-family:'DM Sans',sans-serif;
    box-shadow:0 4px 20px rgba(16,185,129,.35);
    display:flex; align-items:center; gap:8px;
    transition:opacity .15s, transform .15s;
  }
  .analyze-btn:hover{ opacity:.92; transform:translateY(-1px); }
  .analyze-btn:active{ transform:translateY(0); }
  .analyze-btn:disabled{ opacity:.4; cursor:not-allowed; transform:none; }
  .mic-active{ animation:micPulse 1s ease-in-out infinite; }
  @keyframes micPulse{ 0%,100%{ transform:scale(1); } 50%{ transform:scale(1.2); } }
  .hb-root:not(.hb-dark) .online-dot{ box-shadow:0 0 6px #10b981,0 0 12px #a7f3d0; }
  .emergency-overlay{
    position:fixed; inset:0; background:rgba(0,0,0,.82);
    display:flex; align-items:center; justify-content:center;
    z-index:999; animation:fadeIn .2s ease;
  }
  @keyframes fadeIn{ from{opacity:0} to{opacity:1} }
  .emergency-card{
    background:var(--card); border:1px solid rgba(239,68,68,.4);
    border-radius:20px; padding:32px 28px;
    max-width:340px; width:90%; text-align:center;
    box-shadow:0 0 60px rgba(239,68,68,.25);
    animation:scaleIn .25s cubic-bezier(.22,1,.36,1);
  }
  @keyframes scaleIn{ from{transform:scale(.9);opacity:0} to{transform:scale(1);opacity:1} }
  .summary-card{
    background:var(--green-dim); border:1px solid var(--border);
    border-radius:14px; padding:12px 16px; margin:0 16px 10px;
  }
`;
/* ===============================================================================
   MAIN COMPONENT
=============================================================================== */
export default function Chat() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState({});
    const [phase, setPhase] = useState("intake");  // intake | ready | chat
    const [loading, setLoading] = useState(false);
    const [botTyping, setBotTyping] = useState(false);
    const [alert, setAlert] = useState("");
    const [language, setLanguage] = useState("en");
    const [listening, setListening] = useState(false);
    const [emergency, setEmergency] = useState(false);
    const [dark, setDark] = useState(() => localStorage.getItem("hb-theme") === "dark");
    const recognitionRef = useRef(null);
    const bottomRef = useRef(null);
    const inputRef = useRef(null);
    const alarmCtxRef = useRef(null);
    const alarmIntervalRef = useRef(null);
    /* ── Theme persist ── */
    useEffect(() => {
        localStorage.setItem("hb-theme", dark ? "dark" : "light");
    }, [dark]);
    /* ── Speech Recognition ── */
    useEffect(() => {
        if (!("webkitSpeechRecognition" in window)) return;
        const r = new window.webkitSpeechRecognition();
        r.continuous = false; r.interimResults = false;
        r.lang = language === "hi" ? "hi-IN" : language === "mr" ? "mr-IN" : "en-US";
        r.onstart = () => setListening(true);
        r.onend = () => setListening(false);
        r.onresult = e => setInput(e.results[0][0].transcript);
        recognitionRef.current = r;
    }, [language]);
    /* ── Auto-scroll ── */
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, botTyping]);
    /* ── First question on mount ── */
    useEffect(() => {
        setTimeout(() => pushBotAnimated(INTAKE_QUESTIONS[0].text), 500);
    }, []);
    /* ── Helpers ── */
    const stopAlarm = () => {
        if (alarmIntervalRef.current) {
            clearInterval(alarmIntervalRef.current);
            alarmIntervalRef.current = null;
        }
        if (alarmCtxRef.current) {
            alarmCtxRef.current.close().catch((err) => {
                console.warn("Unable to stop alarm audio context cleanly:", err);
            });
            alarmCtxRef.current = null;
        }
    };
    const playAlarm = () => {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            stopAlarm();
            const ctx = new AudioCtx();
            alarmCtxRef.current = ctx;
            const beep = (freq, length, startAt = 0) => {
                const oscillator = ctx.createOscillator();
                const gain = ctx.createGain();
                oscillator.type = "sawtooth";
                oscillator.frequency.setValueAtTime(freq, ctx.currentTime + startAt);
                gain.gain.setValueAtTime(0.001, ctx.currentTime + startAt);
                gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + startAt + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startAt + length);
                oscillator.connect(gain);
                gain.connect(ctx.destination);
                oscillator.start(ctx.currentTime + startAt);
                oscillator.stop(ctx.currentTime + startAt + length);
            };
            const pulse = () => {
                beep(880, 0.18, 0);
                beep(660, 0.2, 0.22);
            };
            pulse();
            alarmIntervalRef.current = setInterval(pulse, 900);
        } catch (err) {
            console.warn("Unable to synthesize emergency alarm sound:", err);
        }
    };
    function detectEmergency(text, risk) {
        const lower = text.toLowerCase();
        if ((risk === "High" || EMERGENCY_KEYWORDS.some(w => lower.includes(w))) && !emergency) {
            setEmergency(true); playAlarm();
        }
    }
    useEffect(() => () => stopAlarm(), []);
    function showAlert(msg) { setAlert(msg); setTimeout(() => setAlert(""), 3000); }
    /* ── Section-based bot message (max 3-4 cards) ── */
    async function pushBotAnimated(fullText, extra = {}) {
        const cards = splitIntoCards(fullText);
        setBotTyping(true);
        for (let i = 0; i < cards.length; i++) {
            await delay(i === 0 ? 650 : 480);
            setBotTyping(false);
            setMessages(prev => [...prev, { role: "bot", text: cards[i], ...extra }]);
            if (i < cards.length - 1) { await delay(280); setBotTyping(true); }
        }
        setBotTyping(false);
    }
    /* ── Handle user send ── */
    async function handleSend(overrideText) {
        const text = (overrideText ?? input).trim();
        if (!text || loading || botTyping) return;
        setInput("");
        setMessages(prev => [...prev, { role: "user", text }]);
        if (phase === "intake") {
            const currentQ = INTAKE_QUESTIONS[step];
            const newAnswers = { ...answers, [currentQ.key]: text };
            setAnswers(newAnswers);
            const nextStep = step + 1;
            if (nextStep < INTAKE_QUESTIONS.length) {
                setStep(nextStep);
                await delay(200);
                await pushBotAnimated(INTAKE_QUESTIONS[nextStep].text);
            } else {
                setStep(nextStep);
                setPhase("ready");
                await delay(200);
                await pushBotAnimated(
                    "Thanks for sharing that! I have everything I need. \u{1FA7A} " +
                    "Tap the Analyze button below and I'll give you a detailed assessment."
                );
            }
        } else if (phase === "chat") {
            await sendToBackend(text, false);
        }
    }
    /* ── Send to backend ── */
    async function sendToBackend(userMessage, isAnalysis) {
        setLoading(true); setBotTyping(true);
        try {
            const analysisMessage = Object.entries(answers)
                .filter(([, v]) => v && v.toLowerCase() !== "none")
                .map(([k, v]) => `${k}: ${v}`)
                .join(". ");
            const payload = isAnalysis
                ? { type: "analysis", message: analysisMessage, answers, lang: language }
                : { type: "followup", message: userMessage, context: answers, lang: language };
            const res = await API.post("/api/chat", payload);
            const { reply, prediction, isProfileQuestion } = res.data;
            // Strip any leftover "Risk: ..." line from reply text (backend should already strip it,
            // but this is a safety net so the risk badge is the single source of truth)
            const replyText = (reply || "I'm sorry, I couldn't process that.")
                .replace(/\n*\s*Risk:\s*(High|Medium|Low)\s*$/i, "").trimEnd();
            // Use inferRisk to properly assess severity based on backend + user input
            const risk = isProfileQuestion ? null : inferRisk(prediction?.risk, answers);
            const disease = prediction?.disease;
            setBotTyping(false);
            await pushBotAnimated(replyText, { risk, disease, isProfileQuestion: !!isProfileQuestion });
            if (!isProfileQuestion) detectEmergency(userMessage || "", risk);
        } catch {
            setBotTyping(false);
            showAlert("\u26A0\uFE0F Server error. Please try again.");
            setMessages(prev => prev.slice(0, -1));
        } finally {
            setLoading(false);
            inputRef.current?.focus();
        }
    }
    /* ── Analyze button ── */
    async function handleAnalyze() {
        if (loading || botTyping) return;
        setPhase("chat");
        setMessages(prev => [...prev, { role: "user", text: "\u{1F50D} Analyze my symptoms" }]);
        await sendToBackend(null, true);
    }
    /* ── Quick prompt (empty-state shortcut) ── */
    async function handleQuickPrompt(text) {
        setPhase("chat");
        setAnswers({ symptom: text });
        setMessages(prev => [...prev, { role: "user", text }]);
        await sendToBackend(text, false);
    }
    /* ── Derived ── */
    const currentQ = INTAKE_QUESTIONS[step] || null;
    const showChips = phase === "intake" && currentQ?.chips && !botTyping && !loading;
    const showAnalyze = phase === "ready" && !botTyping && !loading;
    const inputLocked = phase === "ready" || botTyping || loading;
    const cardShadow = dark
        ? "0 24px 60px rgba(0,0,0,.5)"
        : "0 8px 40px rgba(5,150,105,.12), 0 1px 0 rgba(16,185,129,.1)";
    /* ════════════════════════════════════════════════════════════════
       RENDER
    ════════════════════════════════════════════════════════════════ */
    return (
        <>
            <style>{STYLES}</style>
            <div className={`hb-root${dark ? " hb-dark" : ""}`} style={{ padding: "0 12px 24px" }}>
                <SeasonalAlert />
                {/* ── Alert banner ── */}
                {alert && (
                    <div style={{
                        position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
                        background: dark ? "#450a0a" : "#fef2f2",
                        color: dark ? "#fca5a5" : "#dc2626",
                        border: `1px solid ${dark ? "#ef4444" : "#fca5a5"}`,
                        padding: "10px 20px", borderRadius: 10, zIndex: 100,
                        fontFamily: "'DM Sans',sans-serif", fontSize: 13,
                        boxShadow: "0 4px 20px rgba(220,38,38,.2)",
                    }}>{alert}</div>
                )}
                {/* ── Emergency overlay ── */}
                {emergency && (
                    <div className="emergency-overlay">
                        <div className="emergency-card">
                            <div style={{ fontSize: 40, marginBottom: 8 }}>{"\u{1F6A8}"}</div>
                            <h2 style={{ fontFamily: "'Syne',sans-serif", fontSize: 20, color: "var(--red)", marginBottom: 6 }}>
                                Emergency Detected
                            </h2>
                            <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 20 }}>
                                Immediate medical attention may be required.
                            </p>
                            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                                <a href="tel:102" style={{
                                    background: "#dc2626", color: "#fff", padding: "10px 20px",
                                    borderRadius: 10, textDecoration: "none", fontSize: 13, fontWeight: 600,
                                }}>{"\u{1F4DE}"} Call 102</a>
                                <button onClick={() => window.location.href = "/hospitals"} style={{
                                    background: "#1d4ed8", color: "#fff", padding: "10px 20px",
                                    border: "none", borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600,
                                }}>{"\u{1F3E5}"} Find Hospitals</button>
                            </div>
                            <button onClick={stopAlarm} style={{
                                marginTop: 12, color: "#b91c1c", background: "none",
                                border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
                            }}>🔇 Silence alarm</button>
                            <button onClick={() => { stopAlarm(); setEmergency(false); }} style={{
                                marginTop: 18, color: "var(--muted)", background: "none",
                                border: "none", cursor: "pointer", fontSize: 13,
                            }}>Dismiss</button>
                        </div>
                    </div>
                )}
                {/* ── Header ── */}
                <div style={{
                    maxWidth: 780, margin: "0 auto", padding: "20px 0 16px",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{
                            width: 42, height: 42, borderRadius: 13,
                            background: "linear-gradient(135deg,#10b981,#059669)",
                            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21,
                            boxShadow: dark ? "0 0 20px rgba(16,185,129,.3)" : "0 4px 16px rgba(5,150,105,.25)",
                        }}>{"\u{1FA7A}"}</div>
                        <div>
                            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 17, letterSpacing: "-.01em", color: "var(--text)" }}>
                                HealthBot
                            </div>
                            <div style={{ fontSize: 11, color: "var(--muted)", display: "flex", alignItems: "center", gap: 6 }}>
                                <span className="online-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                                AI Online
                            </div>
                        </div>
                        <EcgLine />
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <button className="theme-btn" onClick={() => setDark(d => !d)} title="Toggle theme">
                            {dark ? "\u2600\uFE0F" : "\u{1F319}"}
                        </button>
                        <select className="lang-select" value={language} onChange={e => setLanguage(e.target.value)}>
                            <option value="en">{"\u{1F310}"} English</option>
                            <option value="hi">{"\u{1F1EE}\u{1F1F3}"} {"\u0939\u093F\u0902\u0926\u0940"}</option>
                            <option value="mr">{"\u{1F1EE}\u{1F1F3}"} {"\u092E\u0930\u093E\u0920\u0940"}</option>
                        </select>
                    </div>
                </div>
                {/* ── Progress bar ── */}
                {phase === "intake" && (
                    <div style={{
                        maxWidth: 780, margin: "0 auto 10px",
                        display: "flex", alignItems: "center", gap: 10, padding: "0 2px",
                    }}>
                        <div style={{ flex: 1, height: 4, background: "var(--green-light)", borderRadius: 4, overflow: "hidden" }}>
                            <div style={{
                                height: "100%", borderRadius: 4,
                                background: "linear-gradient(90deg,#10b981,#059669)",
                                width: `${(step / INTAKE_QUESTIONS.length) * 100}%`,
                                transition: "width .4s ease",
                            }} />
                        </div>
                        <span style={{ fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap", fontFamily: "'DM Mono',monospace" }}>
                            {step}/{INTAKE_QUESTIONS.length}
                        </span>
                    </div>
                )}
                {/* ── Chat container ── */}
                <div style={{
                    maxWidth: 780, margin: "0 auto",
                    background: "var(--surface)", border: "1px solid var(--border)",
                    borderRadius: 22, display: "flex", flexDirection: "column",
                    height: "70vh", overflow: "hidden", boxShadow: cardShadow,
                }}>
                    {/* Messages */}
                    <div className="hb-scroll" style={{ flex: 1, overflowY: "auto", padding: "20px 20px 8px" }}>
                        {/* Empty state */}
                        {messages.length === 0 && !botTyping && (
                            <div style={{
                                height: "100%", display: "flex", flexDirection: "column",
                                alignItems: "center", justifyContent: "center",
                                textAlign: "center", padding: "0 20px",
                            }}>
                                <div style={{
                                    width: 80, height: 80, borderRadius: 24,
                                    background: dark ? "linear-gradient(135deg,#064e3b,#065f46)" : "linear-gradient(135deg,#d1fae5,#a7f3d0)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 36, marginBottom: 18,
                                    boxShadow: dark ? "0 0 40px rgba(16,185,129,.2)" : "0 8px 32px rgba(5,150,105,.2)",
                                    border: dark ? "none" : "1px solid rgba(16,185,129,.2)",
                                }}>{"\u{1FA7A}"}</div>
                                <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22, marginBottom: 6, color: "var(--text)" }}>
                                    How can I help you today?
                                </div>
                                <p style={{ color: "var(--muted)", fontSize: 13, maxWidth: 320, lineHeight: 1.7, marginBottom: 24 }}>
                                    Describe your symptoms and I'll analyse them, ask follow-up questions, and give you a health assessment.
                                </p>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 440 }}>
                                    {QUICK_PROMPTS.map(q => (
                                        <button key={q} className="quick-chip" onClick={() => handleQuickPrompt(q)}>{q}</button>
                                    ))}
                                </div>
                                <div style={{ marginTop: 28, display: "flex", gap: 24 }}>
                                    {[{ icon: "\u{1F52C}", label: "Symptom Analysis" }, { icon: "\u{1F4CA}", label: "Risk Assessment" }, { icon: "\u{1F48A}", label: "Health Advice" }].map(({ icon, label }) => (
                                        <div key={label} style={{ textAlign: "center" }}>
                                            <div style={{
                                                width: 44, height: 44, borderRadius: 14,
                                                background: dark ? "var(--card)" : "var(--green-dim)",
                                                border: "1px solid var(--border)",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                fontSize: 20, margin: "0 auto 6px",
                                            }}>{icon}</div>
                                            <div style={{ fontSize: 11, color: "var(--muted)" }}>{label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {/* Message list */}
                        {messages.map((msg, i) => {
                            const isUser = msg.role === "user";
                            const risk = msg.risk ? riskConfig(msg.risk, dark) : null;
                            return (
                                <div key={i} className="msg-in" style={{
                                    display: "flex",
                                    justifyContent: isUser ? "flex-end" : "flex-start",
                                    marginBottom: 14, alignItems: "flex-end", gap: 8,
                                }}>
                                    {!isUser && (
                                        <div style={{
                                            width: 30, height: 30, borderRadius: 10, flexShrink: 0,
                                            background: msg.isProfileQuestion
                                                ? (dark ? "linear-gradient(135deg,#1d4ed8,#1e40af)" : "linear-gradient(135deg,#0284c7,#0369a1)")
                                                : "linear-gradient(135deg,#10b981,#059669)",
                                            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                                            boxShadow: dark ? "none" : "0 2px 8px rgba(5,150,105,.2)",
                                        }}>
                                            {msg.isProfileQuestion ? "\u{1F4CB}" : "\u{1FA7A}"}
                                        </div>
                                    )}
                                    <div style={{ maxWidth: "72%" }}>
                                        {msg.isProfileQuestion && (
                                            <div style={{
                                                fontSize: 10, color: dark ? "#60a5fa" : "#0284c7",
                                                fontWeight: 600, letterSpacing: ".06em",
                                                marginBottom: 4, fontFamily: "'DM Mono',monospace",
                                            }}>PROFILE SETUP</div>
                                        )}
                                        <div style={{
                                            padding: "11px 15px",
                                            borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                                            background: isUser ? "var(--user-bubble)"
                                                : msg.isProfileQuestion ? "var(--profile-bg)" : "var(--bot-bubble)",
                                            border: isUser ? "none"
                                                : msg.isProfileQuestion ? "1px solid var(--profile-bdr)" : "1px solid var(--bot-border)",
                                            color: isUser ? "var(--user-text)" : "var(--text-body)",
                                            fontSize: 13.5, lineHeight: 1.65, whiteSpace: "pre-wrap", wordBreak: "break-word",
                                            boxShadow: isUser ? "var(--shadow-user)" : dark ? "none" : "0 2px 12px rgba(5,150,105,.06)",
                                        }}>
                                            {msg.text}
                                        </div>
                                        {!isUser && risk && !msg.isProfileQuestion && (
                                            <div className="risk-pill" style={{ background: risk.bg, color: risk.color, border: `1px solid ${risk.color}33` }}>
                                                <span style={{ width: 5, height: 5, borderRadius: "50%", background: risk.dot, display: "inline-block" }} />
                                                {risk.label}
                                                {msg.disease && msg.disease !== "Unknown" && msg.disease !== "None" && (
                                                    <span style={{ opacity: .6 }}>{"\u00B7"} {msg.disease}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {isUser && (
                                        <div style={{
                                            width: 30, height: 30, borderRadius: 10, flexShrink: 0,
                                            background: dark ? "var(--surface)" : "var(--green-dim)",
                                            border: "1px solid var(--border)",
                                            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                                        }}>{"\u{1F464}"}</div>
                                    )}
                                </div>
                            );
                        })}
                        {/* Typing indicator */}
                        {botTyping && (
                            <div className="msg-in" style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 14 }}>
                                <div style={{
                                    width: 30, height: 30, borderRadius: 10,
                                    background: "linear-gradient(135deg,#10b981,#059669)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 14, boxShadow: dark ? "none" : "0 2px 8px rgba(5,150,105,.2)",
                                }}>{"\u{1FA7A}"}</div>
                                <div style={{
                                    padding: "13px 18px", background: "var(--bot-bubble)",
                                    border: "1px solid var(--bot-border)",
                                    borderRadius: "18px 18px 18px 4px",
                                    boxShadow: dark ? "none" : "0 2px 12px rgba(5,150,105,.06)",
                                }}>
                                    <TypingDots />
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>
                    {/* ── Intake chips ── */}
                    {showChips && (
                        <div style={{
                            padding: "4px 16px 10px", display: "flex", gap: 8, flexWrap: "wrap",
                            borderTop: "1px solid var(--border)", background: "var(--input-bar)",
                        }}>
                            {currentQ.chips.map(chip => (
                                <button key={chip} className="intake-chip" onClick={() => handleSend(chip)}>{chip}</button>
                            ))}
                        </div>
                    )}
                    {/* ── Analyze button + summary ── */}
                    {showAnalyze && (
                        <>
                            <div className="summary-card">
                                <p style={{
                                    margin: "0 0 8px", fontSize: 10, fontWeight: 600,
                                    color: dark ? "#6ee7b7" : "#059669",
                                    letterSpacing: ".07em", textTransform: "uppercase",
                                    fontFamily: "'DM Mono',monospace",
                                }}>Your answers</p>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 18px" }}>
                                    {Object.entries(answers).map(([k, v]) => (
                                        <div key={k} style={{ fontSize: 12 }}>
                                            <span style={{ color: "var(--muted)", textTransform: "capitalize" }}>{k}: </span>
                                            <span style={{ color: "var(--text-body)", fontWeight: 500 }}>{v}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div style={{ padding: "0 16px 14px", display: "flex", justifyContent: "center", background: "var(--input-bar)" }}>
                                <button className="analyze-btn" onClick={handleAnalyze} disabled={loading || botTyping}>
                                    {"\u{1F50D}"} Analyze My Symptoms
                                </button>
                            </div>
                        </>
                    )}
                    {/* ── Input bar ── */}
                    <div style={{
                        borderTop: "1px solid var(--border)", padding: "10px 14px 8px",
                        background: "var(--input-bar)", display: "flex", flexDirection: "column", gap: 8,
                    }}>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
                            <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
                                🖼️ Medical image upload (coming soon)
                            </p>
                            <button
                                disabled
                                style={{
                                    border: "1px solid var(--border)", background: "var(--surface)",
                                    color: "var(--text-body)", borderRadius: 10, padding: "8px 10px",
                                    fontSize: 12, cursor: "not-allowed",
                                    opacity: 0.6,
                                }}
                            >
                                🖼️ Choose Image
                            </button>
                        </div>
                    </div>
                    <div style={{
                        borderTop: "1px solid var(--border)", padding: "12px 14px",
                        display: "flex", gap: 10, alignItems: "center",
                        background: "var(--input-bar)",
                    }}>
                        <button
                            onClick={() => {
                                if (!recognitionRef.current) { showAlert("Speech not supported in this browser"); return; }
                                recognitionRef.current.start();
                            }}
                            className={listening ? "mic-active" : ""}
                            style={{
                                background: listening ? (dark ? "rgba(239,68,68,.15)" : "rgba(220,38,38,.08)") : "var(--card)",
                                border: `1px solid ${listening ? (dark ? "rgba(239,68,68,.4)" : "rgba(220,38,38,.3)") : "var(--border)"}`,
                                color: listening ? "var(--red)" : "var(--muted)",
                                width: 40, height: 40, borderRadius: 12,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer", fontSize: 16, flexShrink: 0, transition: "all .2s",
                            }}
                            title={listening ? "Listening\u2026" : "Voice input"}
                        >{"\u{1F3A4}"}</button>
                        <input
                            ref={inputRef}
                            className="hb-input"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                            placeholder={inputLocked ? "Tap Analyze to continue\u2026" : LANG_MAP[language].placeholder}
                            disabled={inputLocked}
                            style={{
                                flex: 1, background: "var(--input-bg)", border: "1px solid var(--border)",
                                borderRadius: 12, padding: "10px 16px",
                                fontSize: 13.5, fontFamily: "'DM Sans',sans-serif",
                                transition: "box-shadow .2s", opacity: inputLocked ? 0.5 : 1,
                            }}
                        />
                        <button
                            className="send-btn"
                            onClick={() => handleSend()}
                            disabled={!input.trim() || inputLocked}
                            style={{
                                background: "linear-gradient(135deg,#10b981,#059669)",
                                border: "none", borderRadius: 12, width: 42, height: 40,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer", flexShrink: 0,
                                opacity: (!input.trim() || inputLocked) ? 0.4 : 1,
                            }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                                stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13" />
                                <polygon points="22 2 15 22 11 13 2 9 22 2" />
                            </svg>
                        </button>
                    </div>
                </div>
                {/* Footer */}
                <p style={{
                    textAlign: "center", color: "var(--muted)", fontSize: 11,
                    marginTop: 12, maxWidth: 780, marginLeft: "auto", marginRight: "auto",
                }}>
                    {"\u26A0\uFE0F"} AI-generated guidance only. Not a substitute for professional medical advice.
                </p>
            </div>
        </>
    );
}
