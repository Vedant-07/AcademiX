const express = require("express");
const crypto = require("crypto");
const userAuth = require("../middlewares/auth"); // Authentication middleware
const Group = require("../Schema/Group");
const Membership = require("../Schema/Membership");

const groupRouter = express.Router();

// Helper function to generate an invitation code
const generateInvitationCode = () => {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
};

// Retrieve details for a specific group
groupRouter.get("/:id", userAuth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    res.status(200).json(group);
  } catch (error) {
    console.error("Error fetching group details:", error);
    res.status(500).json({ error: "Error fetching group details" });
  }
});

// Update group details (Expert/Moderator only)
groupRouter.put("/:id", userAuth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Check if the current user is a moderator in this group
    const membership = await Membership.findOne({
      user_id: req.user._id,
      group_id: group._id,
    });
    if (!membership || membership.role_in_group !== "Moderator") {
      return res
        .status(403)
        .json({ error: "Insufficient privileges to update group" });
    }

    // Update group fields if provided
    group.group_name = req.body.groupName || group.group_name;
    group.description = req.body.description || group.description;
    await group.save();

    res.status(200).json({ message: "Group updated successfully", group });
  } catch (error) {
    console.error("Error updating group:", error);
    res.status(500).json({ error: "Error updating group" });
  }
});

// Delete a group (Expert/Moderator only)
groupRouter.delete("/:id", userAuth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Check if the requester is a moderator
    const membership = await Membership.findOne({
      user_id: req.user._id,
      group_id: group._id,
    });
    if (!membership || membership.role_in_group !== "Moderator") {
      return res
        .status(403)
        .json({ error: "Insufficient privileges to delete group" });
    }

    // Delete memberships and group
    await Membership.deleteMany({ group_id: group._id });
    //await group.remove();
    await Group.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Group deleted successfully" });
  } catch (error) {
    console.error("Error deleting group:", error);
    res.status(500).json({ error: "Error deleting group" });
  }
});

// Join a group using an invitation code
groupRouter.post("/:groupId/join", userAuth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const { invitationCode } = req.body;
    const userId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }
    if (group.invitation_code !== invitationCode) {
      return res.status(400).json({ error: "Invalid invitation code" });
    }

    // Check if already a member
    const existingMembership = await Membership.findOne({
      user_id: userId,
      group_id: groupId,
    });
    if (existingMembership) {
      return res.status(400).json({ error: "Already a member of the group" });
    }

    const membership = new Membership({
      user_id: userId,
      group_id: groupId,
      role_in_group: "Member",
      joined_at: new Date(),
    });
    await membership.save();

    res.status(201).json({ message: "Joined group successfully" });
  } catch (error) {
    console.error("Error joining group:", error);
    res.status(500).json({ error: "Error joining group" });
  }
});

// Leave a group
groupRouter.delete("/:groupId/leave", userAuth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id;

    const membership = await Membership.findOneAndDelete({
      user_id: userId,
      group_id: groupId,
    });
    if (!membership) {
      return res.status(404).json({ error: "Membership not found" });
    }

    res.status(200).json({ message: "Left group successfully" });
  } catch (error) {
    console.error("Error leaving group:", error);
    res.status(500).json({ error: "Error leaving group" });
  }
});

// List members of a group
groupRouter.get("/:groupId/members", userAuth, async (req, res) => {
  try {
    const { groupId } = req.params;
    const members = await Membership.find({ group_id: groupId }).populate(
      "user_id",
      "name email profile_pic bio",
    );

    res.status(200).json(members);
  } catch (error) {
    console.error("Error fetching group members:", error);
    res.status(500).json({ error: "Error fetching group members" });
  }
});

// Update a member’s role within a group (Expert only)
groupRouter.put("/:groupId/members/:userId", userAuth, async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const { role_in_group } = req.body; // New role: 'Member' or 'Moderator'

    // Check if the requester is a moderator of the group
    const requesterMembership = await Membership.findOne({
      user_id: req.user._id,
      group_id: groupId,
    });
    if (
      !requesterMembership ||
      requesterMembership.role_in_group !== "Moderator"
    ) {
      return res
        .status(403)
        .json({ error: "Insufficient privileges to update member role" });
    }

    const membership = await Membership.findOneAndUpdate(
      { group_id: groupId, user_id: userId },
      { role_in_group },
      { new: true },
    );
    if (!membership) {
      return res.status(404).json({ error: "Membership not found" });
    }

    res
      .status(200)
      .json({ message: "Member role updated successfully", membership });
  } catch (error) {
    console.error("Error updating member role:", error);
    res.status(500).json({ error: "Error updating member role" });
  }
});

// Create a new group (Expert creates group; role auto-assigned as 'Moderator')
groupRouter.post("/", userAuth, async (req, res) => {
  try {
    const { groupName, description } = req.body;
    const userId = req.user._id; // Authenticated user

    // Create new group document
    const newGroup = new Group({
      group_name: groupName,
      description: description,
      created_by: userId,
      invitation_code: generateInvitationCode(),
      created_at: new Date(),
    });
    const group = await newGroup.save();

    // Create membership record for group creator with role "Moderator"
    const membership = new Membership({
      user_id: userId,
      group_id: group._id,
      role_in_group: "Moderator",
      joined_at: new Date(),
    });
    await membership.save();

    res.status(201).json({ message: "Group created successfully", group });
  } catch (error) {
    console.error("Error creating group:", error);
    res.status(500).json({ error: "Server error while creating group" });
  }
});

// Retrieve a list of groups
groupRouter.get("/", userAuth, async (req, res) => {
  try {
    const groups = await Group.find();
    res.status(200).json(groups);
  } catch (error) {
    console.error("Error fetching groups:", error);
    res.status(500).json({ error: "Error fetching groups" });
  }
});

groupRouter.get("/user/:userId", userAuth, async (req, res) => {
  try {
    // Find all Memberships where the user is a member and populate the 'group_id' field
    const memberships = await Membership.find({
      user_id: req.params.userId,
    }).populate("group_id");
    const groups = memberships.map((membership) => membership.group_id);

    res.status(200).json(groups);
  } catch (error) {
    console.error("Error fetching groups for user:", error);
    res.status(500).json({ error: "Error fetching groups for user" });
  }
});

module.exports = groupRouter;
