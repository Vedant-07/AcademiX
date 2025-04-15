const express = require("express");
const bcrypt = require("bcryptjs");
const { checkValidUser } = require("../utils/validation");
const User = require("../Schema/User");

const authRouter = express.Router();

authRouter.post("/signup", async (req, res) => {
  try {
    checkValidUser(req.body);
    const saltRounds = 7;

    const newPwd = await bcrypt.hash(req.body.password, saltRounds);
    console.log(newPwd);

    req.body.password = newPwd;

    const user = new User(req.body);
    const signedUpUser = await user.save();

    res.cookie("token", signedUpUser.getJWT());

    res.status(200).send(signedUpUser);
  } catch (err) {
    console.log("value cant be inserted into db ", err);
    res.status(400).send("user didnt signed up " + err);
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { password, emailId } = req.body;
    const user = await User.findOne({ emailId: emailId });

    if (!user) throw new Error(" user doesn't exists");

    const checkUser = await user.validateUserPassword(password);

    if (!checkUser) {
      throw new Error("invalid password ");
    }
    console.log("user is Logged in ");

    res.cookie("token", user.getJWT());
    res.status(200).json(user);
  } catch (err) {
    res.status(404).json({
      error: "-- User not found in AcademiX --" + err.message,
    });
  }
});

authRouter.post("/logout", (req, res) => {
  try {
    res.clearCookie("token").status(200).json({ message: "Logged out" });
  } catch (err) {
    res.status(404).json({
      error: "problem in logging out" + err.message,
    });
  }
});

module.exports = authRouter;
