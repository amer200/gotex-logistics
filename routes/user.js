const express = require("express");
const routes = express.Router();
// const { isValid, isAuth } = require('../middlewares/user');
const { registerUser, getAllUsers, setPasswordFirstTime, login, activateUser, logIn, reSendActivateCode, createNewPassword, updatePassword } = require("../controllers/user");
const { isAdminAuth } = require("../middlewares/admin");
const validate = require("../middlewares/validate");
const userSchema = require("../utils/validators/userSchema");

routes.get('/', isAdminAuth, getAllUsers);
routes.post('/register', validate(userSchema), registerUser);
routes.post('/set-password/:userId', setPasswordFirstTime);
routes.post('/login', login);

// routes.get("/resend-activate-code", isAuth, reSendActivateCode);
// routes.post("/send-email-update-password", createNewPassword);
// routes.post("/update-password", updatePassword);

module.exports = routes