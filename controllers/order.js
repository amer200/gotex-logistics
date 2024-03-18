const asyncHandler = require('express-async-handler')
const Order = require("../models/order");
const { createPdf } = require("../utils/createPdf");


exports.createOrder = asyncHandler(async (req, res) => {
    const {
        recivername,
        reciveraddress,
        recivercity,
        reciverphone,
        sendername,
        senderaddress,
        sendercity,
        senderphone,
        createdby,
        paytype,
        price,
        weight,
        pieces,
        description
    } = req.body;
    const order = await Order.create({
        pieces,
        recivername,
        reciveraddress,
        recivercity,
        reciverphone,
        sendername,
        senderaddress,
        sendercity,
        senderphone,
        createdby,
        paytype,
        price,
        weight,
        description
    })
    createPdf(order);

    res.json({ msg: 'order created', data: order })
})

exports.getAllOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find()

    res.status(200).json({
        result: orders.length,
        data: orders
    })
})

exports.getOrder = asyncHandler(async (req, res) => {
    const id = req.params.id;
    const url = await Order.findOne({ _id: id }, { ordernumber: 1, _id: 0 });
    res.status(200).json({
        url: `upload/${url.ordernumber}.pdf`
    })
})