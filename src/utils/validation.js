const validator = require("validator");

const checkValidUser = (user_data) => {
  const { name, emailId, password } = user_data;
  if (password.length < 3 || name.length < 1)
    throw new error("password/name is not of valid length");
  if (!validator.isEmail(emailId)) throw new error("not valid email");
};

module.exports = {
  checkValidUser,
};
