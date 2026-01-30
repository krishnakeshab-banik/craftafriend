require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const connectDB = require('./config/database');
const logger = require('./utils/logger');

const server = express();
const serverPort = process.env.PORT || 9000;

// Connect to MongoDB
connectDB();

// Middleware
server.use(helmet());
server.use(compression());
server.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'token'],
}));

server.use(express.json({ limit: '10mb' }));
server.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
const allRoutes = require('./routes/index');
server.use(allRoutes);

// Error handling middleware
server.use((err, req, res, next) => {
    logger.error('Unhandled error: ' + err.message);
    logger.error(err.stack);
    res.status(500).json({ error: 'Internal server error', details: err.message });
});

// 404 handler
server.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
server.listen(serverPort, () => {
    logger.info(
        `Custom SRM Backend Server listening at http://localhost:${serverPort}`
    );
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    logger.info('SIGINT signal received: closing HTTP server');
    server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
    });
});
