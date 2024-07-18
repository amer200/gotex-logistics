const asyncHandler = require("express-async-handler");
const citiesData = require("../models/cities.json");

exports.getCities = asyncHandler(async (req, res) => {
  res.status(200).json({ ...citiesData });
});
