const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const logger = require('./utils/logger');
const requestLogger = require('./middleware/requestLogger');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(requestLogger);

// Import routes
const authRoutes = require('./routes/auth');
const menteeRoutes = require('./routes/mentee');
const mentorRoutes = require('./routes/mentor');
const healthRoutes = require('./routes/health');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/mentee', menteeRoutes);
app.use('/api/mentor', mentorRoutes);
app.use('/api/health', healthRoutes);

// Root route for health check
app.get('/', (req, res) => {
    res.json({ status: 'API is running' });
});

// 404 handler
app.use((req, res, next) => {
    logger.warn(`Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        error: 'Resource not found'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;

    // Log error details
    logger.error(`${statusCode} - ${err.message} - ${req.method} ${req.originalUrl} - ${req.ip}`, err);

    // Don't expose stack trace in production
    const errorResponse = {
        success: false,
        error: err.message || 'Server Error'
    };

    if (process.env.NODE_ENV !== 'production' && err.stack) {
        errorResponse.stack = err.stack;
    }

    res.status(statusCode).json(errorResponse);
});

// Set up global exception handlers (moved from logger.js)
process.on('uncaughtException', (error) => {
    logger.error('UNCAUGHT EXCEPTION! Shutting down...', error);
    console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
    console.error(error.name, error.message);
});

process.on('unhandledRejection', (error) => {
    logger.error('UNHANDLED REJECTION! Shutting down...', error);
    console.error('UNHANDLED REJECTION! 💥 Shutting down...');
    console.error(error.name, error.message);
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
}); 