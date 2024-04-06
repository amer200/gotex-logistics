const asyncHandler = require('express-async-handler')
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const Tracker = require("../models/tracker");
const Order = require("../models/order");

const sendEmail = require("../utils/sendEmail");
const genRandomNumber = require('../utils/genRandomNumber')
const salt = 10;
const mailSubject = "Verify your gotex account"


exports.registerTracker = asyncHandler(async (req, res) => {
    const { firstName, lastName, email, mobile, nid, city, address } = req.body;

    const isEmailUsed = await Tracker.findOne({ email })
    if (isEmailUsed) {
        return res.status(409).json({ msg: "Email is already used" })
    }

    const tracker = await Tracker.create({
        firstName,
        lastName,
        email,
        mobile,
        nid,
        city,
        address
    })

    const response = await sendEmail(tracker.email, tracker._id, '', "/../views/userVerifyEmail.ejs", mailSubject)
    if (response && response.error) {
        console.error(response.error);
        res.status(500).json({ msg: 'Failed to send email' });
    }

    res.status(200).json({ msg: 'Email sent successfully' });
})

exports.resendVerifyEmail = asyncHandler(async (req, res) => {
    const id = req.params.id;

    const tracker = await Tracker.findById(id)
    if (!tracker) {
        return res.status(409).json({ msg: "User is not found" })
    }

    const response = await sendEmail(tracker.email, tracker._id, '', "/../views/userVerifyEmail.ejs", mailSubject)
    if (response && response.error) {
        console.error(response.error);
        return res.status(500).json({ msg: 'Failed to send email' });
    }

    return res.status(200).json({ msg: 'Email sent successfully' });
})

exports.setPasswordFirstTime = asyncHandler(async (req, res) => {
    const { trackerId } = req.params;
    const { email, password, confirmPassword } = req.body;

    const tracker = await Tracker.findById(trackerId)

    if (!tracker) {
        return res.status(404).json({ msg: "Email is not found" })
    }
    if (tracker.verified) {
        return res.status(400).json({ msg: "This email is already verified" })
    }
    if (tracker.email !== email) {
        return res.status(400).json({ msg: "Wrong email" })
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ msg: "Password doesn't match the confirmPassword" })
    }

    const hashedPassword = bcrypt.hashSync(password, salt);
    tracker.password = hashedPassword
    tracker.verified = true
    await tracker.save()

    return res.status(200).json({ msg: 'Password set successfully' });
})
exports.login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body

    const tracker = await Tracker.findOne({ email })

    if (!tracker) {
        return res.status(400).json({ msg: "Wrong email or password" })
    }
    if (!tracker.verified) {
        return res.status(400).json({ msg: "Please verify your email first" })
    }

    const isMatch = await bcrypt.compare(password, tracker.password)
    if (!isMatch) {
        return res.status(400).json({ msg: "Wrong email or password" })
    }

    const token = await tracker.generateAuthToken()

    res.status(201).json({ msg: 'ok', token })
})

exports.getAllTrackers = asyncHandler(async (req, res) => {
    const tracker = await Tracker.find()

    res.status(200).json({
        result: tracker.length,
        data: tracker
    })
})
exports.getAllOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find()
        .sort({ updatedAt: -1 })
        .populate([
            {
                path: 'pickedby',
                select: "_id firstName lastName email mobile"
            }, {
                path: 'deliveredby',
                select: "_id firstName lastName email mobile"
            }, {
                path: 'storekeeper',
                select: "_id firstName lastName email mobile"
            }
        ]);

    res.status(200).json({
        result: orders.length,
        data: orders
    });
})



exports.forgetPasswordEmail = asyncHandler(async (req, res) => {
    const email = req.body.email;

    const tracker = await Tracker.findOne({ email });
    if (!tracker) {
        return res.status(404).json({ msg: "Email is not found" })
    }
    if (!tracker.verified) {
        return res.status(400).json({ msg: "Please verify your email first" })
    }

    const token = jwt.sign({ email: tracker.email }, process.env.JWT_SECRET,
        {
            expiresIn: "10m"
        });

    tracker.verifyCode = genRandomNumber(6);
    await tracker.save();

    const response = await sendEmail(tracker.email, tracker._id, tracker.verifyCode, "/../views/forgetPasswordEmail.ejs", mailSubject)
    if (response && response.error) {
        console.error(response.error);
        return res.status(500).json({ msg: 'Failed to send email' });
    }

    return res.status(200).json({
        msg: 'Email sent successfully',
        token
    });
})
exports.verifyForgetPasswordCode = asyncHandler(async (req, res) => {
    const tracker = req.user
    const { code } = req.body

    if (tracker.verifyCode != code) {
        return res.status(400).json({ msg: "Wrong code" })
    }
    tracker.verifyCode = genRandomNumber(6)
    await tracker.save();

    return res.status(200).json({ msg: "ok" })
})
exports.setNewPassword = asyncHandler(async (req, res) => {
    const { password } = req.body
    const tracker = req.user

    const hash = bcrypt.hashSync(password, salt);
    tracker.password = hash;
    await tracker.save()

    res.status(200).json({ msg: "Password changed successfully" })
})