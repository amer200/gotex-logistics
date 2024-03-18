const asyncHandler = require('express-async-handler')
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const User = require("../models/user");
const sendEmail = require("../utils/sendEmail");
const genRandomNumber = require('./../utils/genRandomNumber')
const salt = 10;
const mailSubject = "Verify your gotex account"


exports.registerUser = asyncHandler(async (req, res) => {
    const { firstName, lastName, email, mobile, nid, city, address } = req.body;

    const isEmailUsed = await User.findOne({ email })
    if (isEmailUsed) {
        return res.status(409).json({ msg: "Email is already used" })
    }

    const user = await User.create({
        firstName,
        lastName,
        email,
        mobile,
        nid,
        city,
        address,
        role: 'data entry',
    })

    const response = await sendEmail(user.email, user._id, '', "/../views/userVerifyEmail.ejs", mailSubject)
    if (response && response.error) {
        console.error(response.error);
        return res.status(500).json({ msg: 'Failed to send email' });
    }

    return res.status(200).json({ msg: 'Email sent successfully' });
})

exports.resendVerifyEmail = asyncHandler(async (req, res) => {
    const id = req.params.id;

    const user = await User.findById(id)
    if (!user) {
        return res.status(409).json({ msg: "User is not found" })
    }

    const response = await sendEmail(user.email, user._id, '', "/../views/userVerifyEmail.ejs", mailSubject)
    if (response && response.error) {
        console.error(response.error);
        return res.status(500).json({ msg: 'Failed to send email' });
    }

    return res.status(200).json({ msg: 'Email sent successfully' });
})

exports.setPasswordFirstTime = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { email, password, confirmPassword } = req.body;

    const user = await User.findById(userId)

    if (!user) {
        return res.status(404).json({ msg: "Email is not found" })
    }
    if (user.verified) {
        return res.status(400).json({ msg: "This email is already verified" })
    }
    if (user.email !== email) {
        return res.status(400).json({ msg: "Wrong email" })
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ msg: "Password doesn't match the confirmPassword" })
    }

    const hashedPassword = bcrypt.hashSync(password, salt);
    user.password = hashedPassword
    user.verified = true
    await user.save()

    return res.status(200).json({ msg: 'Password set successfully' });
})
exports.login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body

    const user = await User.findOne({ email })

    if (!user) {
        return res.status(400).json({ msg: "Wrong email or password" })
    }
    if (!user.verified) {
        return res.status(400).json({ msg: "Please verify your email first" })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
        return res.status(400).json({ msg: "Wrong email or password" })
    }

    const token = await user.generateAuthToken()

    res.status(201).json({ msg: 'ok', token })
})

exports.getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find()

    res.status(200).json({
        result: users.length,
        data: users
    })
})


exports.forgetPasswordEmail = asyncHandler(async (req, res) => {
    const email = req.body.email;

    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json({ msg: "Email is not found" })
    }
    if (!user.verified) {
        return res.status(400).json({ msg: "Please verify your email first" })
    }

    const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET,
        {
            expiresIn: "10m"
        });

    user.verifyCode = genRandomNumber(6);
    await user.save();

    const response = await sendEmail(user.email, user._id, user.verifyCode, "/../views/forgetPasswordEmail.ejs", mailSubject)
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
    const user = req.user
    const { code } = req.body

    if (user.verifyCode != code) {
        return res.status(400).json({ msg: "Wrong code" })
    }
    user.verifyCode = genRandomNumber(6)
    await user.save();

    return res.status(200).json({ msg: "ok" })
})
exports.setNewPassword = asyncHandler(async (req, res) => {
    const { password } = req.body
    const user = req.user

    const hash = bcrypt.hashSync(password, salt);
    user.password = hash;
    await user.save()

    res.status(200).json({ msg: "Password changed successfully" })
})