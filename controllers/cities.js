const asyncHandler = require("express-async-handler");
const data = require("../models/cities.json");

exports.getCities = asyncHandler(async (req, res) => {
  res.status(200).json({ ...data });
});
