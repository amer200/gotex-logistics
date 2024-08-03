const express = require("express");
const routes = express.Router();
const validate = require("../middlewares/validate");
const isVerifiedCodeToken = require("../middlewares/verifyCodeToken");
const User = require("../models/user");
const userRegister = require("../utils/validators/user/userRegister");
const userEdit = require("../utils/validators/user/userEdit");
const isAuth = require("../middlewares/isAuth");
const {
  registerUser,
  getAllUsers,
  setPasswordFirstTime,
  login,
  forgetPasswordEmail,
  verifyForgetPasswordCode,
  setNewPassword,
  resendVerifyEmail,
  edit,
} = require("../controllers/user");

// with Admin Auth
routes.post("/register", isAuth("admin"), validate(userRegister), registerUser);
routes.post("/register", isAuth("admin"), validate(userRegister), registerUser);
routes.post("/resend-verify-email/:id", isAuth("admin"), resendVerifyEmail);
routes.get("/", isAuth("admin"), getAllUsers);

routes.post("/set-password/:userId", setPasswordFirstTime);
routes.post("/login", login);

routes.post("/send-forget-password-email", forgetPasswordEmail);
routes.post(
  "/verify-forget-password-code",
  isVerifiedCodeToken(User),
  verifyForgetPasswordCode
);
routes.post("/set-new-password", isVerifiedCodeToken(User), setNewPassword);

routes.post("/:id", isAuth("admin"), validate(userEdit), edit);

module.exports = routes;
