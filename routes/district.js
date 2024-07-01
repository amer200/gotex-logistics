const express = require("express");
const routes = express.Router();
const { getDistrictsByCity } = require("../controllers/district");

routes.get("/:cityId", getDistrictsByCity);

module.exports = routes;
