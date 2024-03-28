const jwt = require("jsonwebtoken");

const authStoreKeeper = () => {
    return (req, res, next) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(400).json({ msg: "Token is required" })
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                return res.status(400).json({ msg: err })
            }
            req.id = user.id
            next();
        })
    }
}

module.exports = authStoreKeeper