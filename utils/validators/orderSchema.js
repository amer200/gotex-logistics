const ajvValidate = require('./ajvValidate')

const orderSchema = {
    type: "object",
    properties: {
        recivername: { type: "string" },
        reciveraddress: { type: "string" },
        recivercity: { type: "string" },
        reciverphone: { type: "string" },
        sendername: { type: "string" },
        senderaddress: { type: "string" },
        sendercity: { type: "string" },
        senderphone: { type: "string" },
        paytype: { type: "string" },
        price: { type: "number" },
        weight: { type: "number" },
        pieces: { type: "number" },
        description: { type: "string" },

    },
    required: ["recivername", "reciveraddress", "recivercity", "reciverphone", "sendername", "senderaddress", "sendercity", "senderphone", "paytype", "price", "weight", "description", "pieces"],

    additionalProperties: false
}

module.exports = ajvValidate.compile(orderSchema)