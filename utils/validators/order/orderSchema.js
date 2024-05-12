const ajvValidate = require("../ajvValidate");

const orderSchema = {
  type: "object",
  properties: {
    recivername: { type: "string" },
    reciveraddress: { type: "string" },
    recivercity: { type: "string" },
    reciverdistrict: { type: "string" },
    reciverphone: { type: "string" },
    sendername: { type: "string" },
    senderaddress: { type: "string" },
    sendercity: { type: "string" },
    senderdistrict: { type: "string" },
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
        "pick to store",
        "in store",
        "pick to client",
        "received",
        "canceled",
      ],
    },
  },

  required: [
    "recivername",
    "reciveraddress",
    "recivercity",
    "reciverdistrict",
    "reciverphone",
    "sendername",
    "senderaddress",
    "sendercity",
    "senderdistrict",
    "senderphone",
    "paytype",
    "price",
    "weight",
    "description",
    "pieces",
  ],

  additionalProperties: false,
};

module.exports = ajvValidate.compile(orderSchema);
