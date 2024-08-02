const ajvValidate = require("../ajvValidate");

const storekeeperEdit = {
  type: "object",
  properties: {
    mobile: { type: "string" },
    role: {
      type: "string",
      enum: ["storekeeper"],
    },
    address: { type: "string" },
    city: { type: "string" },
    firstName: { type: "string" },
    lastName: { type: "string" },
    verified: { type: "boolean" },
  },
  required: ["mobile", "address", "city", "firstName", "lastName"],
  additionalProperties: false,
};

module.exports = ajvValidate.compile(storekeeperEdit);
