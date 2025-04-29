const jwt = require("jsonwebtoken");

module.exports = (user) => {
  let expiresIn = process.env.JWT_EXPIRES_IN || "1d"; // Default to 1 day if not set in env
  if (user.role === "admin") {
    expiresIn = "6h";
  }

  const token = jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: expiresIn }
  );

  return token;
};
