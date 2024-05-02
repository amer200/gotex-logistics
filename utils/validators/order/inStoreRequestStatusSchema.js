const ajvValidate = require("../ajvValidate");

const inStoreRequestStatusSchema = {
  type: "object",
  properties: {
    orderId: {
      type: "string",
    },
    requestStatus: {
      type: "string",
      enum: ["pending", "accepted", "rejected"],
    },
  },
  required: ["orderId", "requestStatus"],

  additionalProperties: false,
};

module.exports = ajvValidate.compile(inStoreRequestStatusSchema);
