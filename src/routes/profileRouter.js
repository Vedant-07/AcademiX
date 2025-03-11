const express = require("express");
const userAuth = require("../middlewares/auth");
const { checkValidUserFields } = require("../utils/validation");
const User = require("../Schema/User");

const profileRouter = express.Router();

const validUserDataFields = "firstName lastName bio profile_pic";

profileRouter.get("/view", userAuth, async (req, res) => {
  try {
    const user = req.user;
    res.send(user);
  } catch (err) {
    res.status.json({
      error: err,
    });
  }
});

profileRouter.patch("/edit", userAuth, async (req, res) => {
  try {
    const user = req.user;
    const editableValues = req.body;

    if (!checkValidUserFields(editableValues, validUserDataFields))
      res.status.json({ err: "please enter editable values" });

    const userAfter = await User.findByIdAndUpdate(user._id, req.body, {
      returnDocument: "after",
      runValidators: true,
    });

    res.status(200).send(userAfter);
  } catch (err) {
    res.status(400).json({
      error: err,
    });
  }
});

module.exports = profileRouter;
