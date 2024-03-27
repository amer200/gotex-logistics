const express = require("express");
const routes = express.Router();
const isAuth = require("../middlewares/isAuth");
const { registerStoreKeeper, getAllStoreKeepers, setPasswordFirstTime, resendVerifyEmail, login, addOrderToStore } = require("../controllers/storekeeper");

routes.post('/register', registerStoreKeeper);
routes.post('/resend-verify-email/:id', resendVerifyEmail);
routes.get('/', getAllStoreKeepers);

routes.post('/set-password/:id', setPasswordFirstTime);
routes.post('/login', login);
routes.patch('/add-order-store/:billcode', isAuth('storekeeper'), addOrderToStore);




module.exports = routes