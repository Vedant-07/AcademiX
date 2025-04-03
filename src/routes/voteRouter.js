const express = require("express");
const userAuth = require("../middlewares/auth");
const Vote = require("../Schema/Vote");
const Post = require("../Schema/Post");

const voteRouter = express.Router();

// Toggle upvote for a post
// POST /api/votes/:postId
// If the user has already upvoted the post, remove the vote (toggle off).
// Otherwise, create a new vote (toggle on).
voteRouter.post("/:postId", userAuth, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    // Check if the post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Check if a vote by this user on this post already exists
    const existingVote = await Vote.findOne({ user_id: userId, post: postId });

    if (existingVote) {
      // Vote exists: remove it (toggle off)
      await existingVote.deleteOne();

      // Decrement the post's vote count, ensuring it doesn't go below 0
      post.votes = Math.max(post.votes - 1, 0);
      await post.save();

      return res
        .status(200)
        .json({ message: "Upvote removed", votes: post.votes });
    } else {
      // No vote exists: create a new vote (toggle on)
      const newVote = new Vote({
        user_id: userId,
        post: postId,
        vote_value: 1, // Only upvotes are allowed
      });
      await newVote.save();

      // Increment the post's vote count
      post.votes += 1;
      await post.save();

      return res
        .status(201)
        .json({
          message: "Upvoted successfully",
          vote: newVote,
          votes: post.votes,
        });
    }
  } catch (error) {
    console.error("Error toggling vote:", error);
    res.status(500).json({ error: "Error toggling vote" });
  }
});

module.exports = voteRouter;
