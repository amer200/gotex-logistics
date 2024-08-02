const ajvValidate = require("../ajvValidate");

const userEdit = {
  type: "object",
  properties: {
    mobile: { type: "string" },
    role: {
      type: "string",
      enum: ["data entry", "admin"],
    },
    nid: { type: "string" },
    address: { type: "string" },
    city: { type: "string" },
    firstName: { type: "string" },
    lastName: { type: "string" },
  },
  required: ["mobile", "nid", "address", "city", "firstName", "lastName"],
  additionalProperties: false,
};

module.exports = ajvValidate.compile(userEdit);
