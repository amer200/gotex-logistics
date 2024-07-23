const asyncHandler = require("express-async-handler");
const User = require("../models/user");
const userServices = require("../../services/user");

exports.registerUser = asyncHandler(async (req, res) => {
  const integrate = true;
  await userServices.register(User, req.body, integrate);

  return res.status(200).json({ msg: "Email sent successfully" });
});

exports.resendVerifyEmail = asyncHandler(async (req, res) => {
  const integrate = true;
  const userId = req.params.id;
  await userServices.resendVerifyEmail(User, userId, integrate);

  return res.status(200).json({ msg: "Email sent successfully" });
});

exports.verifyEmail = asyncHandler(async (req, res) => {
  const userId = req.params.id;
  await userServices.verifyEmail(User, userId);

  return res.status(200).json({ msg: "User verified successfully" });
});

exports.getAllUsers = asyncHandler(async (req, res) => {
  const users = await userServices.getAllUsers(User);

  res.status(200).json({
    result: users.length,
    data: users,
  });
});

// by admin
exports.edit = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await userServices.edit(User, id, req.body);

  res.status(200).json({ data: user });
});

exports.changeTestApiKey = asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  const apiKey = await userServices.changeTestApiKey(User, userId);

  res.status(200).json({
    data: apiKey,
  });
});
exports.changeProductionApiKey = asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  const apiKey = await userServices.changeProductionApiKey(User, userId);

  res.status(200).json({
    data: apiKey,
  });
});
