const ajvValidate = require('./ajvValidate')

const userSchema = {
    type: "object",
    properties: {
        email: {
            type: "string",
            format: "email"
        }, //unique
        mobile: { type: "string" },
        role: {
            type: "string",
            enum: ['collector', 'receiver']
        },
        nid: { type: "string" },
        address: { type: "string" },
        city: { type: "string" },
        firstName: { type: "string" },
        lastName: { type: "string" },
        verified: { type: "boolean" },
        photo: { type: "string" },
        papers: { type: "array" },
        area: { type: "array" },
    },
    required: ["email", "mobile", "nid", "address", "city", "firstName", "lastName"],
    additionalProperties: false
}

module.exports = ajvValidate.compile(userSchema)