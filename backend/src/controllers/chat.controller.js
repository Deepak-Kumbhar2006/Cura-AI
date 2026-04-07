const axios = require("axios");
const { predictDisease } = require("../utils/symptoms");
const { detectLanguage, translateText } = require("../utils/translator");
const mongoose = require("mongoose");

const User = require("../models/user");
const ChatMessage = require("../models/chatMessage");

// ─────────────────────────────────────────────
// 🔧 Constants
// ─────────────────────────────────────────────
const MAX_HISTORY = 6;
const MAX_INPUT_LENGTH = 1000;
const CHAT_HISTORY_LOAD = 10;

// ─────────────────────────────────────────────
// 🧠 In-process memory
// ─────────────────────────────────────────────
const userMemory = {};

function initMemory(userId) {
  if (!userMemory[userId]) {
    userMemory[userId] = {
      history: [],
      profile: {},
      profileStep: -1,
      pendingMessage: null,
      stage: "profile",
      lastSymptoms: [],
      lastHealthMessage: null,
      dbHistoryLoaded: false,   // ✅ FIX: separate flag, NOT tied to history.length
      dbHistorySummary: "",
    };
  }
  return userMemory[userId];
}

// ─────────────────────────────────────────────
// 📋 Profile questions
// ─────────────────────────────────────────────
const PROFILE_QUESTIONS = [
  { key: "age", question: "Thanks for sharing. I’ll ask 5 quick questions so I can guide you better.\n\n1️⃣ What is your age?" },
  { key: "gender", question: "2️⃣ What gender do you identify with? (Male / Female / Other)" },
  { key: "conditions", question: "3️⃣ Do you have any existing medical conditions?\n(Example: diabetes, BP, asthma — or type 'None')" },
  { key: "allergies", question: "4️⃣ Do you have any known allergies?\n(If none, type 'None')" },
  { key: "medications", question: "5️⃣ Are you currently taking any regular medicines?\n(If none, type 'None')" },
];

function isProfileComplete(mem) {
  return mem.profileStep >= PROFILE_QUESTIONS.length;
}

function recordProfileAnswer(mem, answer) {
  const q = PROFILE_QUESTIONS[mem.profileStep];
  if (!q) return;
  let value = answer.trim();

  // ✅ FIX: normalize gender to match User model allowed values
  if (q.key === "gender") {
    const map = {
      male: "male", m: "male",
      female: "female", f: "female",
      other: "other", o: "other",
    };
    value = map[value.toLowerCase()] || "other";
  }

  mem.profile[q.key] = value;
  mem.profileStep += 1;
}

function dbProfileComplete(userDoc) {
  if (!userDoc) return false;
  return !!(userDoc.age && userDoc.gender);
}

// ─────────────────────────────────────────────
// 🚨 Emergency
// ─────────────────────────────────────────────
const EMERGENCY_KEYWORDS = ["chest pain", "breathing problem", "unconscious", "severe bleeding"];
const NEGATION_PREFIXES = ["no ", "not ", "without ", "never ", "don't have ", "do not have "];

function isEmergency(text) {
  const lower = text.toLowerCase();
  return EMERGENCY_KEYWORDS.some((keyword) => {
    const idx = lower.indexOf(keyword);
    if (idx === -1) return false;
    const before = lower.slice(Math.max(0, idx - 20), idx);
    return !NEGATION_PREFIXES.some((neg) => before.endsWith(neg));
  });
}

// ─────────────────────────────────────────────
// 🤖 AI Providers
// ─────────────────────────────────────────────
async function openRouterAI(messages) {
  if (!process.env.OPENROUTER_API_KEY) return null;
  try {
    const res = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      { model: "openai/gpt-3.5-turbo", messages, temperature: 0.2, max_tokens: 400 },
      { headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, "Content-Type": "application/json" } }
    );
    return res.data?.choices?.[0]?.message?.content || null;
  } catch (err) { console.warn("OpenRouter Error:", err.message); return null; }
}

async function groqAI(messages) {
  if (!process.env.GROQ_API_KEY) return null;
  try {
    const res = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      { model: "llama3-8b-8192", messages, temperature: 0.2, max_tokens: 400 },
      { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" } }
    );
    return res.data?.choices?.[0]?.message?.content || null;
  } catch (err) { console.warn("Groq Error:", err.message); return null; }
}

async function geminiAI(prompt) {
  if (!process.env.GEMINI_API_KEY) return null;
  try {
    const res = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      { contents: [{ parts: [{ text: prompt }] }] }
    );
    return res.data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (err) { console.warn("Gemini Error:", err.message); return null; }
}

async function hfAI(prompt) {
  if (!process.env.HF_API_KEY) return null;
  try {
    const res = await axios.post(
      "https://api-inference.huggingface.co/models/google/flan-t5-large",
      { inputs: prompt },
      { headers: { Authorization: `Bearer ${process.env.HF_API_KEY}` } }
    );
    return res.data?.[0]?.generated_text || null;
  } catch (err) { console.warn("HuggingFace Error:", err.message); return null; }
}

async function smartAI(messages) {
  const flat = messages.map((m) => `${m.role}: ${m.content}`).join("\n");
  const providers = [
    { name: "OpenRouter", fn: () => openRouterAI(messages) },
    { name: "Groq", fn: () => groqAI(messages) },
    { name: "Gemini", fn: () => geminiAI(flat) },
    { name: "HuggingFace", fn: () => hfAI(flat) },
  ];
  for (const p of providers) {
    const reply = await p.fn();
    if (reply) { console.log(`✅ AI: ${p.name}`); return reply; }
    console.warn(`⚠️ ${p.name} failed`);
  }
  return null;
}

// ─────────────────────────────────────────────
// 📜 Load past chat history from DB
// ─────────────────────────────────────────────
async function loadDbChatHistory(dbUserId) {
  if (!dbUserId) return { messages: [], summary: "" };
  try {
    const past = await ChatMessage.find({ user: dbUserId })
      .sort({ createdAt: -1 })
      .limit(CHAT_HISTORY_LOAD)
      .lean();

    if (!past.length) return { messages: [], summary: "" };

    past.reverse(); // oldest first for AI context

    const messages = past.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }));

    const lines = past.map(
      (m) => `[${new Date(m.createdAt).toLocaleDateString()}] ${m.role === "assistant" ? "Bot" : "Patient"}: ${m.content}`
    );

    return { messages, summary: lines.join("\n") };
  } catch (err) {
    console.warn("loadDbChatHistory error:", err.message);
    return { messages: [], summary: "" };
  }
}

// ─────────────────────────────────────────────
// 🧠 Helpers
// ─────────────────────────────────────────────
function detectIntent(message) {
  const msg = message.toLowerCase();
  if (["hi", "hello", "hey", "hii", "good morning"].some((g) => msg.includes(g))) return "greeting";
  if (["how are you", "what's up", "who are you"].some((c) => msg.includes(c))) return "casual";
  return "medical";
}

async function extractSymptoms(message) {
  try {
    const res = await openRouterAI([
      { role: "system", content: "Extract only medical symptoms from the text as a comma-separated list. Return ONLY the symptoms, nothing else." },
      { role: "user", content: message },
    ]);
    if (!res) return [];
    return res.toLowerCase().split(",").map((s) => s.trim()).filter(Boolean);
  } catch { return []; }
}

const SEVERE_WORDS = ["severe", "unbearable", "continuous", "blood", "vomiting", "high fever", "chest pain"];
function detectSeverity(message) {
  return SEVERE_WORDS.some((w) => message.toLowerCase().includes(w)) ? "High" : "Low";
}

/**
 * Parse "Risk: High/Medium/Low" from AI reply text and strip it.
 * Returns { cleanReply, parsedRisk }.
 */
function parseAndStripRisk(reply) {
  const riskMatch = reply.match(/\n*\s*Risk:\s*(High|Medium|Low)\s*$/i);
  const parsedRisk = riskMatch ? riskMatch[1].charAt(0).toUpperCase() + riskMatch[1].slice(1).toLowerCase() : null;
  const cleanReply = riskMatch ? reply.slice(0, riskMatch.index).trimEnd() : reply;
  return { cleanReply, parsedRisk };
}

const SYMPTOM_QUESTIONS = {
  fever: ["How high is your temperature?", "How long have you had the fever?"],
  headache: ["Is the pain constant or does it come and go?", "Do you feel nausea or sensitivity to light?"],
  cold: ["Do you have a runny or blocked nose?", "Do you have a sore throat?"],
  cough: ["Is your cough dry or producing mucus?", "How many days have you had the cough?"],
  pain: ["On a scale of 1–10, how severe is the pain?", "Is the pain in one spot or does it spread?"],
  vomiting: ["How many times have you vomited?", "Did it start suddenly or gradually?"],
  fatigue: ["Are you sleeping normally?", "Is the fatigue getting worse over time?"],
  default: ["How long have you been experiencing this?", "Do you have any other symptoms?"],
};

function getRuleBasedFollowup(symptoms, message) {
  const lower = message.toLowerCase();
  for (const [key, questions] of Object.entries(SYMPTOM_QUESTIONS)) {
    if (key !== "default" && (symptoms.includes(key) || lower.includes(key))) return questions;
  }
  return SYMPTOM_QUESTIONS.default;
}

function buildProfileText(memProfile, userDoc) {
  const lines = [];
  const age = memProfile?.age || userDoc?.age;
  const gender = memProfile?.gender || userDoc?.gender;
  const conditions = memProfile?.conditions || userDoc?.existingMedicalConditions?.join(", ");
  const allergies = memProfile?.allergies || userDoc?.allergies?.join(", ");
  const medications = memProfile?.medications || userDoc?.medications?.join(", ");
  if (age) lines.push(`Age: ${age}`);
  if (gender) lines.push(`Gender: ${gender}`);
  if (conditions && conditions.toLowerCase() !== "none") lines.push(`Existing conditions: ${conditions}`);
  if (allergies && allergies.toLowerCase() !== "none") lines.push(`Allergies: ${allergies}`);
  if (medications && medications.toLowerCase() !== "none") lines.push(`Current medications: ${medications}`);
  return lines.length ? lines.join("\n") : "Not provided.";
}

async function resolveUser(userId) {
  if (!userId || userId === "default") return { userDoc: null, dbUserId: null };
  const select = "age gender existingMedicalConditions allergies medications";
  try {
    if (mongoose.Types.ObjectId.isValid(userId)) {
      const userDoc = await User.findById(userId).select(select).lean();
      return { userDoc, dbUserId: userDoc?._id ?? null };
    } else {
      const userDoc = await User.findOne({ whatsappId: userId }).select(select).lean();
      return { userDoc, dbUserId: userDoc?._id ?? null };
    }
  } catch { return { userDoc: null, dbUserId: null }; }
}

async function persistMessages(dbUserId, userMsg, botMsg, lang) {
  if (!dbUserId) return;
  try {
    await ChatMessage.create([
      { user: dbUserId, role: "user", content: userMsg, lang: lang || "en" },
      { user: dbUserId, role: "assistant", content: botMsg, lang: lang || "en" },
    ]);
  } catch (err) { console.warn("ChatMessage save failed:", err.message); }
}

// ─────────────────────────────────────────────
// 🧠 MAIN LOGIC
// ─────────────────────────────────────────────
async function getAIReply(message, userId = "default", forcedLang = null) {

  if (message.length > MAX_INPUT_LENGTH) {
    return {
      reply: `⚠️ Your message is too long. Please keep it under ${MAX_INPUT_LENGTH} characters.\n\n⚠️ This is not medical advice.`,
      prediction: { disease: "None", risk: "Low", confidence: "0.00", symptomsDetected: [] },
      messageType: "error",
    };
  }

  const intent = detectIntent(message);
  if (intent === "greeting") {
    return {
      reply: "👋 Hi! I'm your AI Health Assistant. Tell me your symptoms and I'll help you.",
      prediction: { disease: "None", risk: "Low", confidence: "0.00", symptomsDetected: [] },
      messageType: "greeting",
    };
  }
  if (intent === "casual") {
    return {
      reply: "😊 I'm here to help with health-related questions. Tell me your symptoms.",
      prediction: { disease: "None", risk: "Low", confidence: "0.00", symptomsDetected: [] },
      messageType: "casual",
    };
  }

  const mem = initMemory(userId);
  const { userDoc, dbUserId } = await resolveUser(userId);
  const lang = forcedLang || (await detectLanguage(message));
  const msgEn = lang === "en" ? message : await translateText(message, "en");
  const lower = msgEn.toLowerCase();

  if (isEmergency(lower)) {
    let msg = "🚨 This may be a medical emergency. Please go to the nearest hospital immediately.";
    if (lang !== "en") msg = await translateText(msg, lang);
    return {
      reply: `${msg}\n\n⚠️ This is not medical advice.`,
      prediction: { disease: "Unknown", risk: "High", confidence: "0.00", symptomsDetected: [] },
      messageType: "emergency",
    };
  }

  // ✅ FIX: use dbHistoryLoaded flag — not history.length
  // This means DB history loads exactly once per server session per user,
  // regardless of whether they already have in-memory messages.
  if (!mem.dbHistoryLoaded && dbUserId) {
    const { messages: dbMessages, summary: dbSummary } = await loadDbChatHistory(dbUserId);
    // Prepend DB history before any in-memory messages built this session
    mem.history = [...dbMessages.slice(-MAX_HISTORY), ...mem.history].slice(-MAX_HISTORY);
    mem.dbHistorySummary = dbSummary;
    mem.dbHistoryLoaded = true;  // never reload again this server session
    console.log(`📜 Loaded ${dbMessages.length} past messages from DB for user ${userId}`);
  }

  // ── Skip profile if DB already has age + gender ──
  if (dbProfileComplete(userDoc) && mem.profileStep === -1) {
    mem.profileStep = PROFILE_QUESTIONS.length;
    mem.stage = "followup";
  }

  // ─────────────────────────────────────────────
  // STAGE 1: PROFILE COLLECTION
  // ─────────────────────────────────────────────
  if (mem.stage === "profile" && !isProfileComplete(mem)) {

    if (mem.profileStep === -1) {
      mem.pendingMessage = msgEn;
      mem.profileStep = 0;
      const q = PROFILE_QUESTIONS[0];
      let reply = q.question;
      if (lang !== "en") reply = await translateText(reply, lang);
      const finalReply = `${reply}\n\n⚠️ This is not medical advice.`;
      await persistMessages(dbUserId, message, finalReply, lang);
      return { reply: finalReply, prediction: { disease: "None", risk: "Low", confidence: "0.00", symptomsDetected: [] }, messageType: "profile" };
    }

    recordProfileAnswer(mem, msgEn);

    if (!isProfileComplete(mem)) {
      const nextQ = PROFILE_QUESTIONS[mem.profileStep];
      let reply = nextQ.question;
      if (lang !== "en") reply = await translateText(reply, lang);
      const finalReply = `${reply}\n\n⚠️ This is not medical advice.`;
      await persistMessages(dbUserId, message, finalReply, lang);
      return { reply: finalReply, prediction: { disease: "None", risk: "Low", confidence: "0.00", symptomsDetected: [] }, messageType: "profile" };
    }

    mem.stage = "followup";
  }

  // ─────────────────────────────────────────────
  // STAGE 2: FOLLOW-UP QUESTIONS
  // ─────────────────────────────────────────────
  if (mem.stage === "followup") {
    const healthMessage = mem.pendingMessage || msgEn;
    mem.pendingMessage = null;

    const symptoms = await extractSymptoms(healthMessage);
    const profileText = buildProfileText(mem.profile, userDoc);

    const historyContext = mem.dbHistorySummary
      ? `\n\nPast conversation history with this patient:\n${mem.dbHistorySummary}\n\nUse this history to understand recurring symptoms, previous conditions, and continuity of care.`
      : "";

    const followupPrompt = `You are a caring medical triage assistant. Your ONLY job right now is to ask 2 follow-up questions.

Patient profile:
${profileText}${historyContext}

Patient complaint: "${healthMessage}"

STRICT RULES — you MUST follow ALL of these:
- Do NOT mention any disease or condition name
- Do NOT give precautions or advice
- Do NOT write "Most likely" or "possible causes"
- Keep language very simple and supportive
- Write ONLY 2 numbered questions (one sentence each)
- End with Risk level

Respond in EXACTLY this format:
1. [your first question]?
2. [your second question]?

Risk: Low`;

    let reply = await smartAI([
      { role: "system", content: followupPrompt },
      ...mem.history.slice(-MAX_HISTORY),
      { role: "user", content: `Patient says: ${healthMessage}` },
    ]);

    const badWords = ["most likely", "possible causes", "precaution", "flu", "cold", "infection", "diagnosis"];
    const repliedBadly = badWords.some((w) => reply?.toLowerCase().includes(w));

    if (!reply || !reply.includes("?") || repliedBadly) {
      const [q1, q2] = getRuleBasedFollowup(symptoms, healthMessage);
      reply = `1. ${q1}\n2. ${q2}\n\nRisk: Low`;
    }

    // Parse and strip "Risk: ..." from reply text so the frontend badge is the single source of truth
    const { cleanReply: followupClean, parsedRisk: followupRisk } = parseAndStripRisk(reply);
    const resolvedFollowupRisk = followupRisk || detectSeverity(healthMessage);
    reply = followupClean;

    if (lang !== "en") reply = await translateText(reply, lang);

    mem.history.push({ role: "user", content: healthMessage });
    mem.history.push({ role: "assistant", content: reply });
    mem.stage = "prediction";
    mem.lastSymptoms = symptoms;
    mem.lastHealthMessage = healthMessage;

    const finalReply = `${reply}\n\n⚠️ This is not medical advice.`;
    await persistMessages(dbUserId, message, finalReply, lang);

    return {
      reply: finalReply,
      prediction: { disease: "None", risk: resolvedFollowupRisk, confidence: "0.00", symptomsDetected: symptoms },
      messageType: "followup",
    };
  }

  // ─────────────────────────────────────────────
  // STAGE 3: PREDICTION
  // ─────────────────────────────────────────────
  if (mem.stage === "prediction") {
    const symptoms = mem.lastSymptoms || await extractSymptoms(msgEn);
    const originalComplaint = mem.lastHealthMessage || msgEn;
    const profileText = buildProfileText(mem.profile, userDoc);

    let prediction = null;
    try {
      const predInput = symptoms.length ? symptoms.join(" ") : originalComplaint;
      prediction = predictDisease(predInput);
    } catch { prediction = null; }

    const diseaseText = prediction
      ? `${prediction.disease} (confidence: ${prediction.confidence})`
      : "Unknown";

    const historyContext = mem.dbHistorySummary
      ? `\n\nPast conversation history with this patient:\n${mem.dbHistorySummary}\n\nConsider this history — note any recurring symptoms, previous diagnoses, or patterns that may affect this assessment.`
      : "";

    const predictionPrompt = `You are a friendly medical assistant giving a clear, user-friendly health assessment.

Patient profile:
${profileText}${historyContext}

Original complaint: "${originalComplaint}"
Patient's answers to follow-up questions: "${msgEn}"
Predicted condition from symptom analysis: ${diseaseText}

Write a simple, calm response in plain language. Use this structure exactly:

💡 What this may be: [condition name]

🔄 Other possible reasons: [1-2 alternatives]

✅ What you can do now:
- [short action 1]
- [short action 2]
- [short action 3]

🚨 Get urgent care now if: [1 clear line]

Tone requirements:
- Be empathetic and non-judgmental
- Avoid scary wording
- Keep it concise (max ~140 words)

End with: Risk: Low / Medium / High`;

    let reply = await smartAI([
      { role: "system", content: predictionPrompt },
      ...mem.history.slice(-MAX_HISTORY),
      { role: "user", content: msgEn },
    ]);

    if (!reply) {
      const risk = detectSeverity(originalComplaint);
      reply = `💡 What this may be: ${prediction?.disease || "a common short-term illness"}\n\n🔄 Other possible reasons: mild viral infection, dehydration\n\n✅ What you can do now:\n- Rest and drink fluids\n- Eat light, easy-to-digest meals\n- Track your symptoms for the next 24 hours\n\n🚨 Get urgent care now if: symptoms become severe, breathing is difficult, or you feel faint.\n\nRisk: ${risk}`;
    }

    // Parse and strip "Risk: ..." from reply text so the frontend badge is the single source of truth
    const { cleanReply: predClean, parsedRisk: predRisk } = parseAndStripRisk(reply);
    const resolvedPredRisk = predRisk || detectSeverity(originalComplaint);
    reply = predClean;

    if (lang !== "en") reply = await translateText(reply, lang);

    mem.history.push({ role: "user", content: msgEn });
    mem.history.push({ role: "assistant", content: reply });
    mem.stage = "done";

    const finalReply = `${reply}\n\n⚠️ This is not medical advice.`;
    await persistMessages(dbUserId, message, finalReply, lang);

    // Use parsed risk from AI reply (most accurate), fall back to rule-based severity
    const predPrediction = prediction
      ? { ...prediction, risk: resolvedPredRisk }
      : { disease: "Unknown", risk: resolvedPredRisk, confidence: "0.00", symptomsDetected: [] };

    return {
      reply: finalReply,
      prediction: predPrediction,
      messageType: "prediction",
    };
  }

  // ─────────────────────────────────────────────
  // STAGE 4: DONE — reset for new symptoms, keep history
  // ─────────────────────────────────────────────
  mem.stage = "followup";
  mem.history = mem.history.slice(-MAX_HISTORY); // ✅ keep context, don't wipe
  mem.lastSymptoms = [];
  mem.lastHealthMessage = msgEn;
  mem.pendingMessage = null;

  const symptoms = await extractSymptoms(msgEn);
  const [q1, q2] = getRuleBasedFollowup(symptoms, msgEn);
  let reply = `I see you have new symptoms. Let me ask a couple of questions first.\n\n1. ${q1}\n2. ${q2}`;
  const resetRisk = detectSeverity(msgEn);
  if (lang !== "en") reply = await translateText(reply, lang);

  mem.history.push({ role: "user", content: msgEn });
  mem.history.push({ role: "assistant", content: reply });
  mem.stage = "prediction";
  mem.lastSymptoms = symptoms;

  const finalReply = `${reply}\n\n⚠️ This is not medical advice.`;
  await persistMessages(dbUserId, message, finalReply, lang);

  return {
    reply: finalReply,
    prediction: { disease: "None", risk: resetRisk, confidence: "0.00", symptomsDetected: symptoms },
    messageType: "followup",
  };
}

// ─────────────────────────────────────────────
// 🌐 Express route handler
// ─────────────────────────────────────────────
async function chatWithAI(req, res) {
  try {
    const { message, lang, type, answers, context } = req.body;

    // Build a message string from intake answers when the frontend sends an analysis request
    let resolvedMessage = message;
    if (type === "analysis" && answers && typeof answers === "object") {
      const parts = [];
      if (answers.symptom) parts.push(`Main symptom: ${answers.symptom}`);
      if (answers.duration) parts.push(`Duration: ${answers.duration}`);
      if (answers.severity) parts.push(`Severity: ${answers.severity}`);
      if (answers.location) parts.push(`Location: ${answers.location}`);
      if (answers.extra && answers.extra.toLowerCase() !== "none") parts.push(`Other symptoms: ${answers.extra}`);
      resolvedMessage = parts.join(". ") || message;
    } else if (type === "followup" && !resolvedMessage && context) {
      // Fallback: use context if message is missing in followup mode
      resolvedMessage = message;
    }

    if (!resolvedMessage || typeof resolvedMessage !== "string") {
      return res.status(400).json({ message: "Message is required and must be a string." });
    }
    const userId = req.user?.id || "default";
    const { reply, prediction, messageType } = await getAIReply(resolvedMessage.trim(), userId, lang);
    return res.json({ reply, prediction, messageType, timestamp: new Date() });
  } catch (err) {
    console.error("chatWithAI error:", err);
    return res.status(500).json({ message: "Internal server error." });
  }
}

module.exports = { chatWithAI, getAIReply };
