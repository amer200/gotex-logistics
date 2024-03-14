const User = require("../models/user");
const jwt = require("jsonwebtoken");

const isVerifiedCodeToken = (UserModel) => {
    return (req, res, next) => {
        const { token } = req.body

        try {
            jwt.verify(token, process.env.JWT_SECRET, async (err, decodedData) => {
                if (err) {
                    return res.status(404).json({
                        msg: "Incorrect token or may be it is expired"
                    })
                }
                console.log(decodedData)
                const user = await UserModel.findOne({ email: decodedData.email });
                if (!user) {
                    return res.status(404).json({
                        msg: "Email is not found"
                    })
                }

                req.user = user
                next();
            });
        } catch (err) {
            console.log(`error : ${err}`)
        }
    }
}

module.exports = isVerifiedCodeToken