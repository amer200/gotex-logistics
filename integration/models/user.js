const mongoose = require("mongoose");
const generateAuthToken = require("../../utils/generateAuthToken");

const userIntegrateSchema = mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    mobile: {
      type: String,
      required: true,
    },
    nid: String,
    role: {
      type: String,
      default: "user",
    },
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    apiKey: {
      test: String,
      production: String,
    },
  },
  { versionKey: false }
);

userIntegrateSchema.methods.generateAuthToken = generateAuthToken;

module.exports = mongoose.model("UserIntegrate", userIntegrateSchema);
