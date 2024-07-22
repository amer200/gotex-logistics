const otpGenerator = require("otp-generator");

const genRandomKey = (length) => {
  return otpGenerator.generate(length, {
    upperCaseAlphabets: true,
    specialChars: true,
    lowerCaseAlphabets: true,
    digits: true,
  });
};

module.exports = genRandomKey;
