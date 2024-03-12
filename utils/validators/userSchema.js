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
            enum: ['data entry', 'admin']
        },
        nid: { type: "string" },
        address: { type: "string" },
        city: { type: "string" },
        firstName: { type: "string" },
        lastName: { type: "string" },
        verified: { type: "boolean" }
    },
    required: ["email", "password", "mobile", "nid", "address", "city", "firstName", "lastName"],
    // uniqueItemProperties: ['email'],
    additionalProperties: false
}

module.exports = ajvValidate.compile(userSchema)