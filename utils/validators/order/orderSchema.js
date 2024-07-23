const ajvValidate = require("../ajvValidate");

const orderSchema = {
  type: "object",
  properties: {
    recivername: { type: "string" },
    reciveraddress: { type: "string" },
    recivercity: { type: "string" },
    reciverdistrict: { type: "string" },
    senderdistrictId: { type: "string" },
    reciverphone: { type: "string" },
    sendername: { type: "string" },
    senderaddress: { type: "string" },
    sendercity: { type: "string" },
    senderdistrict: { type: "string" },
    reciverdistrictId: { type: "string" },
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
    images: {
      type: "object",
      properties: {
        pending: { type: "array" },
        pickedToStore: { type: "array" },
        inStoreRequest: { type: "array" },
        inStoreRequestStatus: { type: "array" },
        inStore: { type: "array" },
        pickedToClient: { type: "array" },
        received: { type: "array" },
        canceled: { type: "array" },
        return: { type: "array" },
      },
    },
    inStore: {
      type: "object",
      properties: {
        request: { type: "boolean" },
        requestStatus: { type: "string" },
      },
    },
  },

  required: [
    "recivername",
    "reciveraddress",
    "recivercity",
    "reciverdistrict",
    "senderdistrictId",
    "reciverphone",
    "sendername",
    "senderaddress",
    "sendercity",
    "senderdistrict",
    "reciverdistrictId",
    "senderphone",
    "paytype",
    "price",
    "weight",
    "description",
    "pieces",
  ],

  additionalProperties: true,
};

module.exports = ajvValidate.compile(orderSchema);
