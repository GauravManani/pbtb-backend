const mysql = require("mysql2");
const dotenv = require("dotenv");
const logger = require("../config/logger"); // Import the logger

// Load environment variables from .env file
dotenv.config();

// Create a pool of connections to the database
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Get a connection from the pool and log the status
pool.getConnection((err, connection) => {
  if (err) {
    logger.error("error connecting to the database:", err.stack);
    return;
  }
  logger.info("connected to the database as id " + connection.threadId);
  connection.release(); // release the connection back to the pool
});

module.exports = pool.promise(); // Export the pool with promise support
