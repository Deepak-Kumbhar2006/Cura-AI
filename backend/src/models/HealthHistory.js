const mongoose = require("mongoose");

const healthHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    symptoms: {
        type: String,
        required: true
    },
    response: {
        type: String,
        required: true
    },
    severity: {
        type: String,
        default: "moderate"
    },
    notes: {
        type: String
    }
}, { timestamps: true });

module.exports = mongoose.model("HealthHistory", healthHistorySchema);
