const mongoose = require("mongoose");

const userSchema = mongoose.Schema({


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



}, { versionKey: false, strict: false, })

module.exports = mongoose.model("User", userSchema);
