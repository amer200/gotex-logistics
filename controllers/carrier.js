const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Carrier = require("../models/carrier");
const sendEmail = require("../utils/sendEmail");
const genRandomNumber = require("./../utils/genRandomNumber");
const salt = 10;
const mailSubject = "Verify your gotex account";

exports.registerCarrier = asyncHandler(async (req, res) => {
  const { role } = req.query;
  let {
    firstName,
    lastName,
    email,
    mobile,
    nid,
    city,
    address,
    deliveryCity,
    deliveryDistricts,
  } = req.body;

  let photo = "";
  let papers = [];
  if (req.files) {
    photo = req.files.photo && req.files.photo[0].path;

    if (req.files.papers && req.files.papers[0]) {
      req.files.papers.forEach((f) => {
        papers.push(f.path);
      });
    }
  }

  const isEmailUsed = await Carrier.findOne({ email });
  if (isEmailUsed) {
    return res.status(409).json({
      msg: "Email is already used",
    });
  }

  const carrier = await Carrier.create({
    firstName,
    lastName,
    email,
    mobile,
    nid,
    city,
    address,
    photo,
    papers,
    deliveryCity,
    deliveryDistricts,
    role,
  });

  const response = await sendEmail(
    carrier.email,
    carrier._id,
    "",
    "/../views/carrierVerifyEmail.ejs",
    mailSubject
  );
  if (response && response.error) {
    console.error(response.error);
    return res.status(500).json({ msg: "Failed to send email" });
  }

  return res.status(200).json({ msg: "Email sent successfully" });
});
exports.resendVerifyEmail = asyncHandler(async (req, res) => {
  const id = req.params.id;

  const carrier = await Carrier.findById(id);
  if (!carrier) {
    return res.status(409).json({ msg: "User is not found" });
  }

  const response = await sendEmail(
    carrier.email,
    carrier._id,
    "",
    "/../views/carrierVerifyEmail.ejs",
    mailSubject
  );
  if (response && response.error) {
    console.error(response.error);
    return res.status(500).json({ msg: "Failed to send email" });
  }

  return res.status(200).json({ msg: "Email sent successfully" });
});

exports.setPasswordFirstTime = asyncHandler(async (req, res) => {
  const { carrierId } = req.params;
  const { email, password, confirmPassword } = req.body;

  const carrier = await Carrier.findById(carrierId);

  if (!carrier) {
    return res.status(404).json({ msg: "Email is not found" });
  }
  if (carrier.email !== email) {
    return res.status(400).json({ msg: "Wrong email" });
  }
  if (carrier.verified) {
    return res.status(400).json({ msg: "This email is already verified" });
  }

  if (password !== confirmPassword) {
    return res
      .status(400)
      .json({ msg: "Password doesn't match the confirmPassword" });
  }

  const hashedPassword = bcrypt.hashSync(password, salt);
  carrier.password = hashedPassword;
  carrier.verified = true;
  await carrier.save();

  return res.status(200).json({ msg: "Password set successfully" });
});

exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const carrier = await Carrier.findOne({ email });

  if (!carrier) {
    return res.status(400).json({ msg: "Wrong email or password" });
  }
  if (!carrier.verified) {
    return res.status(400).json({ msg: "Please verify your email first" });
  }

  const isMatch = await bcrypt.compare(password, carrier.password);
  if (!isMatch) {
    return res.status(400).json({ msg: "Wrong email or password" });
  }

  const token = await carrier.generateAuthToken();

  res.status(201).json({ msg: "ok", token });
});

exports.getAllCarriers = asyncHandler(async (req, res) => {
  const { role = "" } = req.query;

  let carriers = {};
  if (!role) {
    carriers = await Carrier.find();
  } else {
    carriers = await Carrier.find({ role });
  }

  res.status(200).json({
    result: carriers.length,
    data: carriers,
  });
});
exports.getReceivers = asyncHandler(async (req, res) => {
  const receivers = await Carrier.find({ role: "receiver" });

  res.status(200).json({
    result: receivers.length,
    data: receivers,
  });
});

exports.forgetPasswordEmail = asyncHandler(async (req, res) => {
  const email = req.body.email;

  const carrier = await Carrier.findOne({ email });
  if (!carrier) {
    return res.status(404).json({ msg: "Email is not found" });
  }
  if (!carrier.verified) {
    return res.status(400).json({ msg: "Please verify your email first" });
  }

  const token = jwt.sign({ email: carrier.email }, process.env.JWT_SECRET, {
    expiresIn: "10m",
  });

  carrier.verifyCode = genRandomNumber(6);
  await carrier.save();

  const response = await sendEmail(
    carrier.email,
    carrier._id,
    carrier.verifyCode,
    "/../views/forgetPasswordEmail.ejs",
    mailSubject
  );
  if (response && response.error) {
    console.error(response.error);
    return res.status(500).json({ msg: "Failed to send email" });
  }

  return res.status(200).json({
    msg: "Email sent successfully",
    token,
  });
});
exports.resendForgetPasswordCode = asyncHandler(async (req, res) => {
  const email = req.body.email;

  const carrier = await Carrier.findOne({ email });
  if (!carrier) {
    return res.status(404).json({ msg: "Carrier is not found" });
  }

  carrier.verifyCode = genRandomNumber(6);
  return carrier.save();

  const response = await sendEmail(
    carrier.email,
    carrier._id,
    carrier.verifyCode,
    "/../views/forgetPasswordEmail.ejs",
    mailSubject
  );
  if (response && response.error) {
    console.error(response.error);
    return res.status(500).json({ msg: "Failed to send email" });
  }

  return res.status(200).json({ msg: "Email sent successfully" });
});
exports.verifyForgetPasswordCode = asyncHandler(async (req, res) => {
  const carrier = req.user;
  const { code } = req.body;

  if (carrier.verifyCode != code) {
    return res.status(400).json({ msg: "Wrong code" });
  }
  carrier.verifyCode = genRandomNumber(6);
  await carrier.save();

  return res.status(200).json({ msg: "ok" });
});
exports.setNewPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const carrier = req.user;

  const hash = bcrypt.hashSync(password, salt);
  carrier.password = hash;
  await carrier.save();

  res.status(200).json({ msg: "Password changed successfully" });
});

// by admin
exports.edit = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.query;

  const {
    mobile,
    nid,
    address,
    city,
    firstName,
    lastName,
    deliveryCity,
    deliveryDistricts,
  } = req.body;

  let photo = "";
  let papers = [];
  if (req.files) {
    photo = req.files.photo && req.files.photo[0].path;

    if (req.files.papers && req.files.papers[0]) {
      req.files.papers.forEach((f) => {
        papers.push(f.path);
      });
    }
  }

  const carrier = await Carrier.findOneAndUpdate(
    { _id: id, role },
    {
      mobile,
      nid,
      address,
      city,
      firstName,
      lastName,
      photo,
      papers,
      deliveryCity,
      deliveryDistricts,
    },
    { new: true }
  );
  if (!carrier) {
    return res.status(404).json({ msg: `carrier is not found` });
  }

  res.status(200).json({ data: carrier });
});
