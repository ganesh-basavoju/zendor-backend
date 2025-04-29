const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }
  const token = authHeader.split(" ")[1];
  // console.log(token,"token");
  // console.log("authHeader",authHeader);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role == "admin") {
      req.admin = decoded;
    } else {
      req.user = decoded;
    }
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
};
