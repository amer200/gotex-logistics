const express = require("express");
const routes = express.Router();
const validate = require("../middlewares/validate");
const carrierSchema = require("../utils/validators/carrierSchema");
const isVerifiedCodeToken = require("../middlewares/verifyCodeToken");
const Carrier = require("../models/carrier");
const isAuth = require("../middlewares/isAuth");
const {
  registerCarrier,
  getAllCarriers,
  setPasswordFirstTime,
  login,
  activateCarrier,
  forgetPasswordEmail,
  resendForgetPasswordCode,
  verifyForgetPasswordCode,
  setNewPassword,
  resendVerifyEmail,
  getReceivers,
  edit,
} = require("../controllers/carrier");

// with Admin Auth
routes.post(
  "/register",
  isAuth("admin"),
  validate(carrierSchema),
  registerCarrier
);
routes.post("/resend-verify-email/:id", isAuth("admin"), resendVerifyEmail);
routes.get("/", isAuth("admin"), getAllCarriers);
routes.get("/get-receivers", isAuth("storekeeper"), getReceivers);

routes.post("/set-password/:carrierId", setPasswordFirstTime);
routes.post("/login", login);

routes.post("/send-forget-password-email", forgetPasswordEmail);
routes.get("/resend-code", resendForgetPasswordCode);
routes.post(
  "/verify-forget-password-code",
  isVerifiedCodeToken(Carrier),
  verifyForgetPasswordCode
);
routes.post("/set-new-password", isVerifiedCodeToken(Carrier), setNewPassword);

routes.post("/:id", isAuth("admin"), edit);

module.exports = routes;
