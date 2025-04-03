const express = require("express");
const connectDb = require("./config/db");
const authRouter = require("./routes/authRouter");
const profileRouter = require("./routes/profileRouter");
const groupRouter = require("./routes/groupRouter");
const cookieParser = require("cookie-parser");
const postRouter = require("./routes/postRouter");
const PORT = process.env.PORT || 7777;

const app = express();
app.use("/", express.json());
app.use(cookieParser());

app.use("/auth", authRouter);
app.use("/profile", profileRouter);
app.use("/groups", groupRouter);
app.use("/posts", postRouter);

connectDb()
  .then(() => {
    console.log("connection to db established");
    app.listen(PORT, () => {
      console.log(`server is listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("db connection not established ", err);
  });
