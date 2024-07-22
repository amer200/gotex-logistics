const mongoose = require("mongoose");
const generateAuthToken = require("../utils/generateAuthToken");

const carrierSchema = new mongoose.Schema(
  {
    password: String,
    email: {
      type: String,
      unique: true,
    },
    mobile: String,
    role: {
      type: String,
      enum: ["collector", "receiver"],
      default: "collector",
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
    papers: [String],
    deliveryCity: String,
    deliveryDistricts: [String],
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
  },
  { versionKey: false, strict: false }
);
carrierSchema.index({ area: 1 }, { unique: false });

carrierSchema.methods.generateAuthToken = generateAuthToken;

module.exports = mongoose.model("Carrier", carrierSchema);
