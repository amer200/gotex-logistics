const express = require("express");
const validate = require("../middlewares/validate");
const routes = express.Router();
const isAuth = require("../middlewares/isAuth");
const { createOrder, getAllOrders, getOrder, getUserOrders, getCarrierOrders, getCollectorOrders, getReceiverOrders, changeStatusByCollector, changeStatusByReceiver, getStorekeeperOrders } = require("../controllers/order");
const orderSchema = require("../utils/validators/order/orderSchema");
const changeStatusCollectorSchema = require("../utils/validators/order/changeStatusCollectorSchema");
const changeStatusReceiverSchema = require("../utils/validators/order/changeStatusReceiverSchema");

routes.get('/get-all', isAuth('admin'), getAllOrders);
routes.post('/create-order',
    isAuth('data entry'),
    validate(orderSchema),
    createOrder);
routes.get('/getorder/:id', getOrder);

routes.get('/get-user-orders', isAuth('data entry'), getUserOrders);
routes.get('/get-collector-orders', isAuth('collector'), getCollectorOrders);
routes.get('/get-receiver-orders', isAuth('receiver'), getReceiverOrders);
routes.get('/get-storekeeper-orders', isAuth('storekeeper'), getStorekeeperOrders);

routes.put('/change-status-by-collector',
    isAuth('collector'),
    validate(changeStatusCollectorSchema),
    changeStatusByCollector);
routes.put('/change-status-by-receiver',
    isAuth('receiver'),
    validate(changeStatusReceiverSchema),
    changeStatusByReceiver);

module.exports = routes;