const express = require("express");
const userAuth = require("../middlewares/auth");
const Comment = require("../Schema/Comment");
const Post = require("../Schema/Post");
const Membership = require("../Schema/Membership");

const commentRouter = express.Router();

/**
 * @route   POST /api/comments/:answerId
 * @desc    Create a new comment for an answer (supports nested replies)
 * @access  Private
 */
commentRouter.post("/:answerId", userAuth, async (req, res) => {
  try {
    const { answerId } = req.params;
    const { content, parent_comment_id } = req.body;

    if (!content) {
      return res.status(400).json({ error: "Comment content is required" });
    }

    // Optionally, verify that the answer exists and is of type 'answer'
    const answer = await Post.findById(answerId);
    if (!answer || answer.post_type !== "answer") {
      return res.status(404).json({ error: "Associated answer not found" });
    }

    const newComment = new Comment({
      answer_id: answerId,
      user_id: req.user._id,
      content,
      parent_comment_id: parent_comment_id || null,
    });

    const savedComment = await newComment.save();
    res
      .status(201)
      .json({ message: "Comment added successfully", comment: savedComment });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ error: "Error adding comment" });
  }
});

/**
 * @route   GET /api/comments/:answerId
 * @desc    Retrieve all comments for a specific answer
 * @access  Private
 */
commentRouter.get("/:answerId", userAuth, async (req, res) => {
  try {
    const { answerId } = req.params;
    const comments = await Comment.find({ answer_id: answerId })
      .populate("user_id", "firstName lastName")
      .lean();
    // For now, this returns a flat list.
    // You could process it further to create a nested/threaded structure.
    res.status(200).json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Error fetching comments" });
  }
});

/**
 * @route   PUT /api/comments/:commentId
 * @desc    Update a comment (only by the comment owner or moderator)
 * @access  Private
 */
commentRouter.put("/:commentId", userAuth, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    // Check if current user is the comment owner
    if (comment.user_id.toString() !== req.user._id.toString()) {
      // Otherwise, if the answer belongs to a group, check if the user is a moderator
      const answer = await Post.findById(comment.answer_id);
      if (answer && answer.group) {
        const membership = await Membership.findOne({
          user_id: req.user._id,
          group_id: answer.group,
        });
        if (!membership || membership.role_in_group !== "Moderator") {
          return res
            .status(403)
            .json({ error: "Unauthorized to update this comment" });
        }
      } else {
        return res
          .status(403)
          .json({ error: "Unauthorized to update this comment" });
      }
    }

    comment.content = content;
    const updatedComment = await comment.save();
    res
      .status(200)
      .json({
        message: "Comment updated successfully",
        comment: updatedComment,
      });
  } catch (error) {
    console.error("Error updating comment:", error);
    res.status(500).json({ error: "Error updating comment" });
  }
});

// Soft delete a comment
commentRouter.delete("/:commentId", userAuth, async (req, res) => {
  try {
    const { commentId } = req.params;
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    // Authorization check: allow deletion if the user is the owner or a moderator
    if (comment.user_id.toString() !== req.user._id.toString()) {
      // Otherwise, if the comment's answer belongs to a group, check if the user is a moderator
      const answer = await Post.findById(comment.answer_id);
      if (answer && answer.group) {
        const membership = await Membership.findOne({
          user_id: req.user._id,
          group_id: answer.group,
        });
        if (!membership || membership.role_in_group !== "Moderator") {
          return res
            .status(403)
            .json({ error: "Unauthorized to delete this comment" });
        }
      } else {
        return res
          .status(403)
          .json({ error: "Unauthorized to delete this comment" });
      }
    }

    // Soft delete: mark as deleted and update content
    comment.deleted = true;
    comment.content = "Deleted Comment";
    await comment.save();

    res
      .status(200)
      .json({
        message: "Comment deleted (soft deletion) successfully",
        comment,
      });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ error: "Error deleting comment" });
  }
});

module.exports = commentRouter;
