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
  editOrder,
  takeOrderCashFromReceiver,
  orderPaidWithVisa,
  takeOrderCashFromStorekeeper,
  orderPaidWithVisaFromStorekeeper,
  getOrdersToBeStored,
} = require("../controllers/order/main");
const orderSchema = require("../utils/validators/order/orderSchema");
const inStoreRequestStatusSchema = require("../utils/validators/order/inStoreRequestStatusSchema");
const {
  changeStatusToPending,
  pickedToStore,
  orderInStoreRequest,
  inStoreRequestStatus,
  getInStoreRequests,
  pickedToClient,
  orderReceived,
  cancelOrder,
  cancelOrderByCollector,
  getLateToStoreOrders,
  lateToStoreOrdersRoute,
} = require("../controllers/order/changeOrderStatus");
const {
  problemRequest,
  getOrdersWithProblemRequest,
  closeProblem,
} = require("../controllers/order/problem");

routes.get("/get-all", isAuth("admin"), getAllOrders);
routes.post(
  "/create-order",
  isAuth("data entry"),
  validate(orderSchema),
  createOrder
);
routes.get(
  "/getorder/:id",
  isAuth([
    "data entry",
    "admin",
    "collector",
    "receiver",
    "storekeeper",
    "tracker",
  ]),
  getOrder
);
routes.put("/return-order/:id", isAuth("receiver"), returnOrder);

routes.get("/get-user-orders", isAuth("data entry"), getUserOrders);
routes.get("/get-collector-orders", isAuth("collector"), getCollectorOrders);
routes.get("/get-receiver-orders", isAuth("receiver"), getReceiverOrders);
routes.get(
  "/get-storekeeper-orders",
  isAuth("storekeeper"),
  getStorekeeperOrders
);
routes.get("/orders-to-be-stored", isAuth("storekeeper"), getOrdersToBeStored);

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

routes.get("/late", isAuth(["admin", "storekeeper"]), getLateToStoreOrders);

// for testing
routes.put("/late/:orderId", isAuth("admin"), lateToStoreOrdersRoute);

//#endregion change order status

//#region order problem
routes.put("/problem-request", isAuth("storekeeper"), problemRequest);
routes.get(
  "/get-problem-requests",
  isAuth(["admin", "tracker"]),
  getOrdersWithProblemRequest
);
routes.put("/close-problem", isAuth(["admin", "tracker"]), closeProblem);
//#endregion order problem

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

// Storekeeper
routes.put(
  "/take-order-money/:orderId",
  isAuth(["storekeeper"]),
  takeOrderCashFromReceiver
);
routes.put(
  "/order-paid-with-visa/:orderId",
  isAuth(["storekeeper"]),
  orderPaidWithVisa
);

// Admin
routes.put(
  "/take-order-money-from-storekeeper/:orderId",
  isAuth(["admin"]),
  takeOrderCashFromStorekeeper
);
routes.put(
  "/order-paid-visa-from-storekeeper/:orderId",
  isAuth(["admin"]),
  orderPaidWithVisaFromStorekeeper
);
module.exports = routes;
