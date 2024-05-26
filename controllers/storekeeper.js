const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const StoreKeeper = require("../models/storekeeper");
const sendEmail = require("../utils/sendEmail");
const Order = require("../models/order");
const addOrderToCarrier = require("../utils/addOrderToCarrier");
const changeOrderStatus = require("../utils/changeOrderStatus");
const salt = 10;
const mailSubject = "Verify your gotex account";
exports.registerStoreKeeper = asyncHandler(async (req, res) => {
  let { firstName, lastName, email, mobile, city, address } = req.body;

  const isEmailUsed = await StoreKeeper.findOne({ email });
  if (isEmailUsed) {
    return res.status(409).json({
      msg: "Email is already used",
    });
  }

  const storekeeper = await StoreKeeper.create({
    firstName,
    lastName,
    email,
    mobile,
    city,
    address,
  });

  const response = await sendEmail(
    storekeeper.email,
    storekeeper._id,
    "",
    "/../views/storeKeeperVerifyEmail.ejs",
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

  const storekeeper = await StoreKeeper.findById(id);
  if (!storekeeper) {
    return res.status(409).json({ msg: "User is not found" });
  }

  const response = await sendEmail(
    storekeeper.email,
    storekeeper._id,
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
  const { id } = req.params;
  const { email, password, confirmPassword } = req.body;

  const storekeeper = await StoreKeeper.findById(id);

  if (!storekeeper) {
    return res.status(404).json({ msg: "Email is not found" });
  }
  if (storekeeper.verified) {
    return res.status(400).json({ msg: "This email is already verified" });
  }
  if (storekeeper.email !== email) {
    return res.status(400).json({ msg: "Wrong email" });
  }

  if (password !== confirmPassword) {
    return res
      .status(400)
      .json({ msg: "Password doesn't match the confirmPassword" });
  }

  const hashedPassword = bcrypt.hashSync(password, salt);
  storekeeper.password = hashedPassword;
  storekeeper.verified = true;
  await storekeeper.save();

  return res.status(200).json({ msg: "Password set successfully" });
});

exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const storekeeper = await StoreKeeper.findOne({ email });

  if (!storekeeper) {
    return res.status(400).json({ msg: "Wrong email or password" });
  }
  if (!storekeeper.verified) {
    return res.status(400).json({ msg: "Please verify your email first" });
  }

  const isMatch = await bcrypt.compare(password, storekeeper.password);
  if (!isMatch) {
    return res.status(400).json({ msg: "Wrong email or password" });
  }

  const token = await storekeeper.generateAuthToken();

  res.status(201).json({ msg: "ok", token });
});

exports.getAllStoreKeepers = asyncHandler(async (req, res) => {
  const storekeeper = await StoreKeeper.find();

  res.status(200).json({
    result: storekeeper.length,
    data: storekeeper,
  });
});
exports.addOrderToStore = asyncHandler(async (req, res) => {
  const { ordernumber } = req.params;
  const prevStatus = "pick to store";
  const changeStatusTo = "in store";

  const order = await Order.findOne({ ordernumber });

  await changeOrderStatus(order, prevStatus, changeStatusTo);

  await addOrderToCarrier(order, "receiver", req.io);

  let images = [];
  if (req.files) {
    req.files.forEach((f) => {
      images.push(f.path);
    });
  }

  order.storekeeper = req.user.id;
  order.images.inStore = images;
  await order.save();

  res.status(200).json({ msg: "ok", data: order });
});
