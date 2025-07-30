// Simple Backend API Test
// =======================

const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3001';

async function testBackendAPIs() {
    console.log('🧪 Testing Backend APIs...\n');
    
    const tests = [
        {
            name: 'Health Check',
            method: 'GET',
            endpoint: '/api/health',
            body: null
        },
        {
            name: 'Products API',
            method: 'GET',
            endpoint: '/api/products',
            body: null
        },
        {
            name: 'Login API',
            method: 'POST',
            endpoint: '/api/auth/login',
            body: { email: 'test@example.com', password: 'password123' }
        },
        {
            name: 'Payment API',
            method: 'POST',
            endpoint: '/api/payment/process',
            body: { amount: 99.99, currency: 'USD' }
        },
        {
            name: 'Performance API',
            method: 'GET',
            endpoint: '/api/system/performance',
            body: null
        }
    ];
    
    for (const test of tests) {
        try {
            console.log(`📡 Testing: ${test.name}`);
            
            const options = {
                method: test.method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            
            if (test.body) {
                options.body = JSON.stringify(test.body);
            }
            
            const response = await fetch(`${API_BASE_URL}${test.endpoint}`, options);
            const data = await response.json();
            
            if (data.success) {
                console.log(`✅ ${test.name}: SUCCESS`);
                console.log(`   Response:`, data);
            } else {
                console.log(`❌ ${test.name}: FAILED`);
                console.log(`   Error:`, data);
            }
            
        } catch (error) {
            console.log(`💥 ${test.name}: ERROR`);
            console.log(`   Error:`, error.message);
        }
        
        console.log(''); // Empty line for readability
    }
    
    console.log('🎉 Backend API testing completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
    testBackendAPIs().then(() => {
        console.log('\n✨ Testing completed. Exiting...');
        process.exit(0);
    }).catch(error => {
        console.error('💥 Testing failed:', error);
        process.exit(1);
    });
}

module.exports = { testBackendAPIs }; 