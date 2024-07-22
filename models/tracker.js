const mongoose = require("mongoose");
const generateAuthToken = require("../utils/generateAuthToken");

const trackerSchema = new mongoose.Schema(
  {
    password: String,
    email: {
      type: String,
      unique: true,
    },
    mobile: String,
    role: {
      type: String,
      default: "tracker",
    },
    nid: String,
    address: String,
    city: String,
    firstName: String,
    lastName: String,
    verified: {
      type: Boolean,
      default: false,
    },
    verifyCode: Number,
    photo: String,
  },
  { versionKey: false, strict: false }
);
trackerSchema.index({ area: 1 }, { unique: false });

trackerSchema.methods.generateAuthToken = generateAuthToken;

module.exports = mongoose.model("Tracker", trackerSchema);
