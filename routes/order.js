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
  pickedToStore,
  pickedToClient,
  cancelOrder,
  orderInStoreRequest,
  inStoreRequestStatus,
  orderReceived,
  getInStoreRequests,
  editOrder,
  changeStatusToPending,
  cancelOrderByCollector,
  problemRequest,
  getOrdersWithProblemRequests,
  closeProblem,
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
routes.put("/return-order/:id", isAuth("receiver"), returnOrder);

routes.get("/get-user-orders", isAuth("data entry"), getUserOrders);
routes.get("/get-collector-orders", isAuth("collector"), getCollectorOrders);
routes.get("/get-receiver-orders", isAuth("receiver"), getReceiverOrders);
routes.get(
  "/get-storekeeper-orders",
  isAuth("storekeeper"),
  getStorekeeperOrders
);

//#region change order status
routes.put(
  "/change-status-to-pending",
  isAuth(["data entry", "admin"]),
  changeStatusToPending
);
routes.put("/picked-to-store", isAuth("collector"), pickedToStore);
routes.put("/in-store-request", isAuth("collector"), orderInStoreRequest);

routes.get("/in-store-requests", isAuth("storekeeper"), getInStoreRequests);
routes.put(
  "/in-store-request-status",
  isAuth("storekeeper"),
  validate(inStoreRequestStatusSchema),
  inStoreRequestStatus
);

routes.put("/picked-to-client", isAuth("receiver"), pickedToClient);
routes.put("/order-received", isAuth("receiver"), orderReceived);
routes.put("/cancel-order", isAuth(["data entry", "admin"]), cancelOrder);
routes.put(
  "/cancel-order-by-collector",
  isAuth("collector"),
  cancelOrderByCollector
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

routes.put("/edit-order/:id", isAuth(["data entry", "admin"]), editOrder);

routes.put("/problem-request", isAuth("storekeeper"), problemRequest);
routes.get(
  "/get-problem-requests",
  isAuth(["admin", "tracker"]),
  getOrdersWithProblemRequests
);
routes.put("/close-problem", isAuth(["admin", "tracker"]), closeProblem);

module.exports = routes;
