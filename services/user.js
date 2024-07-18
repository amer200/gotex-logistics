const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const sendEmail = require("../utils/sendEmail");
const genRandomNumber = require("./../utils/genRandomNumber");
const ApiError = require("../utils/ApiError");
const salt = 10;
const mailSubject = "Verify your gotex account";

exports.registerUser = async (body) => {
  const { firstName, lastName, email, mobile, nid, city, address } = body;

  const isEmailUsed = await User.findOne({ email });
  if (isEmailUsed) {
    throw new ApiError(409, "Email is already used");
  }

  const user = await User.create({
    firstName,
    lastName,
    email,
    mobile,
    nid,
    city,
    address,
  });

  const response = await sendEmail(
    user.email,
    user._id,
    "",
    "/../views/userVerifyEmail.ejs",
    mailSubject
  );
  if (response && response.error) {
    console.error(response.error);
    throw new ApiError(500, "Failed to send email");
  }
};

exports.resendVerifyEmail = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(400, "User is not found");
  }

  const response = await sendEmail(
    user.email,
    user._id,
    "",
    "/../views/userVerifyEmail.ejs",
    mailSubject
  );
  if (response && response.error) {
    console.error(response.error);
    throw new ApiError(500, "Failed to send email");
  }
};

exports.setPasswordFirstTime = async (userId, body) => {
  const { email, password, confirmPassword } = body;
  console.log(email, userId);
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "Email is not found");
  }
  if (user.verified) {
    throw new ApiError(400, "This email is already verified");
  }
  if (user.email !== email) {
    throw new ApiError(400, "Wrong email");
  }

  if (password !== confirmPassword) {
    throw new ApiError(400, "Password doesn't match the confirmPassword");
  }

  const hashedPassword = bcrypt.hashSync(password, salt);
  user.password = hashedPassword;
  user.verified = true;
  await user.save();
};
exports.login = async (body) => {
  const { email, password } = body;
  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(400, "Wrong email or password");
  }
  if (!user.verified) {
    throw new ApiError(400, "Please verify your email first");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(400, "Wrong email or password");
  }

  const token = await user.generateAuthToken();

  return token;
};

exports.getAllUsers = async () => {
  const users = await User.find();

  return users;
};

exports.forgetPasswordEmail = async (email) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new ApiError(404, "Email is not found");
  }
  if (!user.verified) {
    throw new ApiError(400, "Please verify your email first");
  }

  const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, {
    expiresIn: "10m",
  });

  user.verifyCode = genRandomNumber(6);
  await user.save();

  const response = await sendEmail(
    user.email,
    user._id,
    user.verifyCode,
    "/../views/forgetPasswordEmail.ejs",
    mailSubject
  );
  if (response && response.error) {
    console.error(response.error);
    throw new ApiError(500, "Failed to send email");
  }

  return token;
};
exports.verifyForgetPasswordCode = async (user, code) => {
  if (user.verifyCode != code) {
    throw new ApiError(400, "Wrong code");
  }
  user.verifyCode = genRandomNumber(6);
  await user.save();
};
exports.setNewPassword = async (user, password) => {
  const hash = bcrypt.hashSync(password, salt);
  user.password = hash;
  await user.save();
};

// by admin
exports.edit = async (userId, body) => {
  const { mobile, nid, address, city, firstName, lastName } = body;

  const user = await User.findOneAndUpdate(
    { _id: userId },
    { mobile, nid, address, city, firstName, lastName },
    { new: true }
  );
  if (!user) {
    throw new ApiError(404, `user is not found`);
  }

  return user;
};
