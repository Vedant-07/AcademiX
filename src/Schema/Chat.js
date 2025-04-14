const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

const chatSchema = new mongoose.Schema({
  group_id: {
    type: String,
    required: true,
  },
  messages: [messageSchema],
});

module.exports = mongoose.model("Chat", chatSchema);
