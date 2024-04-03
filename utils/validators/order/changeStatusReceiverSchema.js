const ajvValidate = require('../ajvValidate')

/** Validation on order statuses that are allowed to receiver to change */
const changeStatusReceiverSchema = {
    type: "object",
    properties: {
        orderId: { type: "string" },
        status: {
            type: "string",
            enum: ['in store', 'pick to client', 'delivered by receiver', 'received']
        },
        images: {
            type: "array"
        },
    },
    required: ["orderId", "status"],

    additionalProperties: false
}

module.exports = ajvValidate.compile(changeStatusReceiverSchema)