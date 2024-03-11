const express = require("express");
const routes = express.Router();
const { logIn } = require("../controllers/admin");

routes.post('/login', logIn);

module.exports = routes;