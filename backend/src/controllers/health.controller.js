const ChatMessage = require("../models/chatMessage");
const User = require("../models/user");
const PDFDocument = require("pdfkit");
const axios = require("axios");

// ─────────────────────────────────────────────
// 🤖 AI helper (mirrors chat.controller pattern)
// ─────────────────────────────────────────────
async function callAI(systemPrompt, userPrompt) {
    // Try OpenRouter first, then Groq as fallback
    const providers = [
        {
            name: "OpenRouter",
            fn: async () => {
                if (!process.env.OPENROUTER_API_KEY) return null;
                const res = await axios.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    {
                        model: "openai/gpt-3.5-turbo",
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: userPrompt },
                        ],
                        temperature: 0.3,
                        max_tokens: 800,
                    },
                    { headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, "Content-Type": "application/json" } }
                );
                return res.data?.choices?.[0]?.message?.content || null;
            },
        },
        {
            name: "Groq",
            fn: async () => {
                if (!process.env.GROQ_API_KEY) return null;
                const res = await axios.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    {
                        model: "llama3-8b-8192",
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: userPrompt },
                        ],
                        temperature: 0.3,
                        max_tokens: 800,
                    },
                    { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" } }
                );
                return res.data?.choices?.[0]?.message?.content || null;
            },
        },
    ];

    for (const p of providers) {
        try {
            const reply = await p.fn();
            if (reply) return reply;
        } catch (err) {
            console.warn(`${p.name} insight error:`, err.message);
        }
    }
    return null;
}

// ─────────────────────────────────────────────
// 🔍 Build context string from ChatMessages
// ─────────────────────────────────────────────
function buildChatContext(messages) {
    return messages
        .map((m) => {
            const date = new Date(m.createdAt).toLocaleDateString("en-IN", {
                day: "2-digit", month: "short", year: "numeric",
            });
            const role = m.role === "assistant" ? "Bot" : "Patient";
            return `[${date}] ${role}: ${m.content}`;
        })
        .join("\n");
}

// ─────────────────────────────────────────────
// ✅ GET HEALTH HISTORY  (reads from ChatMessage)
// GET /api/health/history
// ─────────────────────────────────────────────
exports.getHealthHistory = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        const messages = await ChatMessage.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(60)
            .lean();

        if (!messages.length) {
            return res.json({ history: [], message: "No health history found yet." });
        }

        // Group into sessions (gap > 30 min = new session)
        const sessions = [];
        let current = [];

        for (let i = messages.length - 1; i >= 0; i--) {
            const msg = messages[i];
            if (current.length === 0) {
                current.push(msg);
            } else {
                const prev = current[current.length - 1];
                const gap = Math.abs(new Date(msg.createdAt) - new Date(prev.createdAt));
                if (gap > 30 * 60 * 1000) {
                    sessions.push(current);
                    current = [msg];
                } else {
                    current.push(msg);
                }
            }
        }
        if (current.length) sessions.push(current);

        return res.json({ history: sessions, totalMessages: messages.length });
    } catch (err) {
        console.error("getHealthHistory Error:", err);
        return res.status(500).json({ error: "Failed to fetch health history" });
    }
};

// ─────────────────────────────────────────────
// 💡 GET AI HEALTH INSIGHTS  (reads ChatMessage → AI summary)
// GET /api/health/insights
// ─────────────────────────────────────────────
exports.getHealthInsights = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        // Load user profile
        const userDoc = await User.findById(userId)
            .select("age gender existingMedicalConditions allergies medications")
            .lean();

        // Load recent chat messages
        const messages = await ChatMessage.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(40)
            .lean();

        if (!messages.length) {
            return res.json({
                insights: null,
                message: "Not enough health history to generate insights. Start by describing your symptoms in the chat.",
            });
        }

        const chatContext = buildChatContext([...messages].reverse());

        // Build user profile string
        const profileLines = [];
        if (userDoc?.age) profileLines.push(`Age: ${userDoc.age}`);
        if (userDoc?.gender) profileLines.push(`Gender: ${userDoc.gender}`);
        if (userDoc?.existingMedicalConditions?.length)
            profileLines.push(`Existing conditions: ${userDoc.existingMedicalConditions.join(", ")}`);
        if (userDoc?.allergies?.length)
            profileLines.push(`Allergies: ${userDoc.allergies.join(", ")}`);
        if (userDoc?.medications?.length)
            profileLines.push(`Current medications: ${userDoc.medications.join(", ")}`);
        const profileText = profileLines.length ? profileLines.join("\n") : "Not provided.";

        const systemPrompt = `You are a health insights analyst. Analyze a patient's chat history with a health bot and generate structured health insights. Be concise, factual, and empathetic. Do not diagnose — only summarize patterns and give general wellness guidance.`;

        const userPrompt = `Patient Profile:
${profileText}

Chat History (oldest to newest):
${chatContext}

Generate a structured health insights report in this EXACT format:

## 🩺 Symptom Summary
[List the main symptoms the patient reported across all sessions. Note any recurring ones.]

## 📊 Health Patterns
[Identify any trends — e.g., symptoms worsening over time, same symptoms returning, timing patterns.]

## ⚠️ Risk Assessment
Overall Risk Level: [Low / Medium / High]
[1-2 sentences explaining the risk level based on the history.]

## 💊 Wellness Recommendations
- [recommendation 1]
- [recommendation 2]
- [recommendation 3]

## 🏥 Should They See a Doctor?
[Clear yes/no with brief reason based on the history.]

Keep each section short and direct. Use plain language.`;

        const aiInsights = await callAI(systemPrompt, userPrompt);

        if (!aiInsights) {
            // Fallback: rule-based insights
            const allContent = messages.map((m) => m.content).join(" ").toLowerCase();
            const riskWords = ["severe", "high fever", "chest pain", "blood", "vomiting"];
            const hasRisk = riskWords.some((w) => allContent.includes(w));

            return res.json({
                insights: `## 🩺 Symptom Summary\nBased on your recent conversations, you have reported various health symptoms.\n\n## ⚠️ Risk Assessment\nOverall Risk Level: ${hasRisk ? "Medium" : "Low"}\nPlease monitor your symptoms.\n\n## 💊 Wellness Recommendations\n- Stay hydrated and rest well\n- Monitor symptoms regularly\n- Consult a doctor if symptoms worsen\n\n## 🏥 Should They See a Doctor?\n${hasRisk ? "Yes — some of your symptoms warrant a medical consultation." : "Not urgently, but visit a doctor if symptoms persist beyond 3 days."}`,
                source: "rule-based",
                totalMessages: messages.length,
            });
        }

        return res.json({
            insights: aiInsights,
            source: "ai",
            totalMessages: messages.length,
            generatedAt: new Date(),
        });

    } catch (err) {
        console.error("getHealthInsights Error:", err);
        return res.status(500).json({ error: "Failed to generate health insights" });
    }
};

// ─────────────────────────────────────────────
// 📄 DOWNLOAD PDF REPORT  (AI summary + full history)
// GET /api/health/report
// ─────────────────────────────────────────────
exports.downloadReport = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        // Load user profile
        const userDoc = await User.findById(userId)
            .select("name age gender existingMedicalConditions allergies medications email")
            .lean();

        // Load all chat messages
        const messages = await ChatMessage.find({ user: userId })
            .sort({ createdAt: 1 })   // oldest first for report
            .lean();

        // ── Generate AI Summary ──
        let aiSummary = null;
        if (messages.length > 0) {
            const chatContext = buildChatContext(messages);
            const profileLines = [];
            if (userDoc?.age) profileLines.push(`Age: ${userDoc.age}`);
            if (userDoc?.gender) profileLines.push(`Gender: ${userDoc.gender}`);
            if (userDoc?.existingMedicalConditions?.length)
                profileLines.push(`Existing conditions: ${userDoc.existingMedicalConditions.join(", ")}`);
            const profileText = profileLines.join("\n") || "Not provided.";

            aiSummary = await callAI(
                "You are a medical report writer. Write a brief, professional health summary for a PDF report based on a patient's chatbot conversation history. Be factual and concise.",
                `Patient Profile:\n${profileText}\n\nChat History:\n${chatContext}\n\nWrite a 3-4 paragraph health summary covering: main complaints, key findings, risk level, and recommendations. Professional tone.`
            );
        }

        // ── Build PDF ──
        const doc = new PDFDocument({ margin: 50, size: "A4" });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=health_report_${Date.now()}.pdf`);
        doc.pipe(res);

        // — Header bar —
        doc.rect(0, 0, doc.page.width, 80).fill("#16a34a");
        doc
            .fontSize(24).fillColor("white").font("Helvetica-Bold")
            .text("HealthBot", 50, 20)
            .fontSize(11).font("Helvetica")
            .text("Personal Health Report", 50, 50);
        doc.fillColor("black");
        doc.moveDown(3);

        // — Patient Info —
        doc.fontSize(14).font("Helvetica-Bold").fillColor("#16a34a").text("Patient Information");
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#16a34a").lineWidth(1).stroke();
        doc.moveDown(0.5);

        doc.fontSize(11).font("Helvetica").fillColor("#333333");
        const infoRows = [
            ["Name", userDoc?.name || "N/A"],
            ["Age", userDoc?.age ? `${userDoc.age} years` : "N/A"],
            ["Gender", userDoc?.gender || "N/A"],
            ["Email", userDoc?.email || "N/A"],
            ["Report Date", new Date().toLocaleString("en-IN")],
        ];
        for (const [label, value] of infoRows) {
            doc.font("Helvetica-Bold").text(`${label}: `, { continued: true }).font("Helvetica").text(value);
        }

        if (userDoc?.existingMedicalConditions?.length) {
            doc.font("Helvetica-Bold").text("Existing Conditions: ", { continued: true })
                .font("Helvetica").text(userDoc.existingMedicalConditions.join(", "));
        }
        if (userDoc?.allergies?.length) {
            doc.font("Helvetica-Bold").text("Allergies: ", { continued: true })
                .font("Helvetica").text(userDoc.allergies.join(", "));
        }
        if (userDoc?.medications?.length) {
            doc.font("Helvetica-Bold").text("Current Medications: ", { continued: true })
                .font("Helvetica").text(userDoc.medications.join(", "));
        }

        doc.moveDown(1.5);

        // — AI Summary —
        doc.fontSize(14).font("Helvetica-Bold").fillColor("#16a34a").text("AI Health Summary");
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#16a34a").lineWidth(1).stroke();
        doc.moveDown(0.5);
        doc.fontSize(11).font("Helvetica").fillColor("#222222");

        if (aiSummary) {
            // Strip markdown symbols for clean PDF text
            const cleanSummary = aiSummary
                .replace(/##\s*/g, "")
                .replace(/\*\*/g, "")
                .replace(/\*/g, "•");
            doc.text(cleanSummary, { align: "justify", lineGap: 3 });
        } else if (messages.length === 0) {
            doc.fillColor("#888888").text("No health conversations found yet.");
        } else {
            doc.fillColor("#888888").text("AI summary could not be generated. See full conversation below.");
        }

        doc.moveDown(1.5);

        // — Conversation Log —
        doc.fontSize(14).font("Helvetica-Bold").fillColor("#16a34a").text("Full Conversation History");
        doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#16a34a").lineWidth(1).stroke();
        doc.moveDown(0.5);

        if (messages.length === 0) {
            doc.fontSize(11).font("Helvetica").fillColor("#888888").text("No conversations recorded yet.");
        } else {
            messages.forEach((msg, idx) => {
                const isBot = msg.role === "assistant";
                const roleLabel = isBot ? "🤖 HealthBot" : "🧑 Patient";
                const dateStr = new Date(msg.createdAt).toLocaleString("en-IN");
                const bgColor = isBot ? "#f0fdf4" : "#f8fafc";
                const textColor = isBot ? "#166534" : "#1e3a5f";

                // Draw message bubble background
                const textHeight = Math.min(doc.heightOfString(msg.content, { width: 460 }) + 30, 300);
                if (doc.y + textHeight > doc.page.height - 80) doc.addPage();

                doc.rect(45, doc.y, 505, textHeight + 10).fill(bgColor).stroke("#e2e8f0");
                const startY = doc.y + 8;

                doc.fontSize(9).font("Helvetica-Bold").fillColor(textColor)
                    .text(roleLabel, 55, startY)
                    .font("Helvetica").fillColor("#888888")
                    .text(dateStr, 55, startY, { align: "right", width: 480 });

                doc.fontSize(10).font("Helvetica").fillColor("#333333")
                    .text(msg.content.replace(/⚠️[^\n]*/g, "").trim(), 55, startY + 14, { width: 460, lineGap: 2 });

                doc.moveDown(0.3);
                doc.y = startY + textHeight + 5;
            });
        }

        // — Footer —
        const footerY = doc.page.height - 40;
        doc.rect(0, footerY - 10, doc.page.width, 50).fill("#f1f5f9");
        doc.fontSize(9).fillColor("#888888").font("Helvetica")
            .text("⚠️ This report is AI-generated and is NOT a substitute for professional medical advice.", 50, footerY, { align: "center", width: 495 });

        doc.end();

    } catch (err) {
        console.error("PDF Error:", err);
        // Only send error if headers not sent yet
        if (!res.headersSent) {
            res.status(500).json({ error: "Failed to generate report" });
        }
    }
};

// ─────────────────────────────────────────────
// ✅ SAVE HEALTH DATA  (kept for backward compat)
// POST /api/health/save
// ─────────────────────────────────────────────
exports.saveHealthData = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: "Unauthorized" });

        // Now we just save as a ChatMessage pair for unified history
        const { symptoms, response, severity } = req.body;
        if (!symptoms || !response)
            return res.status(400).json({ error: "Missing required fields" });

        await ChatMessage.create([
            { user: userId, role: "user", content: symptoms, lang: "en" },
            { user: userId, role: "assistant", content: response, lang: "en" },
        ]);

        return res.status(201).json({ message: "Health data saved successfully" });
    } catch (err) {
        console.error("Save Error:", err);
        return res.status(500).json({ error: "Server error while saving health data" });
    }
};