const ajvValidate = require("../ajvValidate");

const orderSchema = {
  type: "object",
  properties: {
    sendername: { type: "string" },
    senderaddress: { type: "string" },
    sendercity: { type: "string" },
    senderdistrict: { type: "string" },
    senderdistrictId: { type: "number" },
    senderphone: { type: "string" },
    senderphone2: { type: "string" },
    recivername: { type: "string" },
    reciveraddress: { type: "string" },
    recivercity: { type: "string" },
    reciverdistrict: { type: "string" },
    reciverdistrictId: { type: "number" },
    reciverphone: { type: "string" },
    reciverphone2: { type: "string" },
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
    "sendername",
    "senderaddress",
    "sendercity",
    "senderdistrict",
    "senderdistrictId",
    "senderphone",
    "recivername",
    "reciveraddress",
    "recivercity",
    "reciverdistrict",
    "reciverdistrictId",
    "reciverphone",
    "paytype",
    "price",
    "weight",
    "description",
    "pieces",
  ],

  additionalProperties: true,
};

module.exports = ajvValidate.compile(orderSchema);
