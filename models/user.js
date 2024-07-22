const mongoose = require("mongoose");
const generateAuthToken = require("../utils/generateAuthToken");

const userSchema = new mongoose.Schema(
  {
    firstName: String,
    lastName: String,
    email: {
      type: String,
      unique: true,
    },
    mobile: String,
    password: String,
    role: {
      type: String,
      enum: ["data entry", "admin"],
      default: "data entry",
    },
    nid: String,
    address: String,
    city: String,

    verified: {
      type: Boolean,
      default: false,
    },
    verifyCode: Number,
  },
  { versionKey: false, strict: false }
);

userSchema.methods.generateAuthToken = generateAuthToken;

module.exports = mongoose.model("User", userSchema);
