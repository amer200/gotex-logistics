const mongoose = require("mongoose");

const notificationsSchema = new mongoose.Schema({
    isread: {
        type: Boolean,
        default: false
    },
    data: {},
    carrier: { type: mongoose.Schema.Types.ObjectId, ref: 'Carrier' }

}, { versionKey: false, strict: false, timestamps: true })



module.exports = mongoose.model("Notification", notificationsSchema);
