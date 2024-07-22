const User = require("../model/user");

exports.isValid = async (req, res, next) => {
  const uId = req.body.userId;
  const key = req.body.apiKey;
  const user = await User.findById(uId);
  try {
    if (!user) {
      return res.status(400).json({
        err: "userId is not valid",
      });
    }
    if (user.apikey.production != key) {
      return res.status(400).json({
        err: "apiKey is not valid",
      });
    }
    next();
  } catch (err) {
    console.log(err);
    res.status(500).json({
      err: err.message,
    });
  }
};
