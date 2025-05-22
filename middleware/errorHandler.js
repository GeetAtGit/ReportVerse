const logger = require('../utils/logger');

// Custom error class with status code
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

// Handle CastError (invalid MongoDB ID)
const handleCastError = (err) => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400);
};

// Handle duplicate key errors
const handleDuplicateFieldsError = (err) => {
    const value = err.message.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Duplicate field value: ${value}. Please use another value.`;
    return new AppError(message, 400);
};

// Handle validation errors
const handleValidationError = (err) => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);
};

// Handle JWT errors
const handleJWTError = () => {
    return new AppError('Invalid token. Please log in again.', 401);
};

// Handle expired token error
const handleTokenExpiredError = () => {
    return new AppError('Your token has expired. Please log in again.', 401);
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error details
    logger.error(err, 'Request Error Handler');

    // Specific error handling based on error type
    if (err.name === 'CastError') error = handleCastError(err);
    if (err.code === 11000) error = handleDuplicateFieldsError(err);
    if (err.name === 'ValidationError') error = handleValidationError(err);
    if (err.name === 'JsonWebTokenError') error = handleJWTError();
    if (err.name === 'TokenExpiredError') error = handleTokenExpiredError();

    // Send error response
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        error: error.message || 'Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = {
    AppError,
    errorHandler
}; 