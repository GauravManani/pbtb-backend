const winston = require("winston");

// Define the log format
const logFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message }) => {
    return `[${timestamp}] [${level}]: ${message}`;
  })
);

// Create the logger instance
const logger = winston.createLogger({
  level: "info", // Set default logging level
  transports: [
    new winston.transports.Console({
      format: logFormat,
    }),
    new winston.transports.File({
      filename: "logs/app.log",
      level: "info",
      format: logFormat,
    }),
  ],
});

// Export the logger
module.exports = logger;
