const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema({
  group_name: { type: String, required: true },
  description: { type: String, required: true },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  invitation_code: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Group", groupSchema);
