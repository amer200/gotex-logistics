const express = require("express");
const validate = require("../middlewares/validate");
const orderSchema = require("../utils/validators/orderSchema");
const routes = express.Router();
const { createOrder, getAllOrders } = require("../controllers/order");

routes.get('/get-all', getAllOrders);
routes.post('/create-order', validate(orderSchema), createOrder);
routes.get('/getorder/:id', getAllOrders);

module.exports = routes;