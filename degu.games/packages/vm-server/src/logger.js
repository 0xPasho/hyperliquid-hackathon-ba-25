/**
 * Logger Configuration
 *
 * Winston logger with console and file transports
 */

const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level.toUpperCase()}] ${message}`;

        // Add metadata if present
        if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
        }

        return msg;
    })
);

// Console format (colorized for development)
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message }) => {
        return `${timestamp} ${level}: ${message}`;
    })
);

// Transports
const transports = [
    // Console transport
    new winston.transports.Console({
        format: consoleFormat,
        level: process.env.LOG_LEVEL || 'info'
    })
];

// Add file transport if LOG_FILE is specified
if (process.env.LOG_FILE) {
    const logDir = path.dirname(process.env.LOG_FILE);

    transports.push(
        new DailyRotateFile({
            filename: process.env.LOG_FILE.replace('.log', '-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxFiles: '14d', // Keep logs for 14 days
            maxSize: '20m', // Rotate if file exceeds 20MB
            format: logFormat,
            level: process.env.LOG_LEVEL || 'info'
        })
    );
}

// Create logger
const logger = winston.createLogger({
    transports,
    exitOnError: false
});

// Log unhandled errors
logger.on('error', (err) => {
    console.error('Logger error:', err);
});

module.exports = logger;
