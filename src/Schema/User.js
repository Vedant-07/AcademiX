const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    emailId: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    reputation: { type: Number, default: 0 },
    profile_pic: { type: String },
  },
  { timestamps: true },
);

userSchema.method("getJWT", function () {
  const user = this;
  const token = jwt.sign({ _id: user._id }, "7", {
    expiresIn: "1h",
  });
  return token;
});

userSchema.method("validateUserPassword", function (password) {
  const user = this;
  return bcrypt.compare(password, user.password);
});

module.exports = mongoose.model("User", userSchema);
