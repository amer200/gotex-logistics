const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const storekeeperSchema = mongoose.Schema({
    password: String,
    email: {
        type: String,
        unique: true
    },
    mobile: String,
    address: String,
    city: String,
    firstName: String,
    lastName: String,
    verified: {
        type: Boolean,
        default: false
    },
    verifyCode: Number
}, { versionKey: false, strict: false, })

storekeeperSchema.methods.generateAuthToken = async function () {
    const user = {
        id: this._id,
    }
    const token = jwt.sign(user, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE_TIME
    })

    await this.save()
    return token
}

module.exports = mongoose.model("Storekeeper", storekeeperSchema);
