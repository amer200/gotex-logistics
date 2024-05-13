const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

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

carrierSchema.methods.generateAuthToken = async function () {
  const carrier = {
    id: this._id,
    role: this.role,
  };
  const token = jwt.sign(carrier, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE_TIME,
  });

  await this.save();
  return token;
};

module.exports = mongoose.model("Carrier", carrierSchema);
