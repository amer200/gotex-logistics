const mongoose = require("mongoose");
const generateAuthToken = require("../utils/generateAuthToken");

const storekeeperSchema = new mongoose.Schema(
  {
    password: String,
    email: {
      type: String,
      unique: true,
    },
    mobile: String,
    address: String,
    city: String,
    role: {
      type: String,
      default: "storekeeper",
    },
    firstName: String,
    lastName: String,
    verified: {
      type: Boolean,
      default: false,
    },
    verifyCode: Number,
  },
  { versionKey: false, strict: false }
);

storekeeperSchema.methods.generateAuthToken = generateAuthToken;

module.exports = mongoose.model("Storekeeper", storekeeperSchema);
