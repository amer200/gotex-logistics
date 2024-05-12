const ajvValidate = require("./ajvValidate");

const userSchema = {
  type: "object",
  properties: {
    email: {
      type: "string",
      format: "email",
    },
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
    area: {
      type: "array",
      items: {
        type: "object",
        properties: {
          city: { type: "string" },
          district: { type: "string" },
        },
        required: ["city", "district"],
      },
    },
  },
  required: [
    "email",
    "mobile",
    "nid",
    "address",
    "city",
    "firstName",
    "lastName",
    "area",
  ],
  additionalProperties: false,
};

module.exports = ajvValidate.compile(userSchema);
