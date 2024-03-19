const express = require("express");
const routes = express.Router();
const authStoreKeeper = require('../middlewares/Auth')
const { registerStoreKeeper, getAllStoreKeepers, setPasswordFirstTime, resendVerifyEmail, login, addOrderToStore } = require("../controllers/storekeeper");

routes.post('/register', registerStoreKeeper);
routes.post('/resend-verify-email/:id', resendVerifyEmail);
routes.get('/', getAllStoreKeepers);

routes.post('/set-password/:id', setPasswordFirstTime);
routes.post('/login', login);
routes.patch('/add-order-store/:billcode', authStoreKeeper(), addOrderToStore);




module.exports = routes