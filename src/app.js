const express = require("express");
const app = express();

const connectDb = require("./config/db");
const authRouter = require("./routes/authRouter");
const cookieParser = require("cookie-parser");
const PORT = process.env.PORT || 7777;

app.use("/", express.json());
app.use(cookieParser());

app.use("/auth", authRouter);

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
