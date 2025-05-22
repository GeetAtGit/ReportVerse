const logger = require('../utils/logger');

/**
 * Middleware to log all HTTP requests
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requestLogger = (req, res, next) => {
    // Store request start time
    const startTime = Date.now();

    // Log when the request is received
    if (req.originalUrl !== '/api/health') {
        // Don't log health checks to avoid spamming logs
        logger.info(`Request received: ${req.method} ${req.originalUrl}`);
    }

    // Once the request is complete
    res.on('finish', () => {
        const duration = Date.now() - startTime;

        // Only log health check responses if they fail
        if (req.originalUrl === '/api/health' && res.statusCode !== 200) {
            logger.warn(`Health check failed: ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
        } else if (req.originalUrl !== '/api/health') {
            // Log all non-health check requests
            logger.httpRequest(req, res, duration);
        }
    });

    next();
};

module.exports = requestLogger; 