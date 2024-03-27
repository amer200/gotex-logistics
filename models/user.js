const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
    password: String,
    email: {
        type: String,
        unique: true
    },
    mobile: String,
    role: {
        type: String,
        enum: ['data entry', 'admin'],
        default: 'data entry'
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
    verifyCode: Number
}, { versionKey: false, strict: false, })

userSchema.methods.generateAuthToken = async function () {
    const user = {
        id: this._id,
        role: this.role
    }
    const token = jwt.sign(user, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE_TIME
    })

    await this.save()
    return token
}

module.exports = mongoose.model("User", userSchema);
