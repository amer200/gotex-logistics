const asyncHandler = require("express-async-handler");
const Order = require("../../models/order");
const Carrier = require("../../models/carrier");
const Notification = require("../../models/notifications");
const addOrderToCarrier = require("../../utils/addOrderToCarrier");
const {
  countDocsAfterFiltering,
  createPaginationObj,
} = require("../../utils/pagination");
const Storekeeper = require("../../models/storekeeper");
const orderServices = require("../../services/order");
const { createPdf } = require("../../utils/createPdf");

exports.createOrder = asyncHandler(async (req, res) => {
  const order = await orderServices.createOrder(req.body, req.user.id, req.io);

  res.json({ msg: "order created", data: order });
});

// by admin
exports.getAllOrders = asyncHandler(async (req, res) => {
  const { pagination, ordersPerPage } = await orderServices.getAllOrders(
    req.query
  );

  res.status(200).json({
    result: ordersPerPage.length,
    pagination: pagination,
    data: ordersPerPage,
  });
});

exports.getOrder = asyncHandler(async (req, res) => {
  const { url } = await orderServices.getOrder(req.params.id);

  res.status(200).json({ url });
});

exports.getUserOrders = asyncHandler(async (req, res) => {
  const orders = await orderServices.getUserOrders(req.user.id);

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
    .select("ordernumber status images isreturn")
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
    return res.status(404).json({ msg: "Order is not found" });
  }

  res.status(200).json({ data: order });
});

exports.returnOrder = asyncHandler(async (req, res) => {
  const orderId = req.params.id;

  let images = [];
  if (req.files && req.files[0]) {
    req.files.forEach((f) => {
      images.push(f.path);
    });
  }

  const order = await Order.findById(orderId);

  if (!order) {
    return res.status(404).json({ msg: "Order is not found" });
  }
  if (order.isreturn) {
    return res.status(400).json({ msg: `The return request is already sent` });
  }
  if (order.status != "pick to client") {
    return res.status(400).json({
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
    districtId: order.senderdistrictId,
    phone: order.senderphone,
  };
  order.sendername = order.recivername;
  order.sendercity = order.recivercity;
  order.senderaddress = order.reciveraddress;
  order.senderphone = order.reciverphone;
  order.senderdistrict = order.reciverdistrict;
  order.senderdistrictId = order.reciverdistrictId;
  order.recivername = receiver.name;
  order.recivercity = receiver.city;
  order.reciveraddress = receiver.address;
  order.reciverphone = receiver.phone;
  order.reciverdistrict = receiver.district;
  order.reciverdistrictId = receiver.districtId;
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
    createPdf(order, false);
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
