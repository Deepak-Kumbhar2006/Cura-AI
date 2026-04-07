const User = require("../models/user");
const ChatMessage = require("../models/chatMessage");

function normalizeCsvInput(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(",")
      .map(v => v.trim())
      .filter(Boolean);
  }
  return [];
}

exports.getMyProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    const user = await User.findById(userId).select(
      "name email age gender existingMedicalConditions allergies medications whatsappId"
    );

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      profile: {
        name: user.name,
        email: user.email,
        age: user.age ?? null,
        gender: user.gender ?? null,
        existingMedicalConditions: user.existingMedicalConditions || [],
        allergies: user.allergies || [],
        medications: user.medications || [],
        whatsappId: user.whatsappId ?? null,
      },
    });
  } catch (err) {
    console.error("getMyProfile error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateMyProfile = async (req, res) => {
  try {
    const userId = req.user?.id;
    const {
      age,
      gender,
      existingMedicalConditions,
      allergies,
      medications,
    } = req.body || {};

    const patch = {};

    if (age !== undefined) {
      const n = Number(age);
      if (!Number.isFinite(n) || n < 0 || n > 120) {
        return res.status(400).json({ message: "Invalid age" });
      }
      patch.age = n;
    }

    if (gender !== undefined) {
      const g = String(gender).trim();
      const allowed = ["male", "female", "other", "prefer_not_to_say"];
      if (!allowed.includes(g)) {
        return res.status(400).json({ message: "Invalid gender" });
      }
      patch.gender = g;
    }

    if (existingMedicalConditions !== undefined) {
      patch.existingMedicalConditions = normalizeCsvInput(existingMedicalConditions);
    }

    if (allergies !== undefined) {
      patch.allergies = normalizeCsvInput(allergies);
    }

    if (medications !== undefined) {
      // Optional feature: allow empty list
      patch.medications = normalizeCsvInput(medications);
    }

    const updated = await User.findByIdAndUpdate(userId, patch, {
      new: true,
      runValidators: true,
    }).select("name email age gender existingMedicalConditions allergies medications");

    if (!updated) return res.status(404).json({ message: "User not found" });

    res.json({
      profile: {
        name: updated.name,
        email: updated.email,
        age: updated.age ?? null,
        gender: updated.gender ?? null,
        existingMedicalConditions: updated.existingMedicalConditions || [],
        allergies: updated.allergies || [],
        medications: updated.medications || [],
      },
    });
  } catch (err) {
    console.error("updateMyProfile error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getMyChatHistory = async (req, res) => {
  try {
    const userId = req.user?.id;
    const limitRaw = req.query?.limit;
    const limit = Math.min(Math.max(Number(limitRaw) || 20, 1), 100);

    const messages = await ChatMessage.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("role content createdAt lang");

    // Return chronological order for UI
    res.json({ messages: messages.reverse() });
  } catch (err) {
    console.error("getMyChatHistory error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

// Link a WhatsApp chat identifier (e.g. `msg.from`) to the logged-in user.
exports.linkWhatsApp = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { whatsappId } = req.body || {};

    if (!whatsappId || typeof whatsappId !== "string" || !whatsappId.trim()) {
      return res.status(400).json({ message: "whatsappId is required" });
    }

    const updated = await User.findByIdAndUpdate(
      userId,
      { whatsappId: whatsappId.trim() },
      { new: true }
    ).select("name whatsappId");

    if (!updated) return res.status(404).json({ message: "User not found" });

    res.json({ message: "WhatsApp linked successfully" });
  } catch (err) {
    // Unique collision (another user already linked this whatsappId)
    if (err?.code === 11000) {
      return res.status(409).json({ message: "This WhatsApp is already linked" });
    }
    console.error("linkWhatsApp error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
};

