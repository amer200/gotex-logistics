const express = require("express");
const routes = express.Router();
const isAuth = require("../middlewares/isAuth");
const {
  chargeForOrder,
  checkPayment,
  getPaymentsByCarrier,
} = require("../controllers/payment");

/** user payment [with tap gateway] */
routes.post("/charge", isAuth("collector"), chargeForOrder);
routes.get("/check-tap-payment/:orderId/:code", checkPayment);
routes.get("/", isAuth("collector"), getPaymentsByCarrier);

module.exports = routes;
