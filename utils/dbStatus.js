const mongoose = require('mongoose');
const logger = require('./logger');

/**
 * Get detailed MongoDB connection status
 * @returns {Object} MongoDB connection information
 */
const getMongoStatus = () => {
    try {
        const conn = mongoose.connection;

        // Connection states in Mongoose:
        // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
        const stateMap = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting'
        };

        const status = {
            state: stateMap[conn.readyState] || 'unknown',
            connected: conn.readyState === 1,
            host: conn.host || 'unknown',
            name: conn.name || 'unknown'
        };

        // Add additional info if connected
        if (conn.readyState === 1) {
            try {
                // Get some basic stats if available
                status.collections = Object.keys(conn.collections).length;
                status.models = Object.keys(mongoose.models).length;
            } catch (err) {
                logger.warn('Could not retrieve detailed database stats', err);
            }
        }

        return status;
    } catch (error) {
        logger.error(error, 'Error getting MongoDB status');
        return { state: 'error', error: error.message };
    }
};

/**
 * Check if database is functioning properly with a simple ping
 * @returns {Promise<boolean>} True if database is responding
 */
const pingDatabase = async () => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return false;
        }

        // Simple ping to check if database is responsive
        await mongoose.connection.db.admin().ping();
        return true;
    } catch (error) {
        logger.error(error, 'Database ping failed');
        return false;
    }
};

module.exports = {
    getMongoStatus,
    pingDatabase
}; 