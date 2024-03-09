const mongoose = require("mongoose");

const carrierSchema = mongoose.Schema({
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
    nid: String,
    photo: String,
    papers: [String],
    area: [String],
    firstName: String,
    lastName: String,
}, { versionKey: false, strict: false, })
carrierSchema.index({ area: 1 }, { unique: false })

module.exports = mongoose.model("Carrier", carrierSchema);
