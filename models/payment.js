const mongoose = require("mongoose");

const paymentSchema = mongoose.Schema(
  {
    data: Object,
    amount: Number,
    code: String,
    status: String,
    carrier: { type: mongoose.Schema.Types.ObjectId, ref: "Carrier" },
  },
  { versionKey: false, timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
