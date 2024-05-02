const express = require("express");
const validate = require("../middlewares/validate");
const routes = express.Router();
const isAuth = require("../middlewares/isAuth");
const {
  createOrder,
  getAllOrders,
  getOrder,
  returnOrder,
  getUserOrders,
  getCarrierOrders,
  getCollectorOrders,
  getReceiverOrders,
  getStorekeeperOrders,
  trackOrder,
  addOrderToCollector,
  getOrdersWithoutCarriers,
  addOrderToReceiver,
  pickedByCollector,
  deliveredByCollector,
  pickedByReceiver,
  cancelOrderByReceiver,
  orderInStoreRequest,
  inStoreRequestStatus,
  deliveredByReceiver,
  orderReceived,
} = require("../controllers/order");
const orderSchema = require("../utils/validators/order/orderSchema");
const inStoreRequestStatusSchema = require("../utils/validators/order/inStoreRequestStatusSchema");

routes.get("/get-all", isAuth("admin"), getAllOrders);
routes.post(
  "/create-order",
  isAuth("data entry"),
  validate(orderSchema),
  createOrder
);
routes.get("/getorder/:id", getOrder);
routes.put("/return-order/:id", returnOrder);

routes.get("/get-user-orders", isAuth("data entry"), getUserOrders);
routes.get("/get-collector-orders", isAuth("collector"), getCollectorOrders);
routes.get("/get-receiver-orders", isAuth("receiver"), getReceiverOrders);
routes.get(
  "/get-storekeeper-orders",
  isAuth("storekeeper"),
  getStorekeeperOrders
);

//#region change order status
routes.put("/picked-by-collector", isAuth("collector"), pickedByCollector);
routes.put(
  "/delivered-by-collector",
  isAuth("collector"),
  deliveredByCollector
);
routes.put("/in-store-request", isAuth("collector"), orderInStoreRequest);

routes.put(
  "/in-store-request-status",
  isAuth("storekeeper"),
  validate(inStoreRequestStatusSchema),
  inStoreRequestStatus
);

routes.put("/picked-by-receiver", isAuth("receiver"), pickedByReceiver);
routes.put("/delivered-by-receiver", isAuth("receiver"), deliveredByReceiver);
routes.put("/order-received", isAuth("receiver"), orderReceived);
routes.put(
  "/cancel-order-by-receiver",
  isAuth("receiver"),
  cancelOrderByReceiver
);
//#endregion change order status

routes.get("/track-order/:ordernumber", trackOrder);

routes.get(
  "/orders-without-carriers",
  isAuth("admin"),
  getOrdersWithoutCarriers
);
routes.put("/add-order-to-collector", isAuth("admin"), addOrderToCollector);
routes.put(
  "/add-order-to-receiver",
  isAuth(["admin", "storekeeper"]),
  addOrderToReceiver
);

module.exports = routes;
