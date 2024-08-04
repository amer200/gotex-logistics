const asyncHandler = require("express-async-handler");
const Order = require("../../models/order");

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
exports.getOrdersWithProblemRequest = asyncHandler(async (req, res) => {
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
