const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");

exports.logIn = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (
    email !== process.env.ADMIN_EMAIL ||
    process.env.ADMIN_PASS !== password
  ) {
    return res.status(400).json({
      msg: "wrong password or email",
    });
  }

  const user = {
    id: 1,
    role: "admin",
  };
  const token = jwt.sign(user, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE_TIME,
  });

  return res.status(200).json({
    msg: "ok",
    token: token,
  });
});
