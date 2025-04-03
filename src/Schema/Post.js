const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  post_type: {
    type: String,
    enum: ["question", "chat", "answer", "announcement"],
    required: true,
  },
  title: {
    type: String,
    required: function () {
      return this.post_type === "question" || this.post_type === "announcement";
    },
  },
  content: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    default: null, // If null, it’s public (for Q&A) or not group-specific
  },
  parent_post_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    default: null, // For answers, links to the parent question/discussion
  },
  is_public: {
    type: Boolean,
    default: false,
  },
  approved_flag: {
    type: Boolean,
    default: false, // For answers (approved by an expert)
  },
  votes: {
    type: Number,
    default: 0,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Post", postSchema);
