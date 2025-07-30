// Test Jitsu Connection
// ====================

const fetch = require('node-fetch');

async function testJitsuConnection() {
    const jitsuUrl = 'http://localhost:8080';
    const writeKey = 'QenKIfVBZJQc4Qg0WeZmWCbEnJHlPDAx:UsUuswtbG4wRsAhGZU3Etu4nu9frfCb6';
    
    const testEvent = {
        event: 'Test Event',
        event_category: 'test',
        event_action: 'connection_test',
        timestamp: new Date().toISOString(),
        test_data: 'This is a test event'
    };
    
    try {
        console.log('🔍 Testing Jitsu connection...');
        console.log('📤 Sending test event:', testEvent);
        
        const response = await fetch(`${jitsuUrl}/api/v1/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${writeKey}`
            },
            body: JSON.stringify(testEvent)
        });
        
        console.log('📊 Response status:', response.status);
        console.log('📊 Response headers:', response.headers);
        
        if (response.ok) {
            const responseText = await response.text();
            console.log('✅ Success! Response:', responseText);
        } else {
            console.log('❌ Error! Status:', response.status);
            const errorText = await response.text();
            console.log('❌ Error details:', errorText);
        }
    } catch (error) {
        console.error('💥 Connection failed:', error.message);
    }
}

testJitsuConnection(); 