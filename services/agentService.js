const logger = require("../config/logger");
const db = require("./dbService");
const jwt = require("jsonwebtoken");
const CryptoJS = require("crypto-js");
const { clearAuthCookie } = require("../middleware/authMiddleware");
const {
  passwordEncryptionColumns,
  dataEncryptionColumns,
  safeDecrypt,
} = require("./cryptoService");

const validateAgent = async (req, res) => {
  const { agentId, password } = req.body;

  if (!agentId || !password) {
    logger.error("Agent ID and password are required");
    return res.status(400).send("Agent ID and password are required");
  }

  try {
    // Fetch agent by agentId only
    const [results] = await db.query(
      "SELECT * FROM AGENT_INFO WHERE AGENT_ID = ?",
      [agentId]
    );

    console.log("validateAgent", results);

    if (results.length === 0) {
      logger.error("Invalid User Name or Password");
      return res.status(401).json({ message: "Invalid User Name or password" });
    }

    // Decrypt the password from DB
    const dbEncryptedPassword = results[0].AGENT_PASSWORD;
    const decryptedPassword = safeDecrypt(dbEncryptedPassword, "password");

    // Hash the decrypted password
    const hashedDecryptedPassword = CryptoJS.SHA256(decryptedPassword).toString(
      CryptoJS.enc.Hex
    );

    // Compare with the hashed password from the request body
    if (hashedDecryptedPassword !== password) {
      logger.error("Invalid User Name or Password");
      return res.status(401).json({ message: "Invalid User Name or password" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { agentId: results[0].AGENT_ID, role: results[0].AGENT_ROLE },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Set JWT token in httpOnly cookie
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    logger.info("Agent successfully authenticated");
    res.status(200).json({
      message: "SUCCESS",
      agent: {
        agent_id: results[0].AGENT_ID,
        agent_type: results[0].AGENT_TYPE,
      },
    });
  } catch (err) {
    logger.error("Error validating agent:", err);
    res.status(500).send("Technical error. Please try again later");
  }
};

const logout = async (req, res) => {
  try {
    if (clearAuthCookie(res)) {
      logger.info("Agent logged out successfully");
      res.status(200).json({ message: "Logged out successfully" });
    } else {
      throw new Error("Failed to clear authentication cookie");
    }
  } catch (err) {
    logger.error("Error during logout:", err);
    res.status(500).json({ message: "Error during logout" });
  }
};

module.exports = {
  validateAgent,
  logout,
};
