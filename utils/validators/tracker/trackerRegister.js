const ajvValidate = require("../ajvValidate");

const trackerRegister = {
  type: "object",
  properties: {
    email: {
      type: "string",
      format: "email",
    }, //unique
    mobile: { type: "string" },
    role: {
      type: "string",
    },
    nid: { type: "string" },
    address: { type: "string" },
    city: { type: "string" },
    firstName: { type: "string" },
    lastName: { type: "string" },
    verified: { type: "boolean" },
  },
  required: [
    "email",
    "mobile",
    "nid",
    "address",
    "city",
    "firstName",
    "lastName",
  ],
  additionalProperties: false,
};

module.exports = ajvValidate.compile(trackerRegister);
