const express = require("express");
const validate = require("../middlewares/validate");
const orderSchema = require("../utils/validators/orderSchema");
const routes = express.Router();
const isAuth = require("../middlewares/isAuth");
const { createOrder, getAllOrders, getOrder, getUserOrders, getCarrierOrders } = require("../controllers/order");

routes.get('/get-all', isAuth('admin'), getAllOrders);
routes.post('/create-order', isAuth('data entry'), validate(orderSchema), createOrder);
routes.get('/getorder/:id', getOrder);

routes.get('/get-user-orders', isAuth('data entry'), getUserOrders);
routes.get('/get-carrier-orders', isAuth(['collector', 'receiver']), getCarrierOrders);

module.exports = routes;