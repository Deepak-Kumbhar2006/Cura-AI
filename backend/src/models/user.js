const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: { type: String, trim: true },
    email: {
        type: String,
        unique: true,
        required: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },

    // --- Health profile (optional, set after authentication) ---
    age: { type: Number, min: 0, max: 120 },
    gender: {
        type: String,
        enum: ["male", "female", "other", "prefer_not_to_say"]
    },
    existingMedicalConditions: { type: [String], default: [] },
    allergies: { type: [String], default: [] },
    medications: { type: [String], default: [] },

    // WhatsApp linking for personalization (optional)
    whatsappId: { type: String, unique: true, sparse: true, index: true }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);