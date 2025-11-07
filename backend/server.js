// backend/server.js
const express = require('express');
const cors = require('cors');
const { testConnection } = require('./src/config/database');
require('dotenv').config();

// Import routes
const townRoutes = require('./src/routes/townRoutes');
const flatTypeRoutes = require('./src/routes/flatTypeRoutes');
const propertyRoutes = require('./src/routes/propertyRoutes');
const analyticsRoutes = require('./src/routes/analyticsRoutes');
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');



// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// MIDDLEWARE
// ============================================

// Enable CORS (allow frontend to call backend)
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (simple version)
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// ============================================
// ROUTES
// ============================================

// Login Route
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

const mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB Atlas connected"))
.catch(err => console.error("❌ MongoDB Atlas connection error:", err));


// Health check endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'HDB Analytics API',
        version: '1.0.0',
        status: 'running',
        endpoints: {
            towns: '/api/towns',
            flatTypes: '/api/flat-types',
            properties: '/api/properties',
            analytics: '/api/analytics'
        }
    });
});

// Health check for database
app.get('/health', async (req, res) => {
    try {
        const dbConnected = await testConnection();
        res.json({
            status: 'healthy',
            database: dbConnected ? 'connected' : 'disconnected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});

// API Routes
app.use('/api/towns', townRoutes);
app.use('/api/flat-types', flatTypeRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/analytics', analyticsRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.path,
        method: req.method
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, async () => {
    console.log('==========================================');
    console.log('HDB Analytics API Server');
    console.log('==========================================');
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`API URL: http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log('==========================================\n');
    
    // Test database connection on startup
    console.log('Testing database connection...');
    const connected = await testConnection();
    if (!connected) {
        console.error('⚠️  Warning: Database connection failed!');
    }
    console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\nSIGINT received, shutting down gracefully...');
    process.exit(0);
});

module.exports = app;