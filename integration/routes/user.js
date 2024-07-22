const express = require("express");
const routes = express.Router();
const validate = require("../../middlewares/validate");
const isVerifiedCodeToken = require("../../middlewares/verifyCodeToken");
const User = require("../models/user");
const userSchema = require("../../utils/validators/userSchema");
const isAuth = require("../../middlewares/isAuth");
const {
  registerUser,
  getAllUsers,
  resendVerifyEmail,
  edit,
  verifyEmail,
  changeTestApiKey,
  changeProductionApiKey,
} = require("../controllers/user");

// with Admin Auth
routes.post("/register", isAuth("admin"), validate(userSchema), registerUser);
routes.post("/resend-verify-email/:id", resendVerifyEmail);
routes.post("/verify-email/:id", verifyEmail);

routes.get("/", isAuth("admin"), getAllUsers);
routes.post("/:id", isAuth("admin"), edit);

routes.put("/change-test-apikey/:userId", isAuth("admin"), changeTestApiKey);
routes.put(
  "/change-production-apikey/:userId",
  isAuth("admin"),
  changeProductionApiKey
);

module.exports = routes;
