const asyncHandler = require("express-async-handler");
const User = require("../models/user");

exports.isValid = asyncHandler(async (req, res, next) => {
  const { userId, apiKey } = req.body;

  const user = await User.findById(userId);

  if (!user) {
    return res.status(400).json({
      err: "userId is not valid",
    });
  }
  if (user.apiKey.production != apiKey) {
    return res.status(400).json({
      err: "apiKey is not valid",
    });
  }

  next();
});
