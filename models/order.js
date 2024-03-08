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
    weight: Number,
    location: Object,
    itemdetails: Object,
    pickedby: { type: mongoose.Schema.Types.ObjectId, ref: 'Carrier' },
    billCode: String,
    created_at: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pick up', 'pending', 'delivered', 'canceled'],
        default: 'pending'
    }
}, { versionKey: false, strict: false, })
orderSchema.pre('save', function (next) {
    if (this.isNew) {
        this.ordernumber = this._id.toString().slice(-10);
        this.billCode = this._id.toString().slice(-10) + "Gotex";


    }
    next();
});
orderSchema.index({ status: 1 }, { unique: false })
orderSchema.index({ createdby: 1 }, { unique: false })
orderSchema.index({ pickedby: 1 }, { unique: false })
orderSchema.index({ ordernumber: 1 }, { unique: true })

module.exports = mongoose.model("Order", orderSchema);
