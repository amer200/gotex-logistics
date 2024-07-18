const express = require("express");
const routes = express.Router();
const { getCities } = require("../controllers/cities");

routes.get("/", getCities);

module.exports = routes;
