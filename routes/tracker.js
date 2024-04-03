const express = require("express");
const routes = express.Router();
const validate = require("../middlewares/validate");
const isVerifiedCodeToken = require("../middlewares/verifyCodeToken");
const Tracker = require("../models/tracker");
const trackerSchema = require("../utils/validators/trackerSchema");
const isAuth = require("../middlewares/isAuth");
const { registerTracker, getAllTrackers, getAllOrders, setPasswordFirstTime, login, forgetPasswordEmail, verifyForgetPasswordCode, setNewPassword, resendVerifyEmail } = require("../controllers/tracker");

// with Admin Auth
routes.post('/register', isAuth('admin'), validate(trackerSchema), registerTracker);
routes.post('/resend-verify-email/:id', isAuth('admin'), resendVerifyEmail);
routes.get('/', isAuth('admin'), getAllTrackers);
routes.get('/all-orders', isAuth('tracker'), getAllOrders);

routes.post('/set-password/:userId', setPasswordFirstTime);
routes.post('/login', login);

routes.post("/send-forget-password-email", forgetPasswordEmail);
routes.post("/verify-forget-password-code", isVerifiedCodeToken(User), verifyForgetPasswordCode);
routes.post("/set-new-password", isVerifiedCodeToken(Tracker), setNewPassword);


module.exports = routes