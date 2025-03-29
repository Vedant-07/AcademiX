// models/Membership.js
const mongoose = require("mongoose");

const membershipSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  group_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    required: true,
  },
  role_in_group: {
    type: String,
    enum: ["Member", "Moderator"],
    default: "Member",
  },
  joined_at: { type: Date, default: Date.now },
});

membershipSchema.index({ user_id: 1, group_id: 1 }, { unique: true });

module.exports = mongoose.model("Membership", membershipSchema);
