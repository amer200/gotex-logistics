const ajvValidate = require("../ajvValidate");

const orderSchema = {
  type: "object",
  properties: {
    recivername: { type: "string" },
    reciveraddress: { type: "string" },
    recivercity: { type: "string" },
    reciverphone: { type: "string" },
    sendername: { type: "string" },
    senderaddress: { type: "string" },
    sendercity: { type: "string" },
    senderphone: { type: "string" },
    paytype: { type: "string" },
    price: { type: "number" },
    weight: { type: "number" },
    pieces: { type: "number" },
    description: { type: "string" },
    status: {
      type: "string",
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
    },
  },

  required: [
    "recivername",
    "reciveraddress",
    "recivercity",
    "reciverphone",
    "sendername",
    "senderaddress",
    "sendercity",
    "senderphone",
    "paytype",
    "price",
    "weight",
    "description",
    "pieces",
    "status",
  ],

  additionalProperties: false,
};

module.exports = ajvValidate.compile(orderSchema);
