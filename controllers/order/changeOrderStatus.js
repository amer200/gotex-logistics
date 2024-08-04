const asyncHandler = require("express-async-handler");
const Order = require("../../models/order");
const addOrderToCarrier = require("../../utils/addOrderToCarrier");
const Storekeeper = require("../../models/storekeeper");
const changeOrderStatus = require("../../utils/changeOrderStatus");
const cron = require("node-cron");
const orderServices = require("../../services/order");

const scheduleExpression = "0 21 * * *"; // Every day at midnight (12:00 AM saudi arabia)

// By User or Admin. To change order status to pending after canceling order.
exports.changeStatusToPending = asyncHandler(async (req, res) => {
  const { id: userId, role } = req.user;
  const { orderId } = req.body;
  const prevStatus = "canceled";
  const changeStatusTo = "pending";

  let order = "";
  if (role == "data entry") {
    order = await Order.findOne({ _id: orderId, createdby: userId });
  } else if (role == "admin") {
    order = await Order.findOne({ _id: orderId });
  }

  if (!order) {
    return res.status(404).json({ msg: "Order is not found" });
  }
  if (order.status == changeStatusTo) {
    return res.status(400).json({
      msg: `Order status is already "${changeStatusTo}"`,
    });
  }
  if (order.status != prevStatus) {
    return res.status(404).json({
      msg: `Order status should be ${prevStatus} to change it to ${changeOrderStatus}`,
    });
  }

  let images = [];
  if (req.files && req.files[0]) {
    req.files.forEach((f) => {
      images.push(f.path);
    });
  }

  order.status = "pending";
  order.images.pending = images;
  await order.save();

  res.status(200).json({ msg: "ok" });
});

// By Collector
exports.pickedToStore = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { orderId } = req.body;
  const prevStatus = "pending";
  const changeStatusTo = "pick to store";

  const order = await Order.findOne({ _id: orderId, pickedby: userId });

  await changeOrderStatus(order, prevStatus, changeStatusTo);

  let images = [];
  if (req.files && req.files[0]) {
    req.files.forEach((f) => {
      images.push(f.path);
    });
  } else {
    return res.status(404).json({
      msg: `images are required`,
    });
  }

  order.images.pickedToStore = images;
  await order.save();

  res.status(200).json({ msg: "ok" });
});

exports.orderInStoreRequest = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { orderId } = req.body;

  const order = await Order.findOne({ _id: orderId, pickedby: userId });
  if (!order) {
    return res.status(404).json({ msg: "Order is not found" });
  }
  if (["received", "canceled"].includes(order.status)) {
    return res.status(400).json({
      msg: `Order is ${order.status}. Can't do this request.`,
    });
  }
  if (!["pick to store", "late to store"].includes(order.status)) {
    return res.status(404).json({
      msg: `Order status should be "pick to store" to do this request`,
    });
  }

  let images = [];
  if (req.files && req.files[0]) {
    req.files.forEach((f) => {
      images.push(f.path);
    });
  }

  order.inStore.request = true;
  order.images.inStoreRequest = images;
  await order.save();

  res.status(200).json({ msg: "ok" });
});

// By Store Keeper
/* to get in store requests for storekeeper (storekeeper in the same city as the sender city)*/
exports.getInStoreRequests = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const storekeeper = await Storekeeper.findById(userId);

  const orders = await Order.find({
    "inStore.request": true,
    status: "pick to store",
    sendercity: storekeeper.city,
  }).sort({ updatedAt: -1 });

  res.status(200).json({ result: orders.length, orders });
});
exports.inStoreRequestStatus = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { orderId, requestStatus } = req.body;

  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({ msg: "Order is not found" });
  }
  if (!order.inStore.request) {
    return res.status(404).json({ msg: "No request for this order" });
  }
  if (order.status == "in store") {
    return res.status(400).json({
      err: "This order is already in store",
    });
  }

  const storekeeper = await Storekeeper.findById(userId);
  if (storekeeper.city != order.sendercity) {
    return res.status(404).json({ msg: "Can't access this order" });
  }

  order.inStore.requestStatus = requestStatus;
  if (requestStatus == "accepted") {
    order.status = "in store";
    order.storekeeper = userId;

    await addOrderToCarrier(order, "receiver", req.io);
  }

  let images = [];
  if (req.files && req.files[0]) {
    req.files.forEach((f) => {
      images.push(f.path);
    });
  }

  order.images.inStoreRequestStatus = images;
  await order.save();

  res.status(200).json({ msg: "ok" });
});

// By Receiver
exports.pickedToClient = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { orderId } = req.body;
  const prevStatus = "in store";
  const changeStatusTo = "pick to client";

  const order = await Order.findOne({ _id: orderId, deliveredby: userId });

  await changeOrderStatus(order, prevStatus, changeStatusTo);

  let images = [];
  if (req.files && req.files[0]) {
    req.files.forEach((f) => {
      images.push(f.path);
    });
  }

  order.images.pickedToClient = images;
  await order.save();

  res.status(200).json({ msg: "ok" });
});
exports.orderReceived = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { orderId } = req.body;
  const prevStatus = "pick to client";
  const changeStatusTo = "received";

  const order = await Order.findOne({ _id: orderId, deliveredby: userId });

  await changeOrderStatus(order, prevStatus, changeStatusTo);

  let images = [];
  if (req.files && req.files[0]) {
    req.files.forEach((f) => {
      images.push(f.path);
    });
  } else {
    return res.status(404).json({
      msg: `images are required`,
    });
  }

  order.images.received = images;
  await order.save();

  res.status(200).json({ msg: "ok" });
});

// By User or Admin
exports.cancelOrder = asyncHandler(async (req, res) => {
  const { id: userId, role } = req.user;
  const { orderId, description } = req.body;

  await orderServices.cancelOrder(
    userId,
    role,
    orderId,
    description,
    req.files
  );

  res.status(200).json({ msg: "ok" });
});

/**By Collector. Can cancel order after three days from creating it
 *  (in pending status == sender doesn't response). */
exports.cancelOrderByCollector = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { orderId, description } = req.body;

  const order = await Order.findOne({ _id: orderId, pickedby: userId });

  if (!order) {
    return res.status(404).json({ msg: "Order is not found" });
  }
  if (order.status == "canceled") {
    return res.status(404).json({
      msg: `Order is already canceled`,
    });
  }
  if (order.status != "pending") {
    return res.status(404).json({
      msg: `Order status is not pending. Can't cancel it`,
    });
  }

  const daysPassed = Math.floor(
    (new Date() - order.createdAt) / (1000 * 60 * 60 * 24)
  );
  if (daysPassed < 3) {
    return res.status(404).json({
      msg: `Can't cancel order within 3 days of creating it.`,
    });
  }

  let images = [];
  if (req.files && req.files[0]) {
    req.files.forEach((f) => {
      images.push(f.path);
    });
  }

  order.status = "canceled";
  order.images.canceled.collector = images;
  order.cancelDescription.collector = description;
  await order.save();

  res.status(200).json({ msg: "ok" });
});

/** Late to store  */
const lateToStoreOrders = asyncHandler(async (req, res) => {
  let endOfDay = new Date();
  endOfDay = new Date(endOfDay.setDate(endOfDay.getDate() + 1));
  endOfDay.setHours(0, 0, 0, 0);

  const orders = await Order.updateMany(
    {
      status: "pick to store",
      updatedAt: { $lt: endOfDay },
    },
    { status: "late to store" }
  );

  res.status(200).json({ msg: "ok" });
});
exports.getLateToStoreOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({
    status: "late to store",
  })
    .sort({ updatedAt: -1 })
    .populate([
      {
        path: "pickedby",
        select: "_id firstName lastName email mobile",
      },
    ]);

  res.status(200).json({ result: orders.length, orders });
});

cron.schedule(scheduleExpression, lateToStoreOrders);

// for testing
exports.lateToStoreOrdersRoute = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const prevStatus = "pick to store";
  const changeStatusTo = "late to store";

  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({ msg: "Order is not found" });
  }

  await changeOrderStatus(order, prevStatus, changeStatusTo);
  await order.save();

  res.status(200).json({ msg: "ok" });
});
