// Backend Analytics Testing Script
// ================================

const { ExampleAPI, analytics } = require('./example-api');

// Mock Express request and response objects
function createMockReqRes() {
    const req = {
        method: 'GET',
        path: '/api/test',
        get: (header) => {
            const headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Content-Length': '100',
                'Content-Type': 'application/json'
            };
            return headers[header];
        },
        ip: '127.0.0.1',
        query: { category: 'smartphones' },
        body: { test: 'data' }
    };

    const res = {
        statusCode: 200,
        status: function(code) {
            this.statusCode = code;
            return this;
        },
        send: function(data) {
            this.data = data;
            return this;
        },
        json: function(data) {
            this.data = data;
            return this;
        }
    };

    return { req, res };
}

// Test functions
async function testApiTracking() {
    console.log('\n🧪 Testing API Tracking...');
    
    const { req, res } = createMockReqRes();
    req.method = 'POST';
    req.path = '/api/auth/login';
    
    const api = new ExampleAPI();
    await api.loginUser(req, res);
    
    console.log('✅ API tracking test completed');
}

async function testDatabaseTracking() {
    console.log('\n🧪 Testing Database Tracking...');
    
    const { req, res } = createMockReqRes();
    req.method = 'GET';
    req.path = '/api/products';
    
    const api = new ExampleAPI();
    await api.getProducts(req, res);
    
    console.log('✅ Database tracking test completed');
}

async function testPaymentTracking() {
    console.log('\n🧪 Testing Payment Tracking...');
    
    const { req, res } = createMockReqRes();
    req.method = 'POST';
    req.path = '/api/payment/process';
    req.body = { amount: 99.99, currency: 'USD', paymentMethod: 'card' };
    
    const api = new ExampleAPI();
    await api.processPayment(req, res);
    
    console.log('✅ Payment tracking test completed');
}

async function testEmailTracking() {
    console.log('\n🧪 Testing Email Tracking...');
    
    const { req, res } = createMockReqRes();
    req.method = 'POST';
    req.path = '/api/email/send';
    req.body = { to: 'test@example.com', template: 'welcome', subject: 'Welcome!' };
    
    const api = new ExampleAPI();
    await api.sendEmail(req, res);
    
    console.log('✅ Email tracking test completed');
}

async function testFileOperationTracking() {
    console.log('\n🧪 Testing File Operation Tracking...');
    
    const { req, res } = createMockReqRes();
    req.method = 'POST';
    req.path = '/api/file/upload';
    req.file = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024000
    };
    
    const api = new ExampleAPI();
    await api.uploadFile(req, res);
    
    console.log('✅ File operation tracking test completed');
}

async function testSystemPerformanceTracking() {
    console.log('\n🧪 Testing System Performance Tracking...');
    
    const { req, res } = createMockReqRes();
    req.method = 'GET';
    req.path = '/api/health';
    
    const api = new ExampleAPI();
    await api.getSystemHealth(req, res);
    
    console.log('✅ System performance tracking test completed');
}

async function testDatabaseConnectionTracking() {
    console.log('\n🧪 Testing Database Connection Tracking...');
    
    const { req, res } = createMockReqRes();
    req.method = 'GET';
    req.path = '/api/db/test';
    
    const api = new ExampleAPI();
    await api.testDatabaseConnection(req, res);
    
    console.log('✅ Database connection tracking test completed');
}

async function testErrorTracking() {
    console.log('\n🧪 Testing Error Tracking...');
    
    const { req, res } = createMockReqRes();
    req.method = 'POST';
    req.path = '/api/auth/login';
    req.body = {}; // Empty body to trigger error
    
    const api = new ExampleAPI();
    await api.loginUser(req, res);
    
    console.log('✅ Error tracking test completed');
}

async function testBatchProcessing() {
    console.log('\n🧪 Testing Batch Processing...');
    
    // Send multiple events quickly to test batching
    for (let i = 0; i < 8; i++) {
        await analytics.trackApiCall({
            method: 'GET',
            path: `/api/test/${i}`,
            status_code: 200,
            duration_ms: Math.random() * 100,
            timestamp: new Date().toISOString()
        });
    }
    
    console.log('✅ Batch processing test completed');
}

async function testMemoryUsage() {
    console.log('\n🧪 Testing Memory Usage Tracking...');
    
    await analytics.trackMemoryUsage();
    
    console.log('✅ Memory usage tracking test completed');
}

async function testCpuUsage() {
    console.log('\n🧪 Testing CPU Usage Tracking...');
    
    const cpuUsage = {
        user: Math.random() * 100,
        system: Math.random() * 50
    };
    
    await analytics.trackCpuUsage(cpuUsage);
    
    console.log('✅ CPU usage tracking test completed');
}

// Main test runner
async function runAllTests() {
    console.log('🚀 Starting Backend Analytics Tests...\n');
    
    try {
        await testApiTracking();
        await testDatabaseTracking();
        await testPaymentTracking();
        await testEmailTracking();
        await testFileOperationTracking();
        await testSystemPerformanceTracking();
        await testDatabaseConnectionTracking();
        await testErrorTracking();
        await testBatchProcessing();
        await testMemoryUsage();
        await testCpuUsage();
        
        console.log('\n🎉 All tests completed successfully!');
        console.log('📊 Check your Jitsu dashboard for backend events');
        
        // Flush any remaining events
        await analytics.flush();
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runAllTests().then(() => {
        console.log('\n✨ Testing completed. Exiting...');
        process.exit(0);
    }).catch(error => {
        console.error('💥 Testing failed:', error);
        process.exit(1);
    });
}

module.exports = {
    runAllTests,
    testApiTracking,
    testDatabaseTracking,
    testPaymentTracking,
    testEmailTracking,
    testFileOperationTracking,
    testSystemPerformanceTracking,
    testDatabaseConnectionTracking,
    testErrorTracking,
    testBatchProcessing,
    testMemoryUsage,
    testCpuUsage
}; 