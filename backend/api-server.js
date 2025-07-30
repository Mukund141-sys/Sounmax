// API Server with Jitsu Analytics Integration
// ===========================================

const express = require('express');
const BackendAnalytics = require('../frontend/js/backend-analytics');

const app = express();

// Add CORS support
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

app.use(express.json());

// Initialize backend analytics
const analytics = new BackendAnalytics({
    jitsuUrl: 'http://localhost:8080',
    writeKey: 'QenKIfVBZJQc4Qg0WeZmWCbEnJHlPDAx:UsUuswtbG4wRsAhGZU3Etu4nu9frfCb6',
    enabled: true
});

// Apply analytics middleware
app.use(analytics.apiTrackingMiddleware());

// API Routes
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Track authentication attempt
        await analytics.trackAuthentication({
            action: 'login',
            user_email: email,
            success: !!(email && password),
            ip_address: req.ip
        });
        
        if (email && password) {
            res.json({ 
                success: true, 
                userId: `user_${Date.now()}`,
                message: 'Login successful' 
            });
        } else {
            res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }
    } catch (error) {
        await analytics.trackError({
            endpoint: '/api/auth/login',
            error_message: error.message,
            status_code: 500
        });
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

app.get('/api/products', async (req, res) => {
    try {
        // Track database query (simulated)
        await analytics.trackDatabaseEvent({
            query_type: 'SELECT',
            table_name: 'products',
            query_duration_ms: 45,
            success: true
        });
        
        const products = [
            { id: 1, name: 'iPhone 15', price: 999, category: 'smartphones' },
            { id: 2, name: 'MacBook Pro', price: 1999, category: 'laptops' },
            { id: 3, name: 'AirPods Pro', price: 249, category: 'accessories' }
        ];
        
        res.json({ 
            success: true, 
            products 
        });
    } catch (error) {
        await analytics.trackError({
            endpoint: '/api/products',
            error_message: error.message,
            status_code: 500
        });
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

app.post('/api/payment/process', async (req, res) => {
    try {
        const { amount, currency } = req.body;
        
        // Track payment processing
        await analytics.trackPayment({
            action: 'charge',
            amount: amount,
            currency: currency || 'USD',
            success: true,
            payment_method: 'credit_card'
        });
        
        res.json({ 
            success: true, 
            transactionId: `txn_${Date.now()}`,
            amount,
            currency: currency || 'USD'
        });
    } catch (error) {
        await analytics.trackError({
            endpoint: '/api/payment/process',
            error_message: error.message,
            status_code: 500
        });
        res.status(500).json({ 
            success: false, 
            message: 'Payment failed' 
        });
    }
});

app.get('/api/system/performance', async (req, res) => {
    try {
        const memUsage = process.memoryUsage();
        
        // Track system performance
        await analytics.trackSystemPerformance({
            memory_rss: memUsage.rss,
            memory_heap_used: memUsage.heapUsed,
            memory_heap_total: memUsage.heapTotal,
            uptime: process.uptime()
        });
        
        res.json({ 
            success: true, 
            memory: memUsage,
            uptime: process.uptime()
        });
    } catch (error) {
        await analytics.trackError({
            endpoint: '/api/system/performance',
            error_message: error.message,
            status_code: 500
        });
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get performance data' 
        });
    }
});

app.get('/api/health', (req, res) => {
    console.log('🏥 Health check requested');
    res.json({ 
        success: true, 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0'
    });
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
    console.log('🧪 Test endpoint requested');
    res.json({ 
        success: true, 
        message: 'Test endpoint working!',
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    analytics.trackError({
        endpoint: req.path,
        error_message: error.message,
        status_code: 500
    });
    
    res.status(500).json({ 
        success: false, 
        message: 'Server error',
        error: error.message 
    });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 API Server running on port ${PORT}`);
    console.log(`📊 Backend analytics enabled - events sent to Jitsu`);
});

module.exports = app; 