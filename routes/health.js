const express = require('express');
const router = express.Router();
const os = require('os');
const mongoose = require('mongoose');
const dbStatus = require('../utils/dbStatus');
const logger = require('../utils/logger');

/**
 * @route   GET /api/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/', async (req, res) => {
    try {
        // Check database connection
        const dbConnectionStatus = dbStatus.getMongoStatus();
        const dbResponseCheck = await dbStatus.pingDatabase();

        // System info
        const systemInfo = {
            uptime: Math.floor(process.uptime()),
            memory: {
                free: os.freemem(),
                total: os.totalmem(),
                usedPercent: Math.round((1 - os.freemem() / os.totalmem()) * 100)
            },
            cpu: os.cpus().length
        };

        // Get package.json version
        const { version } = require('../package.json');

        // Determine overall status
        const isHealthy = dbConnectionStatus.connected && dbResponseCheck;

        const response = {
            status: isHealthy ? 'up' : 'degraded',
            timestamp: new Date().toISOString(),
            version,
            environment: process.env.NODE_ENV || 'development',
            database: {
                ...dbConnectionStatus,
                responsive: dbResponseCheck
            },
            system: systemInfo
        };

        // Log only if there's an issue
        if (!isHealthy) {
            logger.warn('Health check showing degraded service', response);
        }

        // Always return 200 for monitoring tools, but include accurate status
        return res.status(200).json(response);
    } catch (error) {
        logger.error(error, 'Health check failed');
        return res.status(500).json({
            status: 'down',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

module.exports = router; 