const jwt = require("jsonwebtoken");

const generateAuthToken = async function () {
  const user = {
    id: this._id,
    role: this.role,
  };
  const token = jwt.sign(user, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE_TIME,
  });

  await this.save();
  return token;
};

module.exports = generateAuthToken;
