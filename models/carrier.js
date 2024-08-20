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
    deliveryDistricts: [Number],
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],
    collectedCashAmount: {
      type: Number,
      default: 0,
    },
    collectedVisaAmount: {
      type: Number,
      default: 0,
    },
  },
  { versionKey: false, strict: false, timestamps: true }
);
carrierSchema.index({ area: 1 }, { unique: false });

carrierSchema.methods.generateAuthToken = generateAuthToken;

module.exports = mongoose.model("Carrier", carrierSchema);
