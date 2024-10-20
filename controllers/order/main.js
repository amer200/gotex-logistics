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
const mongoose = require("mongoose");
const getDocsWithAggregation = require("../../utils/getDocsWithAggregation");

exports.createOrder = asyncHandler(async (req, res) => {
  const order = await orderServices.createOrder(req.body, req.user.id, req.io);

  res.status(201).json({ msg: "order created", data: order });
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

  const startDate = req.query.startDate || new Date("2000-01-01");
  const endDate = req.query.endDate || new Date();
  const { status = "" } = req.query;

  const matchStage = {
    $match: {
      pickedby: new mongoose.Types.ObjectId(userId),
      status: { $regex: status, $options: "i" },
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    },
  };

  const projectStage = {
    $project: {
      __v: 0,

      inStore: 0,
      problem: 0,
      receiverPaidCash: 0,
      orderPaidWithVisa: 0,
      storekeeperPaidCash: 0,
      paidWithVisaFromStorekeeper: 0,
    },
  };

  const sortStage = { $sort: { updatedAt: -1 } };

  const { ordersPerPage, pagination } = await getDocsWithAggregation(
    req.query.page,
    req.query.limit,
    Order,
    matchStage,
    sortStage,
    projectStage
  );

  res.status(200).json({
    result: ordersPerPage.length,
    pagination,
    data: ordersPerPage,
  });
});

exports.getReceiverOrders = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const receiver = await Carrier.findById(userId);

  const startDate = req.query.startDate || new Date("2000-01-01");
  const endDate = req.query.endDate || new Date();
  const { status = "" } = req.query;

  const matchStage = {
    $match: {
      deliveredby: new mongoose.Types.ObjectId(userId),
      $and: [
        // filter on any status unless pending and pick to store
        { status: { $nin: ["pending", "pick to store"] } },
        { status: { $regex: status, $options: "i" } },
      ],
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    },
  };

  const projectStage = {
    $project: {
      __v: 0,

      problem: 0,
      receiverPaidCash: 0,
      orderPaidWithVisa: 0,
      storekeeperPaidCash: 0,
      paidWithVisaFromStorekeeper: 0,

      "payment.cod.data": 0,
      "payment.cod.code": 0,
      "payment.cod.carrier": 0,
      "payment.cod.updatedAt": 0,
    },
  };

  const sortStage = { $sort: { updatedAt: -1 } };

  const lookupStages = [
    {
      $lookup: {
        from: "payments",
        localField: "payment.cod",
        foreignField: "_id",
        as: "payment.cod",
      },
    },
  ];

  const { ordersPerPage, pagination } = await getDocsWithAggregation(
    req.query.page,
    req.query.limit,
    Order,
    matchStage,
    sortStage,
    projectStage
  );

  res.status(200).json({
    msg: "ok",
    receiver: {
      collectedCashAmount: receiver.collectedCashAmount,
      collectedVisaAmount: receiver.collectedVisaAmount,
    },
    result: ordersPerPage.length,
    pagination,
    data: ordersPerPage,
  });
});

// storekeeper orders - get all orders that are in store orders and any status after in store
exports.getStorekeeperOrders = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const storekeeper = await Storekeeper.findById(userId);

  const page = +req.query.page || 1;
  const limit = +req.query.limit || 30;
  const skip = (page - 1) * limit;
  const startDate = req.query.startDate || new Date("2000-01-01");
  const endDate = req.query.endDate || new Date();
  const { status = "", paytype = "", receiver = "" } = req.query;

  const lookupStages1 = [
    {
      $lookup: {
        from: "payments",
        localField: "payment.cod",
        foreignField: "_id",
        as: "payment.cod",
      },
    },
  ];

  const matchStage1 = {
    $match: {
      storekeeper: new mongoose.Types.ObjectId(userId),
      status: { $regex: status, $options: "i" },
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    },
  };

  if (paytype == "cash cod") {
    matchStage1.$match.paytype = "cod";
    matchStage1.$match.status = "received";
    matchStage1.$match["payment.cod"] = { $size: 0 };
  } else if (paytype == "visa cod") {
    matchStage1.$match.paytype = "cod";
    matchStage1.$match.status = "received";
    matchStage1.$match.$and = [{ "payment.cod.status": "CAPTURED" }];
  }

  const lookupStages2 = [
    {
      $lookup: {
        from: "carriers",
        localField: "deliveredby",
        foreignField: "_id",
        as: "deliveredby",
      },
    },
  ];

  const addFieldsStage = [
    {
      $unwind: {
        path: "$deliveredby",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        "deliveredby.fullName": {
          $cond: {
            if: { $eq: ["$deliveredby", null] },
            then: "",
            else: {
              $concat: ["$deliveredby.firstName", " ", "$deliveredby.lastName"],
            },
          },
        },
      },
    },
  ];
  const matchStage2 = {
    $match: {
      $or: [
        { $expr: { $eq: [receiver, ""] } }, // If receiver param is empty, match all documents
        { "deliveredby.fullName": { $regex: receiver, $options: "i" } },
      ],
    },
  };

  const projectStage = {
    $project: {
      "deliveredby.firstName": 0,
      "deliveredby.lastName": 0,
      "deliveredby.email": 0,
      "deliveredby.mobile": 0,
      "deliveredby.role": 0,
      "deliveredby.nid": 0,
      "deliveredby.address": 0,
      "deliveredby.city": 0,
      "deliveredby.verified": 0,
      "deliveredby.papers": 0,
      "deliveredby.deliveryCity": 0,
      "deliveredby.deliveryDistricts": 0,
      "deliveredby.orders": 0,
      "deliveredby.createdAt": 0,
      "deliveredby.updatedAt": 0,
      "deliveredby.password": 0,
      "deliveredby.collectedCashAmount": 0,
      "deliveredby.collectedVisaAmount": 0,

      "payment.cod.data": 0,
      "payment.cod.code": 0,
      "payment.cod.order": 0,
      "payment.cod.carrier": 0,
      "payment.cod.updatedAt": 0,
    },
  };

  const pipeline = [
    ...lookupStages1,
    matchStage1,
    ...lookupStages2,
    { $sort: { updatedAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    ...addFieldsStage,
    matchStage2,
    projectStage,
  ];
  if (receiver) {
    pipeline.push(addFieldsStage, matchStage2);
  }

  const ordersPerPage = await Order.aggregate(pipeline);

  const totalCount = await countDocsAfterFiltering(
    Order,
    lookupStages1,
    matchStage1,
    lookupStages2,
    addFieldsStage,
    matchStage2
  );
  const pagination = createPaginationObj(page, limit, totalCount);

  res.status(200).json({
    msg: "ok",
    storekeeper: {
      collectedCashAmount: storekeeper.collectedCashAmount,
      collectedVisaAmount: storekeeper.collectedVisaAmount,
    },
    result: ordersPerPage.length,
    pagination,
    data: ordersPerPage,
  });
});
exports.getStorekeeperOrders = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const storekeeper = await Storekeeper.findById(userId);

  const page = +req.query.page || 1;
  const limit = +req.query.limit || 30;
  const skip = (page - 1) * limit;
  const startDate = req.query.startDate || new Date("2000-01-01");
  const endDate = req.query.endDate || new Date();
  const { status = "", paytype = "", receiver = "" } = req.query;

  const lookupStages1 = [
    {
      $lookup: {
        from: "payments",
        localField: "payment.cod",
        foreignField: "_id",
        as: "payment.cod",
      },
    },
  ];

  const matchStage1 = {
    $match: {
      storekeeper: new mongoose.Types.ObjectId(userId),
      status: { $regex: status, $options: "i" },
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    },
  };

  if (paytype == "cash cod") {
    matchStage1.$match.paytype = "cod";
    matchStage1.$match.status = "received";
    matchStage1.$match["payment.cod"] = { $size: 0 };
  } else if (paytype == "visa cod") {
    matchStage1.$match.paytype = "cod";
    matchStage1.$match.status = "received";
    matchStage1.$match.$and = [{ "payment.cod.status": "CAPTURED" }];
  }

  const lookupStages2 = [
    {
      $lookup: {
        from: "carriers",
        localField: "deliveredby",
        foreignField: "_id",
        as: "deliveredby",
      },
    },
  ];

  const addFieldsStage = [
    {
      $unwind: {
        path: "$deliveredby",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        "deliveredby.fullName": {
          $cond: {
            if: { $eq: ["$deliveredby", null] },
            then: "",
            else: {
              $concat: ["$deliveredby.firstName", " ", "$deliveredby.lastName"],
            },
          },
        },
      },
    },
  ];
  const matchStage2 = {
    $match: {
      $or: [
        { $expr: { $eq: [receiver, ""] } }, // If receiver param is empty, match all documents
        { "deliveredby.fullName": { $regex: receiver, $options: "i" } },
      ],
    },
  };

  const projectStage = {
    $project: {
      "deliveredby.firstName": 0,
      "deliveredby.lastName": 0,
      "deliveredby.email": 0,
      "deliveredby.mobile": 0,
      "deliveredby.role": 0,
      "deliveredby.nid": 0,
      "deliveredby.address": 0,
      "deliveredby.city": 0,
      "deliveredby.verified": 0,
      "deliveredby.papers": 0,
      "deliveredby.deliveryCity": 0,
      "deliveredby.deliveryDistricts": 0,
      "deliveredby.orders": 0,
      "deliveredby.createdAt": 0,
      "deliveredby.updatedAt": 0,
      "deliveredby.password": 0,
      "deliveredby.collectedCashAmount": 0,
      "deliveredby.collectedVisaAmount": 0,

      "payment.cod.data": 0,
      "payment.cod.code": 0,
      "payment.cod.order": 0,
      "payment.cod.carrier": 0,
      "payment.cod.updatedAt": 0,
    },
  };

  const pipeline = [
    ...lookupStages1,
    matchStage1,
    ...lookupStages2,
    { $sort: { updatedAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    ...addFieldsStage,
    matchStage2,
    projectStage,
  ];
  if (receiver) {
    pipeline.push(addFieldsStage, matchStage2);
  }

  const ordersPerPage = await Order.aggregate(pipeline);

  const totalCount = await countDocsAfterFiltering(
    Order,
    lookupStages1,
    matchStage1,
    lookupStages2,
    addFieldsStage,
    matchStage2
  );
  const pagination = createPaginationObj(page, limit, totalCount);

  res.status(200).json({
    msg: "ok",
    storekeeper: {
      collectedCashAmount: storekeeper.collectedCashAmount,
      collectedVisaAmount: storekeeper.collectedVisaAmount,
    },
    result: ordersPerPage.length,
    pagination,
    data: ordersPerPage,
  });
});
// by storekeeper - get orders that should be delivered to the store (pending & pick to store status + in the storekeeper city)
exports.getOrdersToBeStored = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const storekeeper = await Storekeeper.findById(userId);

  const orders = await Order.find({
    status: { $in: ["pending", "pick to store"] },
    sendercity: storekeeper.city,
  })
    .populate({
      path: "pickedby",
      select: "_id firstName lastName mobile",
    })
    .sort({ updatedAt: -1 });

  res.status(200).json({ result: orders.length, orders });
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
        select: "_id firstName lastName mobile",
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
    phone2: order.senderphone2,
  };
  order.sendername = order.recivername;
  order.sendercity = order.recivercity;
  order.senderaddress = order.reciveraddress;
  order.senderphone = order.reciverphone;
  order.senderphone2 = order.reciverphone2;
  order.senderdistrict = order.reciverdistrict;
  order.senderdistrictId = order.reciverdistrictId;
  order.recivername = receiver.name;
  order.recivercity = receiver.city;
  order.reciveraddress = receiver.address;
  order.reciverphone = receiver.phone;
  order.reciverphone2 = receiver.phone2;
  order.reciverdistrict = receiver.district;
  order.reciverdistrictId = receiver.districtId;
  createPdf(order, false);
  await addOrderToCarrier(order, "receiver", req.io); // add new receiver with same city of sender

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

  order.images.return = images;
  await order.save();

  res.status(200).json({ msg: "ok", data: order });
});

/** By Admin and Tracker */
exports.getOrdersWithoutCarriers = asyncHandler(async (req, res) => {
  const matchStage = {
    $match: {
      $or: [
        { pickedby: { $not: { $exists: true } } }, // not exist means if = "" or the key doesn't exist
        { deliveredby: { $not: { $exists: true } } },
      ],
    },
  };

  const sortStage = { $sort: { updatedAt: -1 } };

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

  const { ordersPerPage, pagination } = await getDocsWithAggregation(
    req.query.page,
    req.query.limit,
    Order,
    matchStage,
    sortStage,
    projectStage,
    lookupStages
  );

  res.status(200).json({
    result: ordersPerPage.length,
    pagination,
    data: ordersPerPage,
  });
});
/** By Admin */
exports.addOrderToCollector = asyncHandler(async (req, res) => {
  const { orderId, carrierId, description } = req.body;
  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({ msg: "Order is not found" });
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

  order.addCarrierReason.collector.images = images;
  order.addCarrierReason.collector.description = description;
  await order.save();

  let notification = Notification.create({
    data: order,
    carrier: carrier._id,
  });

  req.io.emit("create-order", notification);

  res.json({ msg: "ok", data: order });
});
/** By Admin and Storekeeper */
exports.addOrderToReceiver = asyncHandler(async (req, res) => {
  const { orderId, carrierId, description } = req.body;
  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({ msg: "Order is not found" });
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

  order.addCarrierReason.receiver.images = images;
  order.addCarrierReason.receiver.description = description;
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
    sendername,
    senderaddress,
    senderphone,
    senderphone2 = "",
    recivername,
    reciveraddress,
    reciverphone,
    reciverphone2 = "",
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
  order.reciverphone2 = reciverphone2;
  order.sendername = sendername;
  order.senderaddress = senderaddress;
  order.senderphone = senderphone;
  order.senderphone2 = senderphone2;
  order.price = price;
  order.pieces = pieces;
  order.description = description;
  order.weight = weight;

  createPdf(order, false);

  await order.save();

  res.status(200).json({ msg: "ok", data: order });
});

/******** COD paytype *******/
// Storekeeper takes the cash money of the cod order from receiver carrier
exports.takeOrderCashFromReceiver = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { orderId } = req.params;

  const storekeeper = await Storekeeper.findById(userId);

  const order = await Order.findOne({
    _id: orderId,
    storekeeper: storekeeper._id,
    paytype: "cod",
  }).populate({
    path: "payment.cod",
    select: "status amount createdAt",
  });
  if (!order) {
    return res.status(404).json({
      msg: "Order is not found or may be it is paid with cc paytype",
    });
  }
  if (order.payment.cod?.status == "CAPTURED") {
    return res.status(400).json({ msg: "This order is paid with visa." });
  }
  if (order.receiverPaidCash) {
    return res.status(400).json({
      msg: "You should already have collected the cash for this order.",
    });
  }
  if (order.status != "received") {
    return res
      .status(400)
      .json({ msg: `Order status has to be "received" to do this action` });
  }

  const receiver = await Carrier.findById(order.deliveredby);
  if (!receiver) {
    return res.status(404).json({ msg: "Receiver is not found" });
  }

  order.receiverPaidCash = true;
  receiver.collectedCashAmount -= order.price;
  storekeeper.collectedCashAmount += order.price;
  await Promise.all([order.save(), storekeeper.save(), receiver.save()]);

  res.status(200).json({ msg: "ok" });
});
/**
 * Storekeeper confirms that the order is already paid (cod) successfully with visa
 * so the order price is subtracted from collector collectedVisaAmount
 */
exports.orderPaidWithVisa = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { orderId } = req.params;

  const storekeeper = await Storekeeper.findById(userId);

  const order = await Order.findOne({
    _id: orderId,
    storekeeper: storekeeper._id,
    paytype: "cod",
  }).populate({
    path: "payment.cod",
    select: "status amount createdAt",
  });
  if (!order) {
    return res.status(404).json({
      msg: "Order is not found or may be it is paid with cc paytype",
    });
  }
  if (order.status != "received") {
    return res
      .status(400)
      .json({ msg: `Order status has to be "received" to do this action` });
  }
  if (order.payment.cod?.status != "CAPTURED") {
    return res.status(400).json({ msg: "Order is not paid with visa." });
  }
  if (order.orderPaidWithVisa) {
    return res.status(400).json({
      msg: "You already have confirmed that this order is paid with visa.",
    });
  }

  const receiver = await Carrier.findById(order.deliveredby);
  if (!receiver) {
    return res.status(404).json({ msg: "Receiver is not found" });
  }

  order.orderPaidWithVisa = true;
  receiver.collectedVisaAmount -= order.price;
  storekeeper.collectedVisaAmount += order.price;
  await Promise.all([order.save(), storekeeper.save(), receiver.save()]);

  res.status(200).json({ msg: "ok" });
});

// Admin takes the cash money of the cod order from receiver carrier
exports.takeOrderCashFromStorekeeper = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findOne({
    _id: orderId,
    paytype: "cod",
  }).populate({
    path: "payment.cod",
    select: "status amount createdAt",
  });
  if (!order) {
    return res.status(404).json({
      msg: "Order is not found or may be it is paid with cc paytype",
    });
  }
  if (order.status != "received") {
    return res
      .status(400)
      .json({ msg: `Order status has to be "received" to do this action` });
  }
  if (!order.receiverPaidCash) {
    return res
      .status(400)
      .json({ msg: `Receiver has to give the cash to storekeeper firstly` });
  }
  if (order.payment.cod?.status == "CAPTURED") {
    return res.status(400).json({ msg: "This order is paid with visa." });
  }
  if (order.storekeeperPaidCash) {
    return res.status(400).json({
      msg: "You should already have collected the cash for this order.",
    });
  }

  const storekeeper = await Storekeeper.findById(order.storekeeper);
  if (!storekeeper) {
    return res.status(404).json({ msg: "storekeeper is not found" });
  }

  order.storekeeperPaidCash = true;
  storekeeper.collectedCashAmount -= order.price;
  await Promise.all([order.save(), storekeeper.save()]);

  res.status(200).json({ msg: "ok" });
});
/**
 * Admin confirms that the order is already paid (cod) successfully with visa
 * so the order price is subtracted from storekeeper collectedVisaAmount
 */
exports.orderPaidWithVisaFromStorekeeper = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findOne({
    _id: orderId,
    paytype: "cod",
  }).populate({
    path: "payment.cod",
    select: "status amount createdAt",
  });
  if (!order) {
    return res.status(404).json({
      msg: "Order is not found or may be it is paid with cc paytype",
    });
  }
  if (order.payment.cod?.status != "CAPTURED") {
    return res.status(400).json({ msg: "Order is not paid with visa." });
  }
  if (!order.orderPaidWithVisa) {
    return res.status(400).json({
      msg: "Order has to be confirmed that it is paid with visa from collector first.",
    });
  }
  if (order.paidWithVisaFromStorekeeper) {
    return res.status(400).json({
      msg: "You already have confirmed that this order is paid with visa.",
    });
  }

  const storekeeper = await Storekeeper.findById(order.storekeeper);
  if (!storekeeper) {
    return res.status(404).json({ msg: "Receiver is not found" });
  }

  order.paidWithVisaFromStorekeeper = true;
  storekeeper.collectedVisaAmount -= order.price;
  await Promise.all([order.save(), storekeeper.save()]);

  res.status(200).json({ msg: "ok" });
});
