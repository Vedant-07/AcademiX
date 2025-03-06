const mongoose = require("mongoose");

const connectDb = async () => {
  await mongoose.connect(
    "mongodb+srv://admin:AcademiX-db@academix-db-cluster.n6val.mongodb.net/?retryWrites=true&w=majority&appName=Academix-db-cluster",
  );
};

module.exports = connectDb;
