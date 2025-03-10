const mongoose = require("mongoose");

const connectDb = async () => {
  await mongoose.connect(
    "mongodb+srv://admin:AcademiX-db@academix-db-cluster.n6val.mongodb.net/AcademiX",
  );
};

module.exports = connectDb;
