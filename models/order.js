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
    reciverdistrict: {
      type: String,
      required: true,
    },
    reciverdistrictId: {
      type: Number,
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
    senderdistrict: {
      type: String,
      required: true,
    },
    senderdistrictId: {
      type: Number,
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
    pickedby: { type: mongoose.Schema.Types.ObjectId, ref: "Carrier" },
    deliveredby: { type: mongoose.Schema.Types.ObjectId, ref: "Carrier" },
    storekeeper: { type: mongoose.Schema.Types.ObjectId, ref: "Storekeeper" },
    billcode: String,
    cancelDescription: {
      dataEntry: String,
      admin: String,
      collector: String,
    },
    isreturn: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "pick to store",
        "late to store",
        "in store",
        "pick to client",
        "received",
        "canceled",
        "return",
      ],
      default: "pending",
    },
    images: {
      pending: [String],
      pickedToStore: [String],
      inStoreRequest: [String],
      inStoreRequestStatus: [String],
      inStore: [String],
      pickedToClient: [String],
      received: [String],
      canceled: {
        dataEntry: [String],
        admin: [String],
        collector: [String],
      },
      return: [String],
    },
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
    problem: {
      request: {
        type: Boolean,
        default: false,
      },
      description: String,
      closedDescription: String,
      images: [String],
      status: {
        type: String,
        enum: ["pending", "closed"],
        default: "pending",
      },
    },

    integrateRequest: {
      type: Boolean,
      default: false,
    },
    userIntegrate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserIntegrate",
    },
    payment: {
      cod: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
      cc: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
    },
    receiverPaidCash: {
      type: Boolean,
      default: false,
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
orderSchema.index({ updatedAt: -1 }, { unique: false });
orderSchema.index({ pickedby: 1 }, { unique: false });
orderSchema.index({ ordernumber: 1 }, { unique: true });
orderSchema.index({ integrateRequest: 1 }, { unique: false });
orderSchema.index({ deliveredby: 1 }, { unique: false });

module.exports = mongoose.model("Order", orderSchema);
