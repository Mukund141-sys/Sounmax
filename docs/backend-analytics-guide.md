# Backend Analytics Integration Guide

## Overview

This guide explains how to integrate backend event tracking into your existing applications using Jitsu analytics. The setup includes tracking for APIs, databases, authentication, payments, emails, file operations, and system performance.

## What's Included

### 1. Backend Analytics Module (`js/backend-analytics.js`)
- **API Tracking**: Monitor all API requests, responses, and errors
- **Database Tracking**: Track queries, connections, and performance
- **Authentication Tracking**: Monitor user login/logout events
- **Payment Tracking**: Track payment processing and transactions
- **Email Tracking**: Monitor email sending and delivery
- **File Operations**: Track file uploads, downloads, and processing
- **External API Calls**: Monitor third-party service integrations
- **System Performance**: Track memory and CPU usage

### 2. Event Routing (`backend-event-router.js`)
Organizes backend events into separate tables:
- `api_events` - API calls and errors
- `database_events` - Database operations
- `authentication_events` - User authentication
- `payment_events` - Payment processing
- `email_events` - Email operations
- `file_operation_events` - File operations
- `external_api_events` - Third-party API calls
- `system_performance_events` - System metrics
- `backend_error_events` - All backend errors

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Example API Server
```bash
npm start
```

### 3. Run Tests
```bash
npm test
```

## Integration Steps

### Step 1: Initialize Backend Analytics

```javascript
const BackendAnalytics = require('./js/backend-analytics');

const analytics = new BackendAnalytics({
    jitsuUrl: 'http://localhost:8080',
    writeKey: 'YOUR_JITSU_WRITE_KEY',
    enabled: true,
    batchSize: 10,
    batchTimeout: 5000
});
```

### Step 2: Add API Tracking Middleware

```javascript
const express = require('express');
const app = express();

// API tracking middleware
app.use(async (req, res, next) => {
    await analytics.trackApiRequest(req, res, next);
});
```

### Step 3: Track Business Logic Events

```javascript
// Authentication
await analytics.trackUserAuth('login', userId, success);

// Database operations
await analytics.trackDbQuery(query, duration, success);

// Payment processing
await analytics.trackPayment('charge', amount, currency, success);

// Email sending
await analytics.trackEmailSend(to, template, success);

// File operations
await analytics.trackFileOperation('upload', fileType, fileSize, success);

// External API calls
await analytics.trackExternalApiCall('stripe', '/v1/charges', duration, success);
```

### Step 4: Error Handling

```javascript
try {
    // Your API logic
} catch (error) {
    await analytics.trackApiError(error, req);
    res.status(500).json({ error: 'Internal server error' });
}
```

## Event Types and Data

### API Events
```javascript
{
    event: 'API Call',
    event_category: 'backend',
    event_action: 'api_request',
    method: 'POST',
    path: '/api/auth/login',
    status_code: 200,
    duration_ms: 150,
    user_agent: 'Mozilla/5.0...',
    ip_address: '127.0.0.1',
    timestamp: '2024-01-15T10:30:00.000Z'
}
```

### Database Events
```javascript
{
    event: 'Database Query',
    event_category: 'backend',
    event_action: 'database_query',
    query_type: 'SELECT',
    query_duration_ms: 45,
    query_success: true,
    timestamp: '2024-01-15T10:30:00.000Z'
}
```

### Authentication Events
```javascript
{
    event: 'User Authentication',
    event_category: 'backend',
    event_action: 'user_authentication',
    auth_action: 'login',
    user_id: 'user_123',
    auth_success: true,
    timestamp: '2024-01-15T10:30:00.000Z'
}
```

### Payment Events
```javascript
{
    event: 'Payment Processing',
    event_category: 'backend',
    event_action: 'payment_processing',
    payment_action: 'charge',
    payment_amount: 99.99,
    payment_currency: 'USD',
    payment_success: true,
    timestamp: '2024-01-15T10:30:00.000Z'
}
```

## Advanced Configuration

### Custom Event Tracking
```javascript
// Track custom business events
await analytics.sendEvent('Custom Event', {
    event_category: 'business',
    event_action: 'custom_action',
    custom_field: 'custom_value',
    timestamp: new Date().toISOString()
});
```

### Batch Processing
```javascript
// Configure batch settings
const analytics = new BackendAnalytics({
    batchSize: 20,        // Send events in batches of 20
    batchTimeout: 10000,  // Or after 10 seconds
    enabled: true
});
```

### Environment-Specific Configuration
```javascript
const analytics = new BackendAnalytics({
    jitsuUrl: process.env.JITSU_URL || 'http://localhost:8080',
    writeKey: process.env.JITSU_WRITE_KEY,
    enabled: process.env.NODE_ENV === 'production',
    batchSize: process.env.ANALYTICS_BATCH_SIZE || 10
});
```

## Monitoring and Debugging

### Enable Debug Logging
```javascript
const analytics = new BackendAnalytics({
    debug: true,  // Enable console logging
    // ... other config
});
```

### Manual Event Flushing
```javascript
// Force flush pending events
await analytics.flush();
```

### Error Handling
```javascript
// Handle analytics errors
analytics.on('error', (error) => {
    console.error('Analytics error:', error);
    // Send to your error tracking service
});
```

## Integration with Existing Applications

### Express.js Integration
```javascript
const express = require('express');
const BackendAnalytics = require('./js/backend-analytics');

const app = express();
const analytics = new BackendAnalytics();

// Global middleware
app.use(async (req, res, next) => {
    await analytics.trackApiRequest(req, res, next);
});

// Route-specific tracking
app.post('/api/payment', async (req, res) => {
    try {
        const result = await processPayment(req.body);
        await analytics.trackPayment('charge', req.body.amount, 'USD', true);
        res.json(result);
    } catch (error) {
        await analytics.trackPayment('charge', req.body.amount, 'USD', false);
        await analytics.trackApiError(error, req);
        res.status(500).json({ error: 'Payment failed' });
    }
});
```

### Next.js Integration
```javascript
// pages/api/auth/login.js
import BackendAnalytics from '../../../js/backend-analytics';

const analytics = new BackendAnalytics();

export default async function handler(req, res) {
    try {
        const { email, password } = req.body;
        
        // Your authentication logic
        const user = await authenticateUser(email, password);
        
        await analytics.trackUserAuth('login', user.id, true);
        
        res.json({ success: true, user });
    } catch (error) {
        await analytics.trackUserAuth('login', null, false);
        await analytics.trackApiError(error, req);
        res.status(401).json({ error: 'Authentication failed' });
    }
}
```

### Database Integration (with PostgreSQL)
```javascript
const { Pool } = require('pg');
const BackendAnalytics = require('./js/backend-analytics');

const pool = new Pool();
const analytics = new BackendAnalytics();

// Wrap database queries with analytics
async function queryWithAnalytics(text, params) {
    const startTime = Date.now();
    
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - startTime;
        
        await analytics.trackDbQuery(text, duration, true);
        return result;
    } catch (error) {
        const duration = Date.now() - startTime;
        await analytics.trackDbQuery(text, duration, false);
        throw error;
    }
}
```

## Testing Your Integration

### 1. Run the Test Suite
```bash
npm test
```

### 2. Manual Testing
```bash
# Start the example API
npm start

# Test endpoints
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

curl http://localhost:3001/api/products

curl -X POST http://localhost:3001/api/payment/process \
  -H "Content-Type: application/json" \
  -d '{"amount":99.99,"currency":"USD"}'
```

### 3. Check Jitsu Dashboard
- Open your Jitsu dashboard
- Look for the new backend event tables
- Verify events are being tracked correctly

## Best Practices

### 1. Performance Considerations
- Use batch processing to reduce network calls
- Don't block your main application with analytics calls
- Handle analytics errors gracefully

### 2. Privacy and Security
- Don't log sensitive data (passwords, tokens)
- Use environment variables for configuration
- Consider data retention policies

### 3. Monitoring
- Set up alerts for high error rates
- Monitor API response times
- Track system resource usage

### 4. Data Quality
- Use consistent event naming
- Include relevant context in events
- Validate data before sending

## Troubleshooting

### Common Issues

1. **Events not appearing in Jitsu**
   - Check your write key
   - Verify Jitsu server is running
   - Check network connectivity

2. **High memory usage**
   - Reduce batch size
   - Increase batch timeout
   - Check for memory leaks

3. **Slow API responses**
   - Analytics calls should be non-blocking
   - Use async/await properly
   - Consider using a queue system

### Debug Mode
```javascript
const analytics = new BackendAnalytics({
    debug: true,
    // ... other config
});
```

This will log all events to the console for debugging.

## Next Steps

1. **Customize Events**: Add your own business-specific events
2. **Set Up Dashboards**: Create visualizations in Jitsu
3. **Add Alerts**: Set up monitoring for critical events
4. **Scale**: Consider using a message queue for high-volume applications

## Support

For issues or questions:
1. Check the Jitsu documentation
2. Review the example code
3. Run the test suite to verify your setup
4. Check the console for error messages 