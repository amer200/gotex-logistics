const express = require("express");
const routes = express.Router();
// const { isValid, isAuth } = require('../middlewares/carrier');
const { registerCarrier, getAllCarriers, setPasswordFirstTime, login, activateCarrier } = require("../controllers/carrier");
const { isAdminAuth } = require("../middlewares/admin");
const validate = require("../middlewares/validate");
const carrierSchema = require("../utils/validators/carrierSchema");

routes.post('/register', validate(carrierSchema), registerCarrier);
routes.post('/set-password/:carrierId', setPasswordFirstTime);
routes.post('/login', login);

// with Admin Auth
routes.get('/', isAdminAuth, getAllCarriers);

module.exports = routes