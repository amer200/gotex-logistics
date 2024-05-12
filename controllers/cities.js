const asyncHandler = require("express-async-handler");
const citiesData = require("../models/cities.json");
const districtsData = require("../models/districts.json");

exports.getCities = asyncHandler(async (req, res) => {
  res.status(200).json({ ...citiesData });
});

exports.getDistricts = asyncHandler(async (req, res) => {
  res.status(200).json({ ...districtsData });
});
