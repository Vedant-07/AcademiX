const validator = require("validator");

const checkValidUser = (user_data) => {
  const { firstName, lastName, emailId, password } = user_data;
  if (password.length < 3 || firstName.length < 1 || lastName.length < 1)
    throw new error("password/name is not of valid length");
  if (!validator.isEmail(emailId)) throw new error("not valid email");
};

const checkValidUserFields = (user_data, user_fields) => {
  return Object.keys(user_data).every((k) => user_fields.includes(k));
};

module.exports = {
  checkValidUser,
  checkValidUserFields,
};
