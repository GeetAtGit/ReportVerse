const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}

// Log file paths
const errorLogPath = path.join(logsDir, 'error.log');
const infoLogPath = path.join(logsDir, 'info.log');

// Timestamp generator
const timestamp = () => {
    return new Date().toISOString();
};

// Formats error objects for logging
const formatError = (err) => {
    if (!(err instanceof Error)) {
        return String(err);
    }

    return {
        message: err.message,
        stack: err.stack,
        name: err.name,
        ...(err.code && { code: err.code }),
        ...(err.statusCode && { statusCode: err.statusCode })
    };
};

// Log error to file and console
const error = (err, context = '') => {
    const formattedError = formatError(err);
    const logEntry = JSON.stringify({
        timestamp: timestamp(),
        level: 'ERROR',
        context,
        error: formattedError
    }) + '\n';

    // Log to console
    console.error(`[ERROR][${timestamp()}] ${context}: ${err.message}`);

    // Log to file
    try {
        fs.appendFileSync(errorLogPath, logEntry);
    } catch (writeErr) {
        console.error(`Failed to write to error log: ${writeErr.message}`);
    }
};

// Log info message to file and console
const info = (message, data = null) => {
    const logEntry = JSON.stringify({
        timestamp: timestamp(),
        level: 'INFO',
        message,
        ...(data && { data })
    }) + '\n';

    // Log to console
    console.log(`[INFO][${timestamp()}] ${message}`);

    // Log to file
    try {
        fs.appendFileSync(infoLogPath, logEntry);
    } catch (writeErr) {
        console.error(`Failed to write to info log: ${writeErr.message}`);
    }
};

// Log warning message to console and file
const warn = (message, data = null) => {
    const logEntry = JSON.stringify({
        timestamp: timestamp(),
        level: 'WARN',
        message,
        ...(data && { data })
    }) + '\n';

    // Log to console
    console.warn(`[WARN][${timestamp()}] ${message}`);

    // Log to file
    try {
        fs.appendFileSync(infoLogPath, logEntry);
    } catch (writeErr) {
        console.error(`Failed to write to info log: ${writeErr.message}`);
    }
};

// Log HTTP requests
const httpRequest = (req, res, duration) => {
    const logEntry = JSON.stringify({
        timestamp: timestamp(),
        level: 'INFO',
        type: 'HTTP',
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress
    }) + '\n';

    // Log to file
    try {
        fs.appendFileSync(infoLogPath, logEntry);
    } catch (writeErr) {
        console.error(`Failed to write to info log: ${writeErr.message}`);
    }
};

// Set up global uncaught exception and unhandled rejection handlers
const setupGlobalHandlers = () => {
    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
        error(err, 'Uncaught Exception');
        console.error('Uncaught Exception! The application will continue running, but may be in an unstable state.');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
        error(reason, 'Unhandled Promise Rejection');
        console.error('Unhandled Promise Rejection! The application will continue running, but may be in an unstable state.');
    });

    info('Global exception handlers configured');
};

module.exports = {
    error,
    info,
    warn,
    httpRequest,
    setupGlobalHandlers
}; 