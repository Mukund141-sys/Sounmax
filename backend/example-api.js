// Example Backend API with Analytics Integration
// =============================================

const BackendAnalytics = require('./js/backend-analytics');

// Initialize backend analytics
const analytics = new BackendAnalytics({
    jitsuUrl: 'http://localhost:8080',
    writeKey: 'QenKIfVBZJQc4Qg0WeZmWCbEnJHlPDAx:UsUuswtbG4wRsAhGZU3Etu4nu9frfCb6',
    enabled: true,
    batchSize: 5,
    batchTimeout: 3000
});

// Express.js middleware for API tracking
const apiTrackingMiddleware = async (req, res, next) => {
    await analytics.trackApiRequest(req, res, next);
};

// Example API endpoints with analytics
class ExampleAPI {
    constructor() {
        this.analytics = analytics;
    }

    // User Authentication Endpoint
    async loginUser(req, res) {
        try {
            const { email, password } = req.body;
            
            // Simulate authentication
            const userId = `user_${Date.now()}`;
            const success = email && password;
            
            // Track authentication
            await this.analytics.trackUserAuth('login', userId, success);
            
            if (success) {
                res.json({ success: true, userId, message: 'Login successful' });
            } else {
                res.status(401).json({ success: false, message: 'Invalid credentials' });
            }
        } catch (error) {
            await this.analytics.trackApiError(error, req);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    // Product API Endpoint
    async getProducts(req, res) {
        try {
            const startTime = Date.now();
            
            // Simulate database query
            const query = "SELECT * FROM products WHERE category = $1";
            const queryStart = Date.now();
            
            // Simulate database delay
            await new Promise(resolve => setTimeout(resolve, 50));
            
            const queryDuration = Date.now() - queryStart;
            await this.analytics.trackDbQuery(query, queryDuration, true);
            
            const products = [
                { id: 1, name: 'iPhone 15', price: 999, category: 'smartphones' },
                { id: 2, name: 'MacBook Pro', price: 1999, category: 'laptops' },
                { id: 3, name: 'AirPods Pro', price: 249, category: 'accessories' }
            ];
            
            const totalDuration = Date.now() - startTime;
            
            res.json({ 
                success: true, 
                products,
                query_time: queryDuration,
                total_time: totalDuration
            });
        } catch (error) {
            await this.analytics.trackApiError(error, req);
            res.status(500).json({ success: false, message: 'Internal server error' });
        }
    }

    // Payment Processing Endpoint
    async processPayment(req, res) {
        try {
            const { amount, currency, paymentMethod } = req.body;
            
            // Simulate external payment API call
            const paymentStart = Date.now();
            await new Promise(resolve => setTimeout(resolve, 200));
            const paymentDuration = Date.now() - paymentStart;
            
            // Track external API call
            await this.analytics.trackExternalApiCall('stripe', '/v1/charges', paymentDuration, true);
            
            // Track payment processing
            await this.analytics.trackPayment('charge', amount, currency, true);
            
            res.json({ 
                success: true, 
                transactionId: `txn_${Date.now()}`,
                amount,
                currency
            });
        } catch (error) {
            await this.analytics.trackApiError(error, req);
            res.status(500).json({ success: false, message: 'Payment failed' });
        }
    }

    // Email Sending Endpoint
    async sendEmail(req, res) {
        try {
            const { to, template, subject } = req.body;
            
            // Simulate email service call
            const emailStart = Date.now();
            await new Promise(resolve => setTimeout(resolve, 100));
            const emailDuration = Date.now() - emailStart;
            
            // Track external API call
            await this.analytics.trackExternalApiCall('sendgrid', '/v3/mail/send', emailDuration, true);
            
            // Track email sending
            await this.analytics.trackEmailSend(to, template, true);
            
            res.json({ 
                success: true, 
                messageId: `msg_${Date.now()}`,
                to,
                subject
            });
        } catch (error) {
            await this.analytics.trackApiError(error, req);
            res.status(500).json({ success: false, message: 'Email sending failed' });
        }
    }

    // File Upload Endpoint
    async uploadFile(req, res) {
        try {
            const file = req.file;
            
            if (!file) {
                res.status(400).json({ success: false, message: 'No file uploaded' });
                return;
            }
            
            // Track file operation
            await this.analytics.trackFileOperation('upload', file.mimetype, file.size, true);
            
            res.json({ 
                success: true, 
                filename: file.originalname,
                size: file.size,
                type: file.mimetype
            });
        } catch (error) {
            await this.analytics.trackApiError(error, req);
            res.status(500).json({ success: false, message: 'File upload failed' });
        }
    }

    // System Health Endpoint
    async getSystemHealth(req, res) {
        try {
            // Track memory usage
            await this.analytics.trackMemoryUsage();
            
            // Track CPU usage (simulated)
            const cpuUsage = {
                user: Math.random() * 100,
                system: Math.random() * 50
            };
            await this.analytics.trackCpuUsage(cpuUsage);
            
            res.json({ 
                success: true, 
                memory: process.memoryUsage(),
                cpu: cpuUsage,
                uptime: process.uptime()
            });
        } catch (error) {
            await this.analytics.trackApiError(error, req);
            res.status(500).json({ success: false, message: 'Health check failed' });
        }
    }

    // Database Connection Test
    async testDatabaseConnection(req, res) {
        try {
            const startTime = Date.now();
            
            // Simulate database connection
            await new Promise(resolve => setTimeout(resolve, 30));
            
            const duration = Date.now() - startTime;
            await this.analytics.trackDbConnection('connect', true);
            
            res.json({ 
                success: true, 
                connection_time: duration,
                status: 'connected'
            });
        } catch (error) {
            await this.analytics.trackDbConnection('connect', false);
            await this.analytics.trackApiError(error, req);
            res.status(500).json({ success: false, message: 'Database connection failed' });
        }
    }
}

// Express.js setup example
const express = require('express');
const app = express();

app.use(express.json());
app.use(apiTrackingMiddleware);

const api = new ExampleAPI();

// API Routes
app.post('/api/auth/login', (req, res) => api.loginUser(req, res));
app.get('/api/products', (req, res) => api.getProducts(req, res));
app.post('/api/payment/process', (req, res) => api.processPayment(req, res));
app.post('/api/email/send', (req, res) => api.sendEmail(req, res));
app.post('/api/file/upload', (req, res) => api.uploadFile(req, res));
app.get('/api/health', (req, res) => api.getSystemHealth(req, res));
app.get('/api/db/test', (req, res) => api.testDatabaseConnection(req, res));

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    await analytics.flush();
    process.exit(0);
});

// Export for testing
module.exports = { ExampleAPI, analytics };

// Start server if run directly
if (require.main === module) {
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
        console.log(`🚀 Example API server running on port ${PORT}`);
        console.log(`📊 Backend analytics enabled`);
    });
} 