const express = require("express");
const app = express();
const PORT = process.env.PORT || 7777;
const connectDb = require("./config/db");

app.use("/hello-dev", (_req, res) => {
  res.send({
    from: "backend",
    date: new Date().toString(),
  });
});

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
