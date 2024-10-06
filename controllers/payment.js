const asyncHandler = require("express-async-handler");
const Order = require("../models/order");
const Carrier = require("../models/carrier");
const Payment = require("../models/payment");
const axios = require("axios");
const genRandomNumber = require("../utils/genRandomNumber");
const carrier = require("../models/carrier");

/** payment for order with paytype = cod (visa) */
exports.chargeForOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const carrierId = req.user.id;

  const carrier = await Carrier.findById(carrierId);

  const order = await Order.findOne({ _id: orderId, paytype: "cod" }).populate({
    path: "payment.cod",
    select: "status",
  });
  if (!order) {
    return res
      .status(404)
      .json({ msg: "Order is not found or order paytype is not cod" });
  }
  if (["received", "canceled"].includes(order.status)) {
    return res
      .status(400)
      .json({ msg: `Order is ${order.status}. Can't pay for it.` });
  }
  if (order.payment.cod?.status === "CAPTURED") {
    return res
      .status(400)
      .json({ msg: "Payment is already done for this order" });
  }

  const amount = order.price;
  const code = genRandomNumber(10);

  const data = JSON.stringify({
    amount: amount,
    currency: "SAR",
    threeDSecure: true,
    save_card: false,
    customer_initiated: true,
    description: "Test Description",
    statement_descriptor: "Sample",
    metadata: {
      udf1: "test 1",
      udf2: "test 2",
    },
    reference: {
      transaction: "txn_0001",
      order: "ord_0001",
    },
    receipt: {
      email: true,
      sms: true,
    },
    customer: {
      first_name: order.recivername,
      last_name: "",
      email: "",
      phone: {
        country_code: "966",
        number: order.reciverphone,
      },
    },
    merchant: {
      id: "",
    },
    source: {
      id: "src_all",
    },
    post: {
      url: "",
    },
    redirect: {
      url: `https://dashboard.go-tex.net/logistics-test/payment/check-tap-payment/${orderId}/${carrierId}/${code}`,
    },
  });
  const config = {
    method: "POST",
    url: "https://api.tap.company/v2/charges/",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      Authorization: process.env.TAP_TOKEN,
    },
    data: data,
  };
  const response = await axios(config);

  const payment = await Payment.create({
    data: response.data,
    amount: amount,
    code: code,
    status: "pending",
    carrier: carrierId,
    order: orderId,
  });

  res.status(200).json({ data: response.data });
});

const getCharge = asyncHandler((chargeId) => {
  const config = {
    method: "GET",
    url: `https://api.tap.company/v2/charges/${chargeId}`,
    headers: {
      accept: "application/json",
      Authorization: process.env.TAP_TOKEN,
    },
  };

  const response = axios(config);
  return response;
});

exports.checkPayment = asyncHandler(async (req, res) => {
  const { orderId, carrierId, code } = req.params;

  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({ msg: "Order is not found" });
  }

  const payment = await Payment.findOne({ code });
  if (!payment) {
    return res.render("paymentStatus", {
      text1: `Failed, this payment is not found`,
      text2: "Something went wrong. Please try again",
    });

    return res.status(400).json({
      data: "failed",
    });
  }

  const charge = await getCharge(payment.data.id);
  const currentStatus = charge.data.status;

  order.payment.cod = payment._id;
  await order.save();

  if (currentStatus != "CAPTURED") {
    payment.status = currentStatus;
    await payment.save();

    return res.render("paymentStatus", {
      text1: `Charge status is ${currentStatus}`,
      text2: "Something went wrong. Please try again",
    });

    return res.status(400).json({
      data: status,
    });
  }

  payment.status = currentStatus;
  payment.code = genRandomNumber(10);

  const carrier = await Carrier.findById(carrierId);
  carrier.collectedVisaAmount += order.price;
  await Promise.all([payment.save(), carrier.save()]);

  return res.render("paymentStatus", {
    text1: `Charge status is CAPTURED.`,
    text2: `You have successfully paid the order price (${order.price} SAR)`,
  });

  res.status(200).json({
    data: payment,
  });
});

exports.getPaymentsByOrderId = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const payments = await Payment.find({ order: orderId }).sort({
    createdAt: -1,
  });

  res.status(200).json({
    data: payments,
  });
});
