// Debug API Server
// ================

const express = require('express');
const app = express();

app.use(express.json());

// Debug middleware to catch errors
app.use((req, res, next) => {
    console.log(`🔍 Request: ${req.method} ${req.path}`);
    console.log(`📝 Headers:`, req.headers);
    console.log(`📦 Body:`, req.body);
    next();
});

// Simple endpoints without analytics
app.post('/api/auth/login', (req, res) => {
    console.log('🔐 Login endpoint called');
    try {
        const { email, password } = req.body;
        
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
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

app.get('/api/products', (req, res) => {
    console.log('📦 Products endpoint called');
    try {
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
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
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

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('💥 Global error:', error);
    res.status(500).json({ 
        success: false, 
        message: 'Server error',
        error: error.message 
    });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Debug API server running on port ${PORT}`);
    console.log(`🔍 Debug mode enabled - all requests will be logged`);
});

module.exports = app; 