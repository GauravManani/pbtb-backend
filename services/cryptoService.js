// Safe decryption helper to avoid errors on non-encrypted or malformed data
function safeDecrypt(text, type = "data") {
  if (
    typeof text === "string" &&
    text.includes(":") &&
    text.split(":")[0].length === 32 // IV is 16 bytes = 32 hex chars
  ) {
    try {
      return decrypt(text, type);
    } catch (e) {
      console.error(`Decryption failed for type '${type}' with value:`, text);
      console.error(e);
      return text;
    }
  }
  return text;
}
// Define which columns to encrypt for each key type (shared config)
const passwordEncryptionColumns = ["password"];
const dataEncryptionColumns = [
  "full_name",
  "first_name",
  "middle_name",
  "last_name",
  "emirates_id",
  "nationality",
  "plan_name",
  "dob",
  "mobile",
  "email",
  "passport_number",
]; // Add more fields as needed

const crypto = require("crypto");
require("dotenv").config();

const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16; // AES block size

function getKey(type) {
  if (type === "password") {
    return process.env.AES_PASSWORD_KEY;
  } else {
    return process.env.AES_DATA_KEY;
  }
}

function encrypt(text, type = "data") {
  const key = getKey(type);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(key, "hex"), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

function decrypt(text, type = "data") {
  const key = getKey(type);
  const textParts = text.split(":");
  const iv = Buffer.from(textParts.shift(), "hex");
  const encryptedText = textParts.join(":");
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(key, "hex"),
    iv
  );
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  console.log("Decrypted text:", decrypted);
  return decrypted;
}

module.exports = {
  encrypt,
  decrypt,
  safeDecrypt,
  passwordEncryptionColumns,
  dataEncryptionColumns,
};
