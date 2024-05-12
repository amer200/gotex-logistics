const express = require("express");
const routes = express.Router();
const { getCities, getDistricts } = require("../controllers/cities");

routes.get("/", getCities);
routes.get("/districts", getDistricts);

module.exports = routes;
