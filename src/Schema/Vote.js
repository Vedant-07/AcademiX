const mongoose = require("mongoose");

const voteSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post",
    required: true,
  },
  vote_value: {
    type: Number,
    enum: [1], // Only upvotes allowed
    default: 1,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// Prevent duplicate votes from a single user on the same post
voteSchema.index({ user_id: 1, post: 1 }, { unique: true });

module.exports = mongoose.model("Vote", voteSchema);
