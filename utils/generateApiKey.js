const genRandomKey = require("./genRandomKey");

exports.generateTestApiKey = async (user) => {
  const key = genRandomKey(150);

  user.apiKey.test = key;
  await user.save();

  return key;
};

exports.generateProductionApiKey = async (user) => {
  const key = genRandomKey(150);

  user.apiKey.production = key;
  await user.save();

  return key;
};
