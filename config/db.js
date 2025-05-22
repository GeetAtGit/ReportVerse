const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Connection options
const connectOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 10000, // 10 seconds
    socketTimeoutMS: 45000, // 45 seconds
    connectTimeoutMS: 10000, // 10 seconds
    heartbeatFrequencyMS: 10000, // 10 seconds
    retryWrites: true,
    maxPoolSize: 10, // Maximum number of connections in the pool
    minPoolSize: 5, // Minimum number of connections in the pool
    family: 4, // Use IPv4, skip trying IPv6
};

// Connection state tracking variables
let isConnecting = false;
const MAX_RETRY_COUNT = 5;
let retryCount = 0;
let retryTimeoutId = null;

/**
 * Calculate backoff time for reconnection attempts
 * @param {number} retry - Current retry count
 * @returns {number} - Time in ms to wait before next attempt
 */
const getRetryTime = (retry) => {
    // Exponential backoff: 2^retry * 1000 ms, with a maximum of 30 seconds
    return Math.min(Math.pow(2, retry) * 1000, 30000);
};

/**
 * Initialize connection to MongoDB
 * @returns {Promise<mongoose.Connection>} - Mongoose connection object
 */
const connectDB = async () => {
    if (isConnecting) {
        logger.info('MongoDB connection already in progress');
        return mongoose.connection;
    }

    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
        const error = new Error('MongoDB URI is not defined in environment variables');
        logger.error(error, 'MongoDB Connection');
        throw error;
    }

    try {
        isConnecting = true;
        logger.info('Attempting to connect to MongoDB...');

        await mongoose.connect(mongoURI, connectOptions);

        isConnecting = false;
        retryCount = 0;

        return mongoose.connection;
    } catch (error) {
        isConnecting = false;
        handleConnectionError(error);
        return mongoose.connection;
    }
};

/**
 * Handle connection errors and implement retry strategy
 * @param {Error} error - Connection error
 */
const handleConnectionError = (error) => {
    logger.error(error, 'MongoDB Connection Error');

    if (retryCount < MAX_RETRY_COUNT) {
        retryCount++;
        const retryTime = getRetryTime(retryCount);

        logger.info(`Retrying MongoDB connection (${retryCount}/${MAX_RETRY_COUNT}) in ${retryTime / 1000} seconds...`);

        clearTimeout(retryTimeoutId);
        retryTimeoutId = setTimeout(() => {
            connectDB().catch((err) => {
                logger.error(err, 'MongoDB Reconnection Error');
            });
        }, retryTime);
    } else {
        logger.error(new Error(`Failed to connect to MongoDB after ${MAX_RETRY_COUNT} attempts`), 'MongoDB Connection');
        process.exit(1); // Exit with error code to allow process manager to restart the application
    }
};

// Set up connection event listeners
mongoose.connection.on('connected', () => {
    logger.info('Successfully connected to MongoDB');
});

mongoose.connection.on('disconnected', () => {
    logger.warn('Disconnected from MongoDB');

    // Only attempt reconnection if this wasn't a manual disconnect
    if (!mongoose.connection._closeCalled) {
        handleConnectionError(new Error('MongoDB disconnected unexpectedly'));
    }
});

mongoose.connection.on('error', (err) => {
    logger.error(err, 'MongoDB Connection Error Event');

    // If we get a fatal error, attempt reconnection
    if (err.name === 'MongoNetworkError' || err.name === 'MongoTimeoutError') {
        handleConnectionError(err);
    }
});

// Handle process termination
process.on('SIGINT', async () => {
    try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed due to application termination');
        process.exit(0);
    } catch (err) {
        logger.error(err, 'Error during MongoDB disconnect on SIGINT');
        process.exit(1);
    }
});

process.on('SIGTERM', async () => {
    try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed due to application termination');
        process.exit(0);
    } catch (err) {
        logger.error(err, 'Error during MongoDB disconnect on SIGTERM');
        process.exit(1);
    }
});

module.exports = connectDB; 