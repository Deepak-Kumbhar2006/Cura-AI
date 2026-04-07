const jwt = require("jsonwebtoken");

// Optional JWT auth for endpoints that should work without login.
module.exports = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.toLowerCase().startsWith("bearer ")) return next();

  const token = header.split(" ")[1];
  if (!token) return next();

  // If JWT secret isn't configured, skip personalization (endpoint remains public).
  if (!process.env.JWT_SECRET) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, iat, exp, ... }
  } catch (err) {
    // Invalid/expired token should not break public chat.
  }

  next();
};

