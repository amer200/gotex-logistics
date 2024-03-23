const express = require("express");
const validate = require("../middlewares/validate");
const orderSchema = require("../utils/validators/orderSchema");
const routes = express.Router();
const isAuth = require("../middlewares/isAuth");
const { createOrder, getAllOrders, getOrder, getCollectorOrders } = require("../controllers/order");

routes.get('/get-all', getAllOrders);
routes.post('/create-order', isAuth('data entry'), validate(orderSchema), createOrder);
routes.get('/getorder/:id', getOrder);

routes.get('/get-collector-orders', isAuth('collector'), getCollectorOrders);

module.exports = routes;