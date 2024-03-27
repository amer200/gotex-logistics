const ajvValidate = require('../ajvValidate')

/** Validation on order statuses that are allowed to collector to change */
const changeStatusCollectorSchema = {
    type: "object",
    properties: {
        orderId: { type: "string" },
        status: {
            type: "string",
            enum: ['pending', 'pick to store', 'delivered by collector']
        },
    },
    required: ["orderId", "status"],

    additionalProperties: false
}

module.exports = ajvValidate.compile(changeStatusCollectorSchema)