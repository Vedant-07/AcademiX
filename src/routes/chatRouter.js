const Chat = require("../Schema/Chat");
const express = require("express");
const userAuth = require("../middlewares/auth");

const chatRouter = express.Router();

chatRouter.get("/:groupId", userAuth, async (req, res) => {
  try {
    const { groupId } = req.params;
    //const userId = user._id;
    let chat = await Chat.findOne({ group_id: groupId }).populate({
      path: "messages.user_id",
      select: "firstName lastName",
    });

    if (!chat) {
      chat = new Chat({
        group_id: groupId,
        messages: [],
      });
      await chat.save();
    }
    res.json(chat);
  } catch (e) {
    console.error("chatRouter prob...." + e.message);
  }
});

module.exports = chatRouter;
