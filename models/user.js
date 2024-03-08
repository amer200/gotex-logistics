const mongoose = require("mongoose");

const userSchema = mongoose.Schema({

    username: String,
    password: String,
    email: {
        type: String,
        unique: true
    },
    mobile: String,
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    nid: {
        type: String,
        unique: true
    },

    address: String,
    city: String,
    firstName: String,
    lastName: String,



}, { versionKey: false, strict: false, })
userSchema.index({ username: 1 }, { unique: false })

module.exports = mongoose.model("User", userSchema);
