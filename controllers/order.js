const asyncHandler = require("express-async-handler");
const Order = require("../models/order");
const Carrier = require("../models/carrier");
const Notification = require("../models/notifications");
const { createPdf } = require("../utils/createPdf");
const addOrderToCarrier = require("../utils/addOrderToCarrier");
const {
  countDocsAfterFiltering,
  createPaginationObj,
} = require("../utils/pagination");
const Storekeeper = require("../models/storekeeper");
const changeOrderStatus = require("../utils/changeOrderStatus");
const cron = require("node-cron");

const scheduleExpression = "0 0 * * *"; // Every day at midnight (12:00 AM)

exports.createOrder = asyncHandler(async (req, res) => {
  const {
    sendername,
    senderaddress,
    sendercity,
    senderdistrict,
    senderphone,
    recivername,
    reciveraddress,
    recivercity,
    reciverdistrict,
    reciverphone,
    paytype,
    price,
    weight,
    pieces,
    description,
  } = req.body;

  const createdby = req.user.id;

  const order = await Order.create({
    sendername,
    senderaddress,
    sendercity,
    senderdistrict,
    senderphone,
    recivername,
    reciveraddress,
    recivercity,
    reciverdistrict,
    reciverphone,
    createdby,
    paytype,
    price,
    weight,
    pieces,
    description,
  });
  createPdf(order, false);

  await addOrderToCarrier(order, "collector", req.io);
  await order.save();

  res.json({ msg: "order created", data: order });
});

exports.getAllOrders = asyncHandler(async (req, res) => {
  const page = +req.query.page || 1;
  const limit = +req.query.limit || 30;
  const skip = (page - 1) * limit;
  const startDate = req.query.startDate || new Date("2000-01-01");
  const endDate = req.query.endDate || new Date();
  const {
    ordernumber = "",
    paytype = "",
    status = "",
    keyword = "",
  } = req.query;

  const lookupStages = [
    {
      // populate with user data
      $lookup: {
        from: "users", // collection name in mongoDB
        localField: "createdby",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $lookup: {
        from: "carriers",
        localField: "pickedby",
        foreignField: "_id",
        as: "collector",
      },
    },
    {
      $lookup: {
        from: "carriers",
        localField: "deliveredby",
        foreignField: "_id",
        as: "receiver",
      },
    },
    {
      $lookup: {
        from: "storekeepers",
        localField: "storekeeper",
        foreignField: "_id",
        as: "storekeeper",
      },
    },
  ];

  let matchStage = {
    $match: {
      ordernumber: { $regex: ordernumber, $options: "i" },
      paytype: { $regex: paytype, $options: "i" },
      status: { $regex: status, $options: "i" },
      updatedAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    },
  };

  if (keyword) {
    matchStage["$match"]["$or"] = [
      { "user.firstName": { $regex: keyword, $options: "i" } },
      { "user.lastName": { $regex: keyword, $options: "i" } },
      { "user.email": { $regex: keyword, $options: "i" } },
      { "user.mobile": { $regex: keyword, $options: "i" } },
      { "collector.firstName": { $regex: keyword, $options: "i" } },
      { "collector.lastName": { $regex: keyword, $options: "i" } },
      { "collector.email": { $regex: keyword, $options: "i" } },
      { "collector.mobile": { $regex: keyword, $options: "i" } },
      { "receiver.firstName": { $regex: keyword, $options: "i" } },
      { "receiver.lastName": { $regex: keyword, $options: "i" } },
      { "receiver.email": { $regex: keyword, $options: "i" } },
      { "receiver.mobile": { $regex: keyword, $options: "i" } },
      { "storekeeper.firstName": { $regex: keyword, $options: "i" } },
      { "storekeeper.lastName": { $regex: keyword, $options: "i" } },
      { "storekeeper.email": { $regex: keyword, $options: "i" } },
      { "storekeeper.mobile": { $regex: keyword, $options: "i" } },
    ];
  }

  const projectStage = {
    $project: {
      __v: 0,
      createdby: 0,
      pickedby: 0,
      deliveredby: 0,
      // "storekeeper": 0,

      "user.role": 0,
      "user.nid": 0,
      "user.address": 0,
      "user.city": 0,
      "user.verified": 0,
      "user.password": 0,

      "collector.role": 0,
      "collector.nid": 0,
      "collector.address": 0,
      "collector.city": 0,
      "collector.verified": 0,
      "collector.password": 0,
      "collector.photo": 0,
      "collector.papers": 0,
      "collector.area": 0,
      "collector.orders": 0,

      "receiver.role": 0,
      "receiver.nid": 0,
      "receiver.address": 0,
      "receiver.city": 0,
      "receiver.verified": 0,
      "receiver.password": 0,
      "receiver.photo": 0,
      "receiver.papers": 0,
      "receiver.area": 0,
      "receiver.orders": 0,

      "storekeeper.role": 0,
      "storekeeper.nid": 0,
      "storekeeper.address": 0,
      "storekeeper.city": 0,
      "storekeeper.verified": 0,
      "storekeeper.password": 0,
    },
  };

  const ordersPerPage = await Order.aggregate([
    ...lookupStages,
    matchStage,
    { $sort: { updatedAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    projectStage,
  ]);

  const totalCount = await countDocsAfterFiltering(
    Order,
    lookupStages,
    matchStage
  );
  const pagination = createPaginationObj(page, limit, totalCount);

  res.status(200).json({
    result: ordersPerPage.length,
    pagination,
    data: ordersPerPage,
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
  const orders = await Order.find({
    deliveredby: userId,
    status: { $nin: ["pending", "pick to store"] },
  }).sort({
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

  if (!order) {
    return res.status(409).json({ msg: "Order is not found" });
  }

  res.status(200).json({ data: order });
});

exports.returnOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let images = [];
  if (req.files && req.files[0]) {
    req.files.forEach((f) => {
      images.push(f.path);
    });
  }

  const order = await Order.findById(id);

  if (!order) {
    return res.status(409).json({ msg: "Order is not found" });
  }
  if (order.isreturn) {
    return res.status(404).json({
      msg: `The return request has already sent`,
    });
  }
  if (order.status != "pick to client") {
    return res.status(404).json({
      msg: `Order status should be "pick to client" to do this request`,
    });
  }

  order.isreturn = true;
  order.status = "in store";

  // swap data for sender and receiver
  // made picked by to delivered
  order.pickedby = order.deliveredby;
  const receiver = {
    name: order.sendername,
    address: order.senderaddress,
    city: order.sendercity,
    district: order.senderdistrict,
    phone: order.senderphone,
  };
  order.sendername = order.recivername;
  order.sendercity = order.recivercity;
  order.senderaddress = order.reciveraddress;
  order.senderphone = order.reciverphone;
  order.senderdistrict = order.reciverdistrict;
  order.recivername = receiver.name;
  order.recivercity = receiver.city;
  order.reciveraddress = receiver.address;
  order.reciverphone = receiver.phone;
  order.reciverdistrict = receiver.district;
  createPdf(order, false);
  await addOrderToCarrier(order, "receiver", req.io); // add new receiver with same city of sender

  order.images.return = images;
  await order.save();

  res.status(200).json({ msg: "ok", data: order });
});

exports.getOrdersWithoutCarriers = asyncHandler(async (req, res) => {
  const page = +req.query.page || 1;
  const limit = +req.query.limit || 30;
  const skip = (page - 1) * limit;

  const lookupStages = [
    {
      // populate with user data
      $lookup: {
        from: "users", // collection name in mongoDB
        localField: "createdby",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $lookup: {
        from: "carriers",
        localField: "pickedby",
        foreignField: "_id",
        as: "collector",
      },
    },
    {
      $lookup: {
        from: "carriers",
        localField: "deliveredby",
        foreignField: "_id",
        as: "receiver",
      },
    },
    {
      $lookup: {
        from: "storekeepers",
        localField: "storekeeper",
        foreignField: "_id",
        as: "storekeeper",
      },
    },
  ];

  let matchStage = {
    $match: {
      $or: [
        { pickedby: { $not: { $exists: true } } }, // not exist means if = "" or the key doesn't exist
        { deliveredby: { $not: { $exists: true } } },
      ],
    },
  };

  const projectStage = {
    $project: {
      __v: 0,
      createdby: 0,
      pickedby: 0,
      deliveredby: 0,
      // "storekeeper": 0,

      "user.role": 0,
      "user.nid": 0,
      "user.address": 0,
      "user.city": 0,
      "user.verified": 0,
      "user.password": 0,

      "collector.role": 0,
      "collector.nid": 0,
      "collector.address": 0,
      "collector.city": 0,
      "collector.verified": 0,
      "collector.password": 0,
      "collector.photo": 0,
      "collector.papers": 0,
      "collector.area": 0,
      "collector.orders": 0,

      "receiver.role": 0,
      "receiver.nid": 0,
      "receiver.address": 0,
      "receiver.city": 0,
      "receiver.verified": 0,
      "receiver.password": 0,
      "receiver.photo": 0,
      "receiver.papers": 0,
      "receiver.area": 0,
      "receiver.orders": 0,

      "storekeeper.role": 0,
      "storekeeper.nid": 0,
      "storekeeper.address": 0,
      "storekeeper.city": 0,
      "storekeeper.verified": 0,
      "storekeeper.password": 0,
    },
  };

  const ordersPerPage = await Order.aggregate([
    ...lookupStages,
    matchStage,
    { $sort: { updatedAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    projectStage,
  ]);

  const totalCount = await countDocsAfterFiltering(
    Order,
    lookupStages,
    matchStage
  );
  const pagination = createPaginationObj(page, limit, totalCount);

  res.status(200).json({
    result: ordersPerPage.length,
    pagination,
    data: ordersPerPage,
  });
});
exports.addOrderToCollector = asyncHandler(async (req, res) => {
  const { orderId, carrierId } = req.body;
  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({ msg: "Order is not found" });
  }

  if (order.pickedby) {
    return res.status(404).json({
      msg: `Order already added to a collector`,
    });
  }

  if (order.status != "pending") {
    return res.status(404).json({
      msg: `Order status should be "pending" to add a collector to order`,
    });
  }

  const carrier = await Carrier.findOne({ _id: carrierId, role: "collector" });
  if (!carrier) {
    return res.status(404).json({ msg: "Collector is not found" });
  }

  order.pickedby = carrierId;
  await order.save();

  let notification = Notification.create({
    data: order,
    carrier: carrier._id,
  });

  req.io.emit("create-order", notification);

  res.json({ msg: "ok", data: order });
});
exports.addOrderToReceiver = asyncHandler(async (req, res) => {
  const { orderId, carrierId } = req.body;
  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({ msg: "Order is not found" });
  }

  if (order.deliveredby) {
    return res.status(404).json({
      msg: `Order already added to a receiver`,
    });
  }

  if (order.status != "in store") {
    return res.status(404).json({
      msg: `Order status should be "in store" to add a receiver to order`,
    });
  }

  const carrier = await Carrier.findOne({ _id: carrierId, role: "receiver" });
  if (!carrier) {
    return res.status(404).json({ msg: "Receiver is not found" });
  }

  order.deliveredby = carrierId;
  await order.save();

  let notification = Notification.create({
    data: order,
    carrier: carrier._id,
  });

  req.io.emit("create-order", notification);

  res.json({ msg: "ok", data: order });
});

//#region change order status
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

  let order = "";
  if (role == "data entry") {
    order = await Order.findOne({ _id: orderId, createdby: userId });
  } else if (role == "admin") {
    order = await Order.findOne({ _id: orderId });
  }

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

  let images = [];
  if (req.files && req.files[0]) {
    req.files.forEach((f) => {
      images.push(f.path);
    });
  }

  order.status = "canceled";
  if (role == "data entry") {
    order.images.canceled.dataEntry = images;
    order.cancelDescription.dataEntry = description;
  } else if (role == "admin") {
    order.images.canceled.admin = images;
    order.cancelDescription.admin = description;
  }
  await order.save();

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
//#endregion change order status

/** By User */
exports.editOrder = asyncHandler(async (req, res) => {
  const { id: userId, role } = req.user;
  const { id: orderId } = req.params;
  const {
    recivername,
    reciveraddress,
    reciverphone,
    sendername,
    senderaddress,
    senderphone,
    price,
    pieces,
    description,
    weight,
  } = req.body;

  let order = "";
  if (role == "data entry") {
    order = await Order.findOne({ _id: orderId, createdby: userId });
  } else if (role == "admin") {
    order = await Order.findOne({ _id: orderId });
  }

  if (!order) {
    return res.status(404).json({ msg: "Order is not found" });
  }
  if (order.status != "pending") {
    return res.status(404).json({
      msg: `Order status is not pending. Can't edit it`,
    });
  }

  order.recivername = recivername;
  order.reciveraddress = reciveraddress;
  order.reciverphone = reciverphone;
  order.sendername = sendername;
  order.senderaddress = senderaddress;
  order.senderphone = senderphone;
  order.price = price;
  order.pieces = pieces;
  order.description = description;
  order.weight = weight;

  await order.save();

  res.status(200).json({ msg: "ok", data: order });
});

/** Order with problem */
// By Storekeeper in case of there is a problem within an order
exports.problemRequest = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { orderId, description } = req.body;

  const order = await Order.findOne({ _id: orderId, storekeeper: userId });
  if (!order) {
    return res.status(404).json({ msg: "Order is not found" });
  }
  if (["received", "canceled"].includes(order.status)) {
    return res.status(400).json({
      msg: `Order is ${order.status}. Can't do this request.`,
    });
  }
  if (order.status != "in store") {
    return res.status(404).json({
      msg: `Order status should be "in store" to do this request`,
    });
  }

  let images = [];
  if (req.files && req.files[0]) {
    req.files.forEach((f) => {
      images.push(f.path);
    });
  }

  order.problem.request = true;
  order.problem.description = description;
  order.problem.images = images;
  await order.save();

  res.status(200).json({ msg: "ok" });
});
// By Admin or Tracker
exports.getOrdersWithProblemRequests = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const orders = await Order.find({
    "problem.request": true,
  }).sort({ updatedAt: -1 });

  res.status(200).json({ result: orders.length, orders });
});
// By Admin or Tracker
exports.closeProblem = asyncHandler(async (req, res) => {
  const { orderId, description } = req.body;

  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({ msg: "Order is not found" });
  }
  if (!order.problem.request) {
    return res.status(404).json({ msg: "No problem request for this order" });
  }

  order.problem.status = "closed";
  order.problem.closedDescription = description;
  await order.save();

  res.status(200).json({ msg: "ok" });
});

exports.lateToStoreOrdersTest = asyncHandler(async (req, res) => {
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
  }).sort({ updatedAt: -1 });

  res.status(200).json({ result: orders.length, orders });
});

cron.schedule(scheduleExpression, lateToStoreOrders);
