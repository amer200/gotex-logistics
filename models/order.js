const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    recivername: {
      type: String,
      required: true,
    },
    reciveraddress: {
      type: String,
      required: true,
    },
    recivercity: {
      type: String,
      required: true,
    },
    reciverphone: {
      type: String,
      required: true,
    },
    sendername: {
      type: String,
      required: true,
    },
    senderaddress: {
      type: String,
      required: true,
    },
    sendercity: {
      type: String,
      required: true,
    },
    senderphone: {
      type: String,
      required: true,
    },
    createdby: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    ordernumber: String,
    paytype: String,
    price: Number,
    pieces: Number,
    description: String,
    weight: Number,
    location: Object,
    itemdetails: Object,
    storekeeper: { type: mongoose.Schema.Types.ObjectId, ref: "Storekeeper" },
    pickedby: { type: mongoose.Schema.Types.ObjectId, ref: "Carrier" },
    deliveredby: { type: mongoose.Schema.Types.ObjectId, ref: "Carrier" },
    billcode: String,
    canceldescription: String,
    isreturn: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "pick to store", // collector picked it
        "delivered by collector",
        "in store",
        "pick to client", // receiver picked it
        "delivered by receiver",
        "received",
        "canceled",
      ],
      default: "pending",
    },
    images: [String],
    inStore: {
      request: {
        type: Boolean,
        default: false,
      },
      requestStatus: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending",
      },
    },
  },
  { versionKey: false, strict: false, timestamps: true }
);
orderSchema.pre("save", function (next) {
  if (this.isNew) {
    this.ordernumber = this._id.toString().slice(-10);
    this.billcode = this._id.toString().slice(-10) + "Gotex";
  }
  next();
});
orderSchema.index({ status: 1 }, { unique: false });
orderSchema.index({ createdAt: -1 }, { unique: false });
orderSchema.index({ pickedby: 1 }, { unique: false });
orderSchema.index({ ordernumber: 1 }, { unique: true });

module.exports = mongoose.model("Order", orderSchema);
