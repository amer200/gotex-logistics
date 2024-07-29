const express = require("express");
const routes = express.Router();
const validate = require("../../middlewares/validate");
const orderSchema = require("../../utils/validators/order/orderSchema");
const {
  createOrder,
  getOrder,
  getUserOrders,
  cancelOrder,
} = require("../controllers/order");
const { isValid } = require("../middlewares/api-production");

routes.post("/create-order", isValid, validate(orderSchema), createOrder);

routes.get("/get-user-orders", isValid, getUserOrders);
routes.get("/getorder/:id", isValid, getOrder);

routes.put("/cancel-order", isValid, cancelOrder);

module.exports = routes;
