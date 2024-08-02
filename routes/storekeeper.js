const express = require("express");
const routes = express.Router();
const isAuth = require("../middlewares/isAuth");
const {
  registerStoreKeeper,
  getAllStoreKeepers,
  setPasswordFirstTime,
  resendVerifyEmail,
  login,
  addOrderToStore,
  edit,
} = require("../controllers/storekeeper");
const validate = require("../middlewares/validate");
const storekeeperRegister = require("../utils/validators/storekeeper/storekeeperRegister");
const storekeeperEdit = require("../utils/validators/storekeeper/storekeeperEdit");

routes.post("/register", validate(storekeeperRegister), registerStoreKeeper);
routes.post("/resend-verify-email/:id", resendVerifyEmail);
routes.get("/", getAllStoreKeepers);

routes.post("/set-password/:id", setPasswordFirstTime);
routes.post("/login", login);
routes.patch(
  "/add-order-store/:ordernumber",
  isAuth("storekeeper"),
  addOrderToStore
);

routes.post("/:id", isAuth("admin"), validate(storekeeperEdit), edit);

module.exports = routes;
