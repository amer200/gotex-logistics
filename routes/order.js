const express = require("express");
const validate = require("../middlewares/validate");
const orderSchema = require("../utils/validators/orderSchema");
const routes = express.Router();
const isAuth = require("../middlewares/isAuth");
const { createOrder, getAllOrders, getOrder, getUserOrders, getCarrierOrders, getCollectorOrders, getReceiverOrders } = require("../controllers/order");

routes.get('/get-all', isAuth('admin'), getAllOrders);
routes.post('/create-order', isAuth('data entry'), validate(orderSchema), createOrder);
routes.get('/getorder/:id', getOrder);

routes.get('/get-user-orders', isAuth('data entry'), getUserOrders);
routes.get('/get-collector-orders', isAuth('collector'), getCollectorOrders);
routes.get('/get-receiver-orders', isAuth('receiver'), getReceiverOrders);

module.exports = routes;