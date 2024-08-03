const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");
const genRandomNumber = require("./../utils/genRandomNumber");
const ApiError = require("../utils/ApiError");
const {
  generateProductionApiKey,
  generateTestApiKey,
} = require("../utils/generateApiKey");
const salt = 10;
const mailSubject = "Verify your gotex account";

exports.registerUser = async (UserModel, body, integrate = false) => {
  const { firstName, lastName, email, mobile, nid, city, address } = body;

  const isEmailUsed = await UserModel.findOne({ email });
  if (isEmailUsed) {
    throw new ApiError(409, "Email is already used");
  }

  const user = await UserModel.create({
    firstName,
    lastName,
    email,
    mobile,
    nid,
    city,
    address,
  });

  let ejsFile = "";
  if (integrate) {
    ejsFile = "/../views/userIntegrateVerifyEmail.ejs";
  } else {
    ejsFile = "/../views/userVerifyEmail.ejs";
  }

  response = await sendEmail(user.email, user._id, "", ejsFile, mailSubject);
  if (response && response.error) {
    console.error(response.error);
    throw new ApiError(500, "Failed to send email");
  }
};

exports.resendVerifyEmail = async (UserModel, userId, integrate = false) => {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new ApiError(400, "User is not found");
  }
  if (user.verified) {
    throw new ApiError(400, "User is already verified");
  }

  let ejsFile = "";
  if (integrate) {
    ejsFile = "/../views/userIntegrateVerifyEmail.ejs";
  } else {
    ejsFile = "/../views/userVerifyEmail.ejs";
  }

  const response = await sendEmail(
    user.email,
    user._id,
    "",
    ejsFile,
    mailSubject
  );
  if (response && response.error) {
    console.error(response.error);
    throw new ApiError(500, "Failed to send email");
  }
};

// Only for integrate
exports.verifyEmail = async (UserModel, userId) => {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new ApiError(404, "User is not found");
  }
  if (user.verified) {
    throw new ApiError(400, "User is already verified");
  }

  user.verified = true;
  await generateTestApiKey(user);
  await generateProductionApiKey(user);
};

exports.setPasswordFirstTime = async (UserModel, userId, body) => {
  const { email, password, confirmPassword } = body;
  console.log(email, userId);
  const user = await UserModel.findById(userId);

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
exports.login = async (UserModel, body) => {
  const { email, password } = body;
  const user = await UserModel.findOne({ email });

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

exports.getAllUsers = async (UserModel) => {
  const users = await UserModel.find();

  return users;
};

exports.forgetPasswordEmail = async (UserModel, email) => {
  const user = await UserModel.findOne({ email });

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

  user.verifyCode = null;
  await user.save();
};
exports.setNewPassword = async (user, password) => {
  if (user.verifyCode == null) {
    const hash = bcrypt.hashSync(password, salt);
    user.password = hash;

    await user.save();
  } else {
    throw new ApiError(400, "Something went wrong");
  }
};

// by admin
exports.edit = async (UserModel, userId, body) => {
  const { mobile, nid, address, city, firstName, lastName } = body;

  const user = await UserModel.findOneAndUpdate(
    { _id: userId },
    { mobile, nid, address, city, firstName, lastName },
    { new: true }
  );
  if (!user) {
    throw new ApiError(404, `user is not found`);
  }

  return user;
};

// Only for integrate
exports.changeTestApiKey = async (UserModel, userId) => {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new ApiError(400, "User is not found");
  }

  const apiKey = await generateTestApiKey(user);

  return apiKey;
};
exports.changeProductionApiKey = async (UserModel, userId) => {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new ApiError(400, "User is not found");
  }

  const apiKey = await generateProductionApiKey(user);

  return apiKey;
};
