const ajvValidate = require("../ajvValidate");

const carrierSchema = {
  type: "object",
  properties: {
    mobile: { type: "string" },
    role: {
      type: "string",
      enum: ["collector", "receiver"],
    },
    nid: { type: "string" },
    address: { type: "string" },
    city: { type: "string" },
    firstName: { type: "string" },
    lastName: { type: "string" },
    verified: { type: "boolean" },
    photo: { type: "string" },
    papers: { type: "array" },
    deliveryCity: { type: "string" },
    deliveryDistricts: {
      type: "array",
    },
  },
  required: [
    "mobile",
    "nid",
    "address",
    "city",
    "firstName",
    "lastName",
    "deliveryCity",
    "deliveryDistricts",
  ],
  additionalProperties: false,
};

module.exports = ajvValidate.compile(carrierSchema);
