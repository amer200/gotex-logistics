const express = require("express");
const routes = express.Router();
const isAuth = require("../middlewares/isAuth");
const {
  chargeForOrder,
  checkPayment,
  getPaymentsByOrderId,
} = require("../controllers/payment");

/** user payment [with tap gateway] */
routes.post("/charge/:orderId", isAuth("receiver"), chargeForOrder);
routes.get("/check-tap-payment/:orderId/:carrierId/:code", checkPayment);
routes.get(
  "/order-payments/:orderId",
  isAuth(["receiver", "admin"]),
  getPaymentsByOrderId
);

module.exports = routes;
