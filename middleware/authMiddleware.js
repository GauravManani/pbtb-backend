const jwt = require("jsonwebtoken");
const logger = require("../config/logger");

const verifyToken = (req, res, next) => {
  const token = req.cookies.jwt;

  if (!token) {
    logger.error("No token found in request");
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    console.log("Token verified successfully:", decoded);
    logger.info("Token verified successfully for user:", decoded.agentId);
    next();
  } catch (error) {
    logger.error("Invalid token:", error);
    return res.status(401).json({ message: "Invalid token" });
  }
};

const clearAuthCookie = (res) => {
  try {
    res.cookie("jwt", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: new Date(0),
    });
    logger.info("Auth cookie cleared successfully");
    return true;
  } catch (error) {
    logger.error("Error clearing auth cookie:", error);
    return false;
  }
};

module.exports = { verifyToken, clearAuthCookie };
