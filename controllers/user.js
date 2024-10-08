const asyncHandler = require("express-async-handler");
const User = require("../models/user");
const userServices = require("../services/user");

exports.registerUser = asyncHandler(async (req, res) => {
  await userServices.registerUser(User, req.body);

  return res.status(200).json({ msg: "Email sent successfully" });
});

exports.resendVerifyEmail = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  await userServices.resendVerifyEmail(User, userId);

  return res.status(200).json({ msg: "Email sent successfully" });
});

exports.setPasswordFirstTime = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  console.log(userId);
  await userServices.setPasswordFirstTime(User, userId, req.body);

  return res.status(200).json({ msg: "Password set successfully" });
});
exports.login = asyncHandler(async (req, res, next) => {
  const token = await userServices.login(User, req.body);

  res.status(201).json({ msg: "ok", token });
});

exports.getAllUsers = asyncHandler(async (req, res) => {
  const users = await userServices.getAllUsers(User);

  res.status(200).json({
    result: users.length,
    data: users,
  });
});

exports.forgetPasswordEmail = asyncHandler(async (req, res) => {
  const token = await userServices.forgetPasswordEmail(User, req.body.email);

  return res.status(200).json({
    msg: "Email sent successfully",
    token,
  });
});
exports.verifyForgetPasswordCode = asyncHandler(async (req, res) => {
  const user = req.user;
  const { code } = req.body;

  await userServices.verifyForgetPasswordCode(user, code);

  return res.status(200).json({ msg: "ok" });
});
exports.setNewPassword = asyncHandler(async (req, res) => {
  const user = req.user;
  const { password } = req.body;

  await userServices.setNewPassword(user, password);

  res.status(200).json({ msg: "Password changed successfully" });
});

// by admin
exports.edit = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await userServices.edit(User, id, req.body);

  res.status(200).json({ data: user });
});
