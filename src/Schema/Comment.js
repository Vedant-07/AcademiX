const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  answer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    required: true, // The answer this comment is attached to
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  // For nested comments (replies), if null, this is a top-level comment
  parent_comment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comment",
    default: null,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  deleted: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("Comment", commentSchema);
