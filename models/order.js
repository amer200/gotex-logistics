const mongoose = require("mongoose");

const orderSchema = mongoose.Schema({
    recivername: {
        type: String,
        required: true
    },
    reciveraddress: {
        type: String,
        required: true
    },
    recivercity: {
        type: String,
        required: true
    },
    reciverphone: {
        type: String,
        required: true
    },
    sendername: {
        type: String,
        required: true
    },
    senderaddress: {
        type: String,
        required: true
    },
    sendercity: {
        type: String,
        required: true
    },
    senderphone: {
        type: String,
        required: true
    },
    createdby: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    ordernumber: String,
    paytype: String,
    price: Number,
    pieces: Number,
    description: String,
    weight: Number,
    location: Object,
    itemdetails: Object,
    pickedby: { type: mongoose.Schema.Types.ObjectId, ref: 'Carrier' },
    billcode: String,
    canceldescription: String,
    status: {
        type: String,
        enum: ['pending', 'pick up', 'delivered', 'canceled', ''],
        default: 'pending'
    }
}, { versionKey: false, strict: false, timestamps: true })
orderSchema.pre('save', function (next) {
    if (this.isNew) {
        this.ordernumber = this._id.toString().slice(-10);
        this.billcode = this._id.toString().slice(-10) + "Gotex";


    }
    next();
});
orderSchema.index({ status: 1 }, { unique: false })
orderSchema.index({ createdby: 1 }, { unique: false })
orderSchema.index({ pickedby: 1 }, { unique: false })
orderSchema.index({ ordernumber: 1 }, { unique: true })

module.exports = mongoose.model("Order", orderSchema);
