const ApiError = require("./ApiError");

/** to check that districts are not used (each district can be used only once by
 *  one collector and one receiver)*/
exports.isDistrictsUsedInRegister = async (
  districtsModel,
  deliveryDistricts,
  role
) => {
  let districts = [];
  if (role == "collector") {
    districts = await districtsModel.find({
      district_id: { $in: deliveryDistricts },
      "usedBy.collector": { $exists: true },
    });
  } else if (role == "receiver") {
    districts = await districtsModel.find({
      district_id: { $in: deliveryDistricts },
      "usedBy.receiver": { $exists: true },
    });
  }

  if (districts.length) {
    throw new ApiError(400, "District is already used");
  }
};

/** to check that districts are not used by other carriers */
exports.isDistrictsUsedInEdit = async (
  districtsModel,
  deliveryDistricts,
  role,
  carrier
) => {
  let districts = [];
  if (role == "collector") {
    districts = await districtsModel.find({
      district_id: { $in: deliveryDistricts },
      $and: [
        { "usedBy.collector": { $exists: true } },
        { "usedBy.collector": { $ne: carrier._id } },
      ],
    });
  } else if (role == "receiver") {
    districts = await districtsModel.find({
      district_id: { $in: deliveryDistricts },
      $and: [
        { "usedBy.receiver": { $exists: true } },
        { "usedBy.receiver": { $ne: carrier._id } },
      ],
    });
  }

  if (districts.length) {
    throw new ApiError(400, "District is already used");
  }
};
