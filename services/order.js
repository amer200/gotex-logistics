const asyncHandler = require("express-async-handler");
const Order = require("../models/order");
const { createPdf } = require("../utils/createPdf");
const addOrderToCarrier = require("../utils/addOrderToCarrier");
const {
  countDocsAfterFiltering,
  createPaginationObj,
} = require("../utils/pagination");
const ApiError = require("../utils/ApiError");

exports.createOrder = async (body, userId, io, integrateRequest = false) => {
  const {
    sendername,
    senderaddress,
    sendercity,
    senderdistrict,
    senderdistrictId,
    senderphone,
    recivername,
    reciveraddress,
    recivercity,
    reciverdistrict,
    reciverdistrictId,
    reciverphone,
    paytype,
    price,
    weight,
    pieces,
    description,
  } = body;

  if (integrateRequest) {
    var userIntegrate = userId;
  } else {
    var createdby = userId;
  }

  const order = await Order.create({
    sendername,
    senderaddress,
    sendercity,
    senderdistrict,
    senderdistrictId,
    senderphone,
    recivername,
    reciveraddress,
    recivercity,
    reciverdistrict,
    reciverdistrictId,
    reciverphone,
    createdby,
    paytype,
    price,
    weight,
    pieces,
    description,

    integrateRequest,
    userIntegrate,
  });
  createPdf(order, false);

  await addOrderToCarrier(order, "collector", io);
  await order.save();

  return order;
};

// Main app [by admin]
exports.getAllOrders = async (query) => {
  const page = +query.page || 1;
  const limit = +query.limit || 30;
  const skip = (page - 1) * limit;
  const startDate = query.startDate || new Date("2000-01-01");
  const endDate = query.endDate || new Date();
  const {
    ordernumber = "",
    paytype = "",
    status = "",
    keyword = "",
    get = "",
  } = query;

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
        from: "userintegrates",
        localField: "userIntegrate",
        foreignField: "_id",
        as: "userIntegrate",
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
    {
      $lookup: {
        from: "payments",
        localField: "payment.cod",
        foreignField: "_id",
        as: "payment.cod",
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

  if (get == "integrate") {
    matchStage.$match.integrateRequest = true;
  } else if (get == "main") {
    matchStage.$match.integrateRequest = false;
  }

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
      // storekeeper: 0,

      "user.role": 0,
      "user.nid": 0,
      "user.address": 0,
      "user.city": 0,
      "user.verified": 0,
      "user.password": 0,

      "userIntegrate.role": 0,
      "userIntegrate.nid": 0,
      "userIntegrate.address": 0,
      "userIntegrate.city": 0,
      "userIntegrate.verified": 0,
      "userIntegrate.apiKey": 0,

      "collector.role": 0,
      "collector.nid": 0,
      "collector.address": 0,
      "collector.city": 0,
      "collector.verified": 0,
      "collector.password": 0,
      "collector.photo": 0,
      "collector.papers": 0,
      "collector.area": 0,
      "collector.deliveryCity": 0,
      "collector.deliveryDistricts": 0,
      "collector.createdAt": 0,
      "collector.updatedAt": 0,
      "collector.orders": 0,
      "collector.collectedCashAmount": 0,

      "receiver.role": 0,
      "receiver.nid": 0,
      "receiver.address": 0,
      "receiver.city": 0,
      "receiver.verified": 0,
      "receiver.password": 0,
      "receiver.photo": 0,
      "receiver.papers": 0,
      "receiver.area": 0,
      "receiver.deliveryCity": 0,
      "receiver.deliveryDistricts": 0,
      "receiver.createdAt": 0,
      "receiver.updatedAt": 0,
      "receiver.orders": 0,

      "storekeeper.role": 0,
      "storekeeper.nid": 0,
      "storekeeper.address": 0,
      "storekeeper.city": 0,
      "storekeeper.verified": 0,
      "storekeeper.password": 0,

      "payment.cod.data": 0,
      "payment.cod.code": 0,
      "payment.cod.order": 0,
      "payment.cod.carrier": 0,
      "payment.cod.createdAt": 0,
      "payment.cod.updatedAt": 0,
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
    matchStage,
    lookupStages
  );
  const pagination = createPaginationObj(page, limit, totalCount);

  return { pagination, ordersPerPage };
};

// Integrate [by user]
// with filter & pagination
exports.getUserOrdersIntegrate = async (query) => {
  const page = +query.page || 1;
  const limit = +query.limit || 30;
  const skip = (page - 1) * limit;
  const startDate = query.startDate || new Date("2000-01-01");
  const endDate = query.endDate || new Date();
  const { ordernumber = "", paytype = "", status = "" } = query;

  let matchStage = {
    $match: {
      integrateRequest: true,
      ordernumber: { $regex: ordernumber, $options: "i" },
      paytype: { $regex: paytype, $options: "i" },
      status: { $regex: status, $options: "i" },
      updatedAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    },
  };

  const projectStage = {
    $project: {
      __v: 0,
      createdby: 0,
      pickedby: 0,
      deliveredby: 0,
      storekeeper: 0,

      integrateRequest: 0,
      images: 0,
      inStore: 0,
      problem: 0,
      isreturn: 0,
      userIntegrate: 0,
    },
  };

  const ordersPerPage = await Order.aggregate([
    matchStage,
    { $sort: { updatedAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    projectStage,
  ]);

  const totalCount = await countDocsAfterFiltering(Order, matchStage);
  console.log(totalCount);
  const pagination = createPaginationObj(page, limit, totalCount);

  return { pagination, ordersPerPage };
};

exports.getOrder = async (orderId, integrateRequest = false) => {
  let url = "";
  if (integrateRequest) {
    url = await Order.findOne(
      { _id: orderId, integrateRequest },
      { ordernumber: 1, _id: 0 }
    );
  } else {
    url = await Order.findOne({ _id: orderId }, { ordernumber: 1, _id: 0 });
  }

  if (!url) {
    throw new ApiError(404, "Order is not found");
  }

  return { url: `upload/${url.ordernumber}.pdf` };
};

exports.getUserOrders = async (userId) => {
  const orders = await Order.find({ createdby: userId }).sort({
    createdAt: -1,
  });

  return orders;
};

exports.trackOrder = async (ordernumber) => {
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
    throw new ApiError(404, "Order is not found");
  }

  return order;
};

// By User or Admin in main app & user in integrate
exports.cancelOrder = async (
  userId,
  role,
  orderId,
  description,
  files,
  integrateRequest = false
) => {
  let order = "";
  if (role == "data entry") {
    order = await Order.findOne({ _id: orderId, createdby: userId });
  } else if (role == "admin") {
    order = await Order.findOne({ _id: orderId });
  } else if (integrateRequest) {
    order = await Order.findOne({ _id: orderId, integrateRequest });
  }

  if (!order) {
    throw new ApiError(404, "Order is not found");
  }
  if (order.status == "canceled") {
    throw new ApiError(400, `Order is already canceled`);
  }
  if (order.status != "pending") {
    throw new ApiError(400, `Order status is not pending. Can't cancel it`);
  }

  let images = [];
  if (files && files[0]) {
    files.forEach((f) => {
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
};
