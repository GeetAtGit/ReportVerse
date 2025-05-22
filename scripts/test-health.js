// Simple test script for the health endpoint
const http = require('http');
const url = require('url');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const healthRoute = require('../routes/health');

// Load environment variables
dotenv.config();

// Set up a minimal Express app
const app = express();
app.use(cors());
app.use(express.json());

// Register health route
app.use('/api/health', healthRoute);

// Start server and connect to database
async function startTestServer() {
    try {
        console.log('Connecting to database...');
        await connectDB();

        const port = 5555; // Use a different port for testing
        const server = app.listen(port, () => {
            console.log(`Test server running on port ${port}`);
            console.log(`Test health API at http://localhost:${port}/api/health`);

            // Make a request to the health endpoint
            setTimeout(() => {
                console.log('Testing health endpoint...');
                const req = http.request({
                    hostname: 'localhost',
                    port,
                    path: '/api/health',
                    method: 'GET'
                }, (res) => {
                    console.log(`Status: ${res.statusCode}`);
                    let data = '';

                    res.on('data', (chunk) => {
                        data += chunk;
                    });

                    res.on('end', () => {
                        console.log('Response:');
                        console.log(JSON.parse(data));

                        // Close server and database connection
                        console.log('Test completed, shutting down...');
                        server.close(() => {
                            mongoose.connection.close();
                            process.exit(0);
                        });
                    });
                });

                req.on('error', (error) => {
                    console.error('Health check test failed:', error);
                    process.exit(1);
                });

                req.end();
            }, 1000);
        });
    } catch (error) {
        console.error('Failed to start test server:', error);
        process.exit(1);
    }
}

// Run the test
startTestServer(); 