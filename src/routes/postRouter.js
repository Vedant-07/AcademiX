const express = require("express");
const userAuth = require("../middlewares/auth");
const Post = require("../Schema/Post");
const Comment = require("../Schema/Comment");
const Vote = require("../Schema/Vote");
const Membership = require("../Schema/Membership");

const postRouter = express.Router();

// Retrieve public posts (posts with is_public=true)
postRouter.get("/public", userAuth, async (_req, res) => {
  try {
    let filter = { is_public: true, post_type: "question" };

    const posts = await Post.find(filter).populate(
      "user",
      "firstName LastName",
    );
    res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching public post details:", error);
    res.status(500).json({ error: "Error fetching public posts" });
  }
});

// Retrieve private posts of a group
postRouter.get("/private/:groupId", userAuth, async (req, res) => {
  try {
    let filter = {
      is_public: false,
      post_type: "question",
      group: req.params.groupId,
    };

    const posts = await Post.find(filter).populate(
      "user",
      "firstName LastName",
    );
    res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching public post details:", error);
    res.status(500).json({ error: "Error fetching public posts" });
  }
});

/**
 * @route   GET /posts/:id
 * @desc    Get a specific Q&A post (question) along with its answers (only for questions)
 * @access  Private
 */
postRouter.get("/:id", userAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      "user",
      "firstName lastName",
    );
    if (!post) return res.status(404).json({ error: "Post not found" });

    let answers = [];
    if (post.post_type === "question") {
      //fetch multiple answrss???
      answers = await Post.find({
        parent_post_id: req.params.id,
        post_type: "answer",
      }).populate("user", "firstName lastName");
    }

    res.status(200).json({ post, answers });
  } catch (error) {
    console.error("Error fetching post details:", error);
    res.status(500).json({ error: "Error fetching post details" });
  }
});

/**
 * @route   GET /api/posts/user/:userId
 * @desc    Get all Q&A posts (questions and announcements) created by a specific user
 * @access  Private
 */
postRouter.get("/user/:userId", userAuth, async (req, res) => {
  //same work as abov???
  try {
    const posts = await Post.find({
      user: req.params.userId,
      post_type: { $in: ["question", "announcement"] },
    }).populate("user", "firstName lastName");
    res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching user posts:", error);
    res.status(500).json({ error: "Error fetching user's posts" });
  }
});

// Answer a Question or Discussion
// Expected req.body: { content }
postRouter.post("/:id/answer", userAuth, async (req, res) => {
  try {
    const parentPost = await Post.findById(req.params.id);
    if (!parentPost) {
      return res.status(404).json({ error: "Question/Discussion not found" });
    }

    // Ensure parent post is a question or discussion (answers cannot be answered)
    if (
      parentPost.post_type !== "question" &&
      parentPost.post_type !== "discussion"
    ) {
      return res.status(400).json({
        error: "Answers can only be added to questions or discussions",
      });
    }

    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: "Answer content is required" });
    }

    const newAnswer = new Post({
      content,
      post_type: "answer",
      user: req.user._id,
      parent_post_id: parentPost._id, // Link to the question/discussion
      group: parentPost.group, // If the question belongs to a group, inherit it
      is_public: parentPost.is_public, // Inherit the visibility
      approved_flag: false, // Answers are not approved by default
      created_at: new Date(),
      updated_at: new Date(),
    });

    const savedAnswer = await newAnswer.save();
    res
      .status(201)
      .json({ message: "Answer posted successfully", answer: savedAnswer });
  } catch (error) {
    console.error("Error posting answer:", error);
    res.status(500).json({ error: "Error posting answer" });
  }
});

/**
 * @route   PUT /posts/:id
 * @desc    Update a post (only the creator or a group moderator can update)
 * @access  Private
 */
postRouter.put("/:id", userAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    let isAuthorized = false;
    if (post.user.toString() === req.user._id.toString()) {
      isAuthorized = true;
    } else if (post.group) {
      const membership = await Membership.findOne({
        user_id: req.user._id,
        group_id: post.group,
      });
      if (membership && membership.role_in_group === "Moderator") {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return res
        .status(403)
        .json({ error: "Insufficient privileges to update post" });
    }

    post.title = req.body.title || post.title;
    post.content = req.body.content || post.content;
    post.updated_at = new Date();

    const updatedPost = await post.save();
    res
      .status(200)
      .json({ message: "Post updated successfully", post: updatedPost });
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({ error: "Error updating post" });
  }
});

/**
 * @route   DELETE /posts/:id
 * @desc    Delete a post (cascade deletion for questions)
 * @access  Private
 */
postRouter.delete("/:id", userAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });

    let isAuthorized = false;
    if (post.user.toString() === req.user._id.toString()) {
      isAuthorized = true;
    } else if (post.group) {
      const membership = await Membership.findOne({
        user_id: req.user._id,
        group: post.group,
      });
      if (membership && membership.role_in_group === "Moderator") {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return res
        .status(403)
        .json({ error: "Insufficient privileges to delete post" });
    }

    if (post.post_type === "question") {
      const answers = await Post.find({
        parent_post_id: post._id,
        post_type: "answer",
      });

      for (const answer of answers) {
        await Comment.deleteMany({ answer_id: answer._id });
        await Vote.deleteMany({ post: answer._id });
        await answer.deleteOne();
      }
    }

    await Vote.deleteMany({ post: post._id });
    await post.deleteOne();

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ error: "Error deleting post" });
  }
});

/**
 * @route   PUT /posts/:id/approve
 * @desc    Approve an answer (only a moderator or parent question's creator can approve)
 * @access  Private
 */
postRouter.put("/:id/approve", userAuth, async (req, res) => {
  try {
    const answer = await Post.findById(req.params.id);
    if (!answer) return res.status(404).json({ error: "Answer not found" });

    if (answer.post_type !== "answer") {
      return res.status(400).json({ error: "This post is not an answer" });
    }

    let isAuthorized = false;
    if (answer.group) {
      const membership = await Membership.findOne({
        user_id: req.user._id,
        group_id: answer.group,
      });
      if (membership && membership.role_in_group === "Moderator") {
        isAuthorized = true;
      }
    } else {
      const parentQuestion = await Post.findById(answer.parent_post_id);
      if (
        parentQuestion &&
        parentQuestion.user.toString() === req.user._id.toString()
      ) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return res
        .status(403)
        .json({ error: "Insufficient privileges to approve answer" });
    }

    //answer.approved_flag = true;
    answer.approved_flag = !answer.approved_flag;
    answer.updated_at = new Date();

    const updatedAnswer = await answer.save();
    res
      .status(200)
      .json({ message: "Answer approved successfully", answer: updatedAnswer });
  } catch (error) {
    console.error("Error approving answer:", error);
    res.status(500).json({ error: "Error approving answer" });
  }
});

/**
 * @route   POST /posts
 * @desc    Create a new Question or Announcement post
 * @access  Private
 *
 * Expected req.body: { title, content, post_type ('question' or 'announcement'), groupId (optional), is_public (optional) }
 */
postRouter.post("/", userAuth, async (req, res) => {
  try {
    const { title, content, post_type, groupId, is_public } = req.body;

    if (
      !content ||
      !post_type ||
      !["question", "announcement"].includes(post_type)
    ) {
      return res
        .status(400)
        .json({ error: "Missing required fields or invalid post type" });
    }

    if (post_type === "announcement") {
      if (!groupId) {
        return res
          .status(400)
          .json({ error: "Group ID is required for an announcement" });
      }
      const membership = await Membership.findOne({
        user_id: req.user._id,
        group_id: groupId,
      }); // chang here for the group_id
      console.log(
        "-----------------------------------------------------------------------",
      );
      console.log(req.user._id, "  groupid--> ", groupId);
      console.log(membership);
      if (!membership || membership.role_in_group !== "Moderator") {
        return res
          .status(403)
          .json({ error: "Only moderators can create announcements" });
      }
    }

    const newPost = new Post({
      title: title || "",
      content,
      post_type,
      user: req.user._id,
      group: groupId || null,
      is_public: groupId ? false : is_public || false,
      approved_flag: false,
      created_at: new Date(),
      updated_at: new Date(),
    });

    const savedPost = await newPost.save();
    res
      .status(201)
      .json({ message: "Post created successfully", post: savedPost });
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ error: "Error creating post" });
  }
});

/**
 * @route   GET /posts
 * @desc    Get all Q&A posts (questions and announcements)
 * @access  Private
 *
 * Optional query parameters: userId, groupId
 */
postRouter.get("/", userAuth, async (req, res) => {
  try {
    const { userId, groupId } = req.query;
    let filter = { post_type: { $in: ["question", "announcement"] } };

    if (userId) filter.user = userId;
    if (groupId) filter.group = groupId;

    const posts = await Post.find(filter).populate(
      "user",
      "firstName lastName",
    );
    res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching post details:", error);
    res.status(500).json({ error: "Error fetching posts" });
  }
});

module.exports = postRouter;
