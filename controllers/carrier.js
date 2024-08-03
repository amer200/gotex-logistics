const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Carrier = require("../models/carrier");
const District = require("../models/district");
const sendEmail = require("../utils/sendEmail");
const genRandomNumber = require("./../utils/genRandomNumber");
const {
  isDistrictsUsedInRegister,
  isDistrictsUsedInEdit,
} = require("../utils/isDistrictsUsed");
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

  await isDistrictsUsedInRegister(District, deliveryDistricts, role);

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

  // set usedBy with carrier id
  if (role == "collector") {
    await District.updateMany(
      { district_id: { $in: deliveryDistricts } },
      { $set: { "usedBy.collector": carrier._id } }
    );
  } else if (role == "receiver") {
    await District.updateMany(
      { district_id: { $in: deliveryDistricts } },
      { $set: { "usedBy.receiver": carrier._id } }
    );
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

  let matchStage = { $match: {} };
  if (role) {
    matchStage = { $match: { role } };
  }

  const lookupStage = {
    $lookup: {
      from: "districts",
      localField: "deliveryDistricts",
      foreignField: "district_id",
      as: "deliveryDistricts",
    },
  };

  const projectStage = {
    $project: {
      orders: 0,

      "deliveryDistricts._id": 0,
      "deliveryDistricts.city_id": 0,
      "deliveryDistricts.region_id": 0,
      "deliveryDistricts.updatedAt": 0,
      "deliveryDistricts.usedBy": 0,
    },
  };

  carriers = await Carrier.aggregate([
    matchStage,
    lookupStage,
    {
      $sort: { createdAt: -1 },
    },
    projectStage,
  ]);

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

  const carrier = await Carrier.findOne({ _id: id, role });
  if (!carrier) {
    return res.status(404).json({ msg: `carrier is not found` });
  }

  await isDistrictsUsedInEdit(District, deliveryDistricts, role, carrier);

  carrier.mobile = mobile;
  carrier.nid = nid;
  carrier.address = address;
  carrier.city = city;
  carrier.firstName = firstName;
  carrier.lastName = lastName;
  carrier.photo = photo;
  carrier.papers = papers;
  carrier.deliveryCity = deliveryCity;
  carrier.deliveryDistricts = deliveryDistricts;
  await carrier.save();

  res.status(200).json({ data: carrier });
});
