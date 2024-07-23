const asyncHandler = require("express-async-handler");
const orderServices = require("../../services/order");

exports.createOrder = asyncHandler(async (req, res) => {
  const integrateRequest = true;
  const order = await orderServices.createOrder(
    req.body,
    req.body.userId,
    req.io,
    integrateRequest
  );

  res.json({ msg: "order created", data: order });
});

exports.getUserOrders = asyncHandler(async (req, res) => {
  const { pagination, ordersPerPage } =
    await orderServices.getUserOrdersIntegrate(req.body.userId);

  res.status(200).json({
    result: ordersPerPage.length,
    pagination: pagination,
    data: ordersPerPage,
  });
});

exports.getOrder = asyncHandler(async (req, res) => {
  const integrateRequest = true;
  const { url } = await orderServices.getOrder(req.params.id, integrateRequest);

  res.status(200).json({ url });
});

// By User or Admin
exports.cancelOrder = asyncHandler(async (req, res) => {
  const { userId, orderId, description } = req.body;
  const integrateRequest = true;

  await orderServices.cancelOrder(
    userId,
    "",
    orderId,
    description,
    req.files,
    integrateRequest
  );

  res.status(200).json({ msg: "ok" });
});
