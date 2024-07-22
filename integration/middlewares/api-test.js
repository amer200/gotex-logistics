// const User = require("../model/user");
const asyncHandler = require("express-async-handler");

exports.isValid = asyncHandler(async (req, res, next) => {
  const { userId, apiKey } = req.body.userId;

  const user = await User.findById(userId);

  if (!user) {
    return res.status(400).json({
      err: "userId is not valid",
    });
  }
  if (user.apiKey.test != apiKey) {
    return res.status(400).json({
      err: "apiKey is not valid",
    });
  }
  next();
});
