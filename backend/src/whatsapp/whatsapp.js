const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const { getAIReply } = require("../controllers/chat.controller");

// 🧠 Queue
const messageQueue = [];
let isProcessing = false;

// 🔒 Prevent multiple starts
let isClientStarted = false;

// 🚀 Client
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "health-bot"
    }),
    puppeteer: {
        headless: true,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu"
        ],
        timeout: 60000
    }
});

// ⚠️ Avoid memory warnings
client.setMaxListeners(20);

// 🚀 START CLIENT (SAFE)
const startClient = async () => {
    if (isClientStarted) {
        console.log("⚠️ WhatsApp already running (session reused)");
        return;
    }

    try {
        console.log("🚀 Starting WhatsApp...");
        isClientStarted = true;
        await client.initialize();
    } catch (err) {
        console.error("❌ Init error:", err.message);
        isClientStarted = false;
    }
};

// 📱 QR (only when needed)
client.on("qr", qr => {
    console.log("📱 Scan QR (only first time login)");
    qrcode.generate(qr, { small: true });
});

// ✅ READY
client.on("ready", () => {
    console.log("✅ WhatsApp Bot Ready (Session Active)");
});

// ❌ AUTH FAIL
client.on("auth_failure", msg => {
    console.error("❌ Auth failure:", msg);
});

// 🔄 STATE LOG
client.on("change_state", state => {
    console.log("🔄 State:", state);
});

// ❌ DISCONNECT
client.on("disconnected", reason => {
    console.log("❌ Disconnected:", reason);
    console.log("⚠️ Restart server to reconnect");
    isClientStarted = false;
});

// 🧠 PROCESS QUEUE (ANTI-SPAM)
async function processQueue() {
    if (isProcessing || messageQueue.length === 0) return;

    isProcessing = true;

    const { msg } = messageQueue.shift();

    try {
        // 🤖 Get AI reply (multilingual auto handled)
        const reply = await getAIReply(msg.body, msg.from);

        await msg.reply(reply);
    } catch (err) {
        console.error("❌ Queue error:", err.message);

        try {
            await msg.reply("⚠️ Sorry, something went wrong. Please try again.");
        } catch { }
    }

    isProcessing = false;

    setTimeout(processQueue, 300); // throttle
}

// 📩 MESSAGE HANDLER
client.on("message", async msg => {
    try {
        if (!msg.body) return;

        // ❌ Ignore groups
        if (msg.from.includes("@g.us")) return;

        // ❌ Ignore status
        if (msg.from === "status@broadcast") return;

        // 🧠 Push to queue
        messageQueue.push({ msg });

        processQueue();
    } catch (err) {
        console.error("❌ Message error:", err.message);
    }
});

// 🛑 GLOBAL ERROR HANDLING
process.on("uncaughtException", err => {
    console.error("💥 Uncaught Exception:", err.message);
});

process.on("unhandledRejection", err => {
    console.error("💥 Unhandled Rejection:", err);
});

// 🚀 START
startClient();

module.exports = client;