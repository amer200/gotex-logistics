const asyncHandler = require("express-async-handler");
const Order = require("../models/order");
const { createPdf } = require("../utils/createPdf");
const addOrderToCarrier = require("../utils/addOrderToCarrier");
const {
  countDocsAfterFiltering,
  createPaginationObj,
} = require("../utils/pagination");
const ApiError = require("../utils/ApiError");

exports.createOrder = async (body, userId, io) => {
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

  const createdby = userId;

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
  });
  createPdf(order, false);

  await addOrderToCarrier(order, "collector", io);
  await order.save();

  return order;
};

// by admin
exports.getAllOrders = async (query) => {
  const page = +query.page || 1;
  const limit = +query.limit || 30;
  const skip = (page - 1) * limit;
  const startDate = query.startDate || new Date("2000-01-01");
  const endDate = query.endDate || new Date();
  const { ordernumber = "", paytype = "", status = "", keyword = "" } = query;

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

  return { pagination, ordersPerPage };
};

exports.getOrder = async (orderId) => {
  const url = await Order.findOne({ _id: orderId }, { ordernumber: 1, _id: 0 });

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

exports.returnOrder = async (orderId, files, io) => {
  let images = [];
  if (files && files[0]) {
    files.forEach((f) => {
      images.push(f.path);
    });
  }

  const order = await Order.findById(orderId);

  if (!order) {
    throw new ApiError(404, "Order is not found");
  }
  if (order.isreturn) {
    throw new ApiError(400, `The return request has already sent`);
  }
  if (order.status != "pick to client") {
    throw new ApiError(
      400,
      `Order status should be "pick to client" to do this request`
    );
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
  await addOrderToCarrier(order, "receiver", io); // add new receiver with same city of sender

  order.images.return = images;
  await order.save();

  return order;
};

// By User or Admin
exports.cancelOrder = async (userId, role, orderId, description, files) => {
  let order = "";
  if (role == "data entry") {
    order = await Order.findOne({ _id: orderId, createdby: userId });
  } else if (role == "admin") {
    order = await Order.findOne({ _id: orderId });
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
