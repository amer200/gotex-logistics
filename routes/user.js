const express = require("express");
const routes = express.Router();
const validate = require("../middlewares/validate");
const isVerifiedCodeToken = require("../middlewares/verifyCodeToken");
const User = require("../models/user");
const userSchema = require("../utils/validators/userSchema");
const isAuth = require("../middlewares/isAuth");
const { registerUser, getAllUsers, setPasswordFirstTime, login, forgetPasswordEmail, verifyForgetPasswordCode, setNewPassword, resendVerifyEmail } = require("../controllers/user");

// with Admin Auth
routes.post('/register', isAuth('admin'), validate(userSchema), registerUser);
routes.post('/resend-verify-email/:id', isAuth('admin'), resendVerifyEmail);
routes.get('/', isAuth('admin'), getAllUsers);

routes.post('/set-password/:userId', setPasswordFirstTime);
routes.post('/login', login);

routes.post("/send-forget-password-email", forgetPasswordEmail);
routes.post("/verify-forget-password-code", isVerifiedCodeToken(User), verifyForgetPasswordCode);
routes.post("/set-new-password", isVerifiedCodeToken(User), setNewPassword);


module.exports = routes