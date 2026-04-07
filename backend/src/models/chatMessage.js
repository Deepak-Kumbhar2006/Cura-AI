const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true, maxlength: 5000 },
    lang: { type: String, default: "en" },
  },
  { timestamps: true }
);

// Most recent first for dashboard history views
chatMessageSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("ChatMessage", chatMessageSchema);

