const asyncHandler = require("express-async-handler");
const Order = require("../models/order");
const { createPdf } = require("../utils/createPdf");
const addOrderToCarrier = require("../utils/addOrderToCarrier");

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
    paytype,
    price,
    weight,
    pieces,
    description,
  } = req.body;

  const createdby = req.user.id;

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
    description,
  });
  createPdf(order, false);

  await addOrderToCarrier(order, "collector", req.io);

  res.json({ msg: "order created", data: order });
});

exports.getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .sort({ updatedAt: -1 })
    .populate([
      {
        path: "createdby",
        select: "_id firstName lastName email mobile",
      },
      {
        path: "pickedby",
        select: "_id firstName lastName email mobile",
      },
      {
        path: "deliveredby",
        select: "_id firstName lastName email mobile",
      },
      {
        path: "storekeeper",
        select: "_id firstName lastName email mobile",
      },
    ]);

  res.status(200).json({
    result: orders.length,
    data: orders,
  });
});

exports.getOrder = asyncHandler(async (req, res) => {
  const id = req.params.id;
  const url = await Order.findOne({ _id: id }, { ordernumber: 1, _id: 0 });

  if (!url) {
    return res.status(409).json({ msg: "Order is not found" });
  }

  res.status(200).json({
    url: `upload/${url.ordernumber}.pdf`,
  });
});

exports.getUserOrders = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const orders = await Order.find({ createdby: userId }).sort({
    createdAt: -1,
  });

  res.status(200).json({ msg: "ok", data: orders });
});
exports.getCollectorOrders = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const orders = await Order.find({ pickedby: userId }).sort({ updatedAt: -1 });

  res.status(200).json({ msg: "ok", data: orders });
});
exports.getReceiverOrders = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const orders = await Order.find({ deliveredby: userId }).sort({
    updatedAt: -1,
  });

  res.status(200).json({ msg: "ok", data: orders });
});
exports.getStorekeeperOrders = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const orders = await Order.find({ storekeeper: userId }).sort({
    updatedAt: -1,
  });

  res.status(200).json({ msg: "ok", data: orders });
});

exports.changeStatusByCollector = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { orderId, status } = req.body;

  const order = await Order.findOneAndUpdate(
    { _id: orderId, pickedby: userId },
    { status },
    {
      new: true,
    }
  );
  if (!order) {
    return res.status(404).json({ msg: "Can't change this order status" });
  }

  res.status(200).json({ msg: "ok", data: order });
});
exports.changeStatusByReceiver = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { orderId, status } = req.body;

  let images = [];
  if (req.files) {
    req.files.forEach((f) => {
      images.push(f.path);
    });
  }

  const order = await Order.findOneAndUpdate(
    { _id: orderId, deliveredby: userId },
    { status, images },
    { new: true }
  );

  if (!order) {
    return res.status(404).json({ msg: "Can't change this order status" });
  }

  res.status(200).json({ msg: "ok", data: order });
});

exports.trackOrder = asyncHandler(async (req, res) => {
  const { ordernumber } = req.params;

  const order = await Order.findOne({ ordernumber })
    .select("ordernumber status images")
    .populate([
      {
        path: "pickedby",
        select: "_id firstName lastName",
      },
      {
        path: "deliveredby",
        select: "_id firstName lastName",
      },
      {
        path: "storekeeper",
        select: "_id firstName lastName city",
      },
    ]);

  res.status(200).json({ data: order });
});

exports.returnOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await Order.findOneAndUpdate(
    { _id: id },
    { isreturn: true },
    {
      new: true,
    }
  );
  createPdf(order, true);

  res.status(200).json({ msg: "ok", data: order });
});
