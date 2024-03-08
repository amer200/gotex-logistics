const mongoose = require("mongoose");

const carrierSchema = mongoose.Schema({

    username: String,
    password: String,
    email: {
        type: String,
        unique: true
    },
    mobile: String,
    address: String,
    city: String,
    role: {
        type: String,
        default: 'carrier'
    },
    nid: {
        type: String,
        unique: true
    },
    photo: String,
    papers: [String],
    firstName: String,
    lastName: String,
}, { versionKey: false, strict: false, })
carrierSchema.index({ username: 1 }, { unique: false })
carrierSchema.index({ city: 1 }, { unique: false })

module.exports = mongoose.model("Carrier", carrierSchema);
