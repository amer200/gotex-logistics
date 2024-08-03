const ajvValidate = require("../ajvValidate");

const storekeeperRegister = {
  type: "object",
  properties: {
    email: {
      type: "string",
      format: "email",
    },
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
  required: ["email", "mobile", "address", "city", "firstName", "lastName"],
  additionalProperties: false,
};

module.exports = ajvValidate.compile(storekeeperRegister);
