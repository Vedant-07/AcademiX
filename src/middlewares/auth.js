const User = require("../Schema/User");
const jwt = require("jsonwebtoken");

const userAuth = async (req, res, next) => {
  try {
    //read the token
    const { token } = req.cookies;
    if (!token)
      throw new Error("No token at the moment  from the UserAuth ...");
    //validator token

    const DecryptMsg = jwt.verify(token, "7");
    const { _id } = DecryptMsg;
    //Identify the user
    const user = await User.findById(_id);
    //console.log("user is ", user);

    if (!user) return res.status(401).json({ error: "message" });
    req.user = user;
    next();
  } catch (err) {
    res
      .status(401)
      .send("Error Here exclusively from UserAuth  : " + err.message);
  }
};

module.exports = userAuth;
