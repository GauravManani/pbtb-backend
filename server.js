const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const logger = require("./config/logger");
const { verifyToken } = require("./middleware/authMiddleware");
const versionMiddleware = require("./middleware/versionMiddleware");

const agentService = require("./services/agentService");
const syncData = require("./services/dataSyncService"); // Import the data sync service
const fetchRecords = require("./services/fetchRecords"); // Import the fetch records service

// Load environment variables from .env file
dotenv.config();

// Initialize the express app
const app = express();

// API Versions
const V1 = "/api/v1";

// Middleware to log requests
app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  next();
});

// Middleware for cookies
app.use(cookieParser());

// Local Middleware to enable CORS with credentials
app.use(
  cors({
    credentials: true,
    origin: true,
  })
);

// Middleware to parse JSON data
app.use(express.json());

// Public routes (no token required)
app.post(
  `${V1}/validate-agent`,
  versionMiddleware("v1"),
  agentService.validateAgent
);

app.post(`${V1}/logout`, versionMiddleware("v1"), agentService.logout);

app.post(
  `${V1}/data-sync`,
  versionMiddleware("v1"),
  verifyToken,
  syncData.syncData
);
app.post(
  `${V1}/get-case-data`,
  versionMiddleware("v1"),
  verifyToken,
  syncData.getDataById
);
app.get(
  `${V1}/fetch-records/:type`,
  versionMiddleware("v1"),
  verifyToken,
  fetchRecords.fetchLifeRecords
);

// Start the server
app.listen(process.env.PORT, "0.0.0.0", () => {
  logger.info("Server is running on port http://localhost:" + process.env.PORT);
});
