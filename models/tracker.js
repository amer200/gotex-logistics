const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const trackerSchema = new mongoose.Schema({
    password: String,
    email: {
        type: String,
        unique: true
    },
    mobile: String,
    role: {
        type: String,
        default: 'tracker',
    },
    nid: String,
    address: String,
    city: String,
    firstName: String,
    lastName: String,
    verified: {
        type: Boolean,
        default: false
    },
    verifyCode: Number,
    photo: String,
}, { versionKey: false, strict: false, })
trackerSchema.index({ area: 1 }, { unique: false })

trackerSchema.methods.generateAuthToken = async function () {
    const tracker = {
        id: this._id,
        role: this.role
    }
    const token = jwt.sign(tracker, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE_TIME
    })

    await this.save()
    return token
}

module.exports = mongoose.model("Tracker", trackerSchema);
