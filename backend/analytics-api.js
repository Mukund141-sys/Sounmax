// API Server with Simple Analytics
// ===============================

const express = require('express');
const app = express();

app.use(express.json());

// Simple analytics tracking (no complex middleware)
const analytics = {
    trackEvent: (eventType, data) => {
        console.log(`📊 Analytics Event: ${eventType}`, data);
        // In a real setup, this would send to Jitsu
    }
};

// Debug middleware
app.use((req, res, next) => {
    console.log(`🔍 Request: ${req.method} ${req.path}`);
    next();
});

// API endpoints with simple analytics
app.post('/api/auth/login', (req, res) => {
    console.log('🔐 Login endpoint called');
    try {
        const { email, password } = req.body;
        
        // Track login attempt
        analytics.trackEvent('User Authentication', {
            action: 'login',
            success: !!(email && password),
            timestamp: new Date().toISOString()
        });
        
        if (email && password) {
            console.log('✅ Login successful');
            res.json({ 
                success: true, 
                userId: `user_${Date.now()}`,
                message: 'Login successful' 
            });
        } else {
            console.log('❌ Login failed - missing credentials');
            res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }
    } catch (error) {
        console.error('💥 Login error:', error);
        analytics.trackEvent('API Error', {
            endpoint: '/api/auth/login',
            error: error.message,
            timestamp: new Date().toISOString()
        });
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

app.get('/api/products', (req, res) => {
    console.log('📦 Products endpoint called');
    try {
        // Track API call
        analytics.trackEvent('API Call', {
            method: 'GET',
            path: '/api/products',
            timestamp: new Date().toISOString()
        });
        
        const products = [
            { id: 1, name: 'iPhone 15', price: 999, category: 'smartphones' },
            { id: 2, name: 'MacBook Pro', price: 1999, category: 'laptops' },
            { id: 3, name: 'AirPods Pro', price: 249, category: 'accessories' }
        ];
        
        console.log('✅ Products returned successfully');
        res.json({ 
            success: true, 
            products 
        });
    } catch (error) {
        console.error('💥 Products error:', error);
        analytics.trackEvent('API Error', {
            endpoint: '/api/products',
            error: error.message,
            timestamp: new Date().toISOString()
        });
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

app.post('/api/payment/process', (req, res) => {
    console.log('💳 Payment endpoint called');
    try {
        const { amount, currency } = req.body;
        
        // Track payment
        analytics.trackEvent('Payment Processing', {
            action: 'charge',
            amount: amount,
            currency: currency || 'USD',
            success: true,
            timestamp: new Date().toISOString()
        });
        
        res.json({ 
            success: true, 
            transactionId: `txn_${Date.now()}`,
            amount,
            currency: currency || 'USD'
        });
    } catch (error) {
        console.error('💥 Payment error:', error);
        analytics.trackEvent('Payment Processing', {
            action: 'charge',
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
        res.status(500).json({ 
            success: false, 
            message: 'Payment failed' 
        });
    }
});

app.get('/api/health', (req, res) => {
    console.log('🏥 Health check called');
    res.json({ 
        success: true, 
        status: 'healthy',
        uptime: process.uptime()
    });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Analytics API server running on port ${PORT}`);
    console.log(`📊 Simple analytics enabled - events logged to console`);
});

module.exports = app; 