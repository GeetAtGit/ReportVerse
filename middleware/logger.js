const logger = require('../utils/logger');

// HTTP request logging middleware
const requestLogger = (req, res, next) => {
    const start = Date.now();

    // Store original end function
    const originalEnd = res.end;

    // Override end function
    res.end = function (chunk, encoding) {
        // Calculate request duration
        const duration = Date.now() - start;

        // Log the HTTP request
        logger.httpRequest(req, res, duration);

        // Call the original end function
        originalEnd.call(this, chunk, encoding);
    };

    next();
};

module.exports = requestLogger; 