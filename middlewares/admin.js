const jwt = require("jsonwebtoken");

exports.isAdminAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(400).json({
            msg: "Token is required"
        })
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(400).json({ msg: err })
        }
        console.log(user)
        if (user.role == 'admin') {
            req.user = user
            next();
        } else {
            res.status(405).json({ msg: "Not allowed" })
        }
    })
}
