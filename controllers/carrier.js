const asyncHandler = require('express-async-handler')
const Carrier = require("../models/carrier");
const bcrypt = require('bcrypt');
const salt = 10;
const sendEmail = require("../utils/sendEmail");
const mailSubject = "Verify your gotex account"


exports.registerCarrier = asyncHandler(async (req, res) => {
    let { firstName, lastName, email, mobile, nid, city, address, area } = req.body;
    console.log(req.files)
    let photo = ''
    let papers = []
    if (req.files) {
        const photo = req.files.photo && req.files.photo[0].path;

        if (req.files.papers) {
            req.files.papers.forEach(f => {
                papers.push(f.path)
            });
        }
    }

    const isEmailUsed = await Carrier.findOne({ email })
    if (isEmailUsed) {
        return res.status(409).json({
            msg: "Email is already used"
        })
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
        area,
    })

    const response = await sendEmail(carrier.email, carrier._id, "/../views/carrierVerifyEmail.ejs", mailSubject)
    if (response && response.error) {
        console.error(response.error);
        return res.status(500).json({ msg: 'Failed to send email' });
    }

    return res.status(200).json({ msg: 'Email sent successfully' });
})

exports.setPasswordFirstTime = asyncHandler(async (req, res) => {
    const { carrierId } = req.params;
    const { email, password, confirmPassword } = req.body;

    const carrier = await Carrier.findById(carrierId)

    if (carrier.verified) {
        return res.status(400).json({ msg: "This email is already verified" })
    }
    if (carrier.email !== email) {
        return res.status(400).json({ msg: "Wrong email" })
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ msg: "Password doesn't match the confirmPassword" })
    }

    const hashedPassword = bcrypt.hashSync(password, salt);
    carrier.password = hashedPassword
    carrier.verified = true
    await carrier.save()

    return res.status(200).json({ msg: 'Password set successfully' });
})

exports.login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body

    const carrier = await Carrier.findOne({ email })

    if (!carrier.verified) {
        return res.status(400).json({ msg: "Please verify your email first" })
    }
    if (!carrier) {
        return res.status(400).json({ msg: "Wrong email or password" })
    }

    const isMatch = await bcrypt.compare(password, carrier.password)
    if (!isMatch) {
        return res.status(400).json({ msg: "Wrong email or password" })
    }

    const token = await carrier.generateAuthToken()

    res.status(201).json({ msg: 'ok', token })
})

exports.getAllCarriers = asyncHandler(async (req, res) => {
    const carriers = await Carrier.find()

    res.status(200).json({
        result: carriers.length,
        data: carriers
    })
})
