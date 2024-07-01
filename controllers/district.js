const asyncHandler = require("express-async-handler");
const District = require("../models/district");

exports.getDistrictsByCity = asyncHandler(async (req, res) => {
  const { cityId } = req.params;
  const districts = await District.find({ city_id: cityId }).sort({
    name_ar: 1,
  });

  res.status(200).json({ districts });
});
