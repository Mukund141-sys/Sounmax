# API Testing Dashboard Guide

## Overview

The API Testing Dashboard allows you to test backend APIs directly from the website and track analytics events in real-time. This is perfect for testing the integration between your website and backend services while monitoring analytics events.

## Features

### 🔧 **Backend API Tests**
- **Authentication API**: Test login functionality with email/password
- **Products API**: Fetch product listings
- **Payment API**: Process payments with amount and currency
- **System Performance API**: Get server performance metrics
- **Health Check API**: Verify backend server status

### 📊 **Real-time Monitoring**
- **API Response Display**: See actual API responses
- **Analytics Events**: Track events sent to Jitsu
- **Status Indicators**: Monitor backend and Jitsu connectivity
- **Batch Testing**: Run all tests sequentially

## How to Use

### 1. **Start the Backend Server**
```bash
# Navigate to the backend directory
cd backend

# Start the API server
node api-server.js
```

The server will start on `http://localhost:3001`

### 2. **Start Jitsu (if not already running)**
```bash
# Navigate to jitsu-setup directory
cd jitsu-setup

# Start Jitsu using Docker
docker-compose up -d
```

Jitsu will be available at `http://localhost:8080`

### 3. **Open the Website**
Open `frontend/index.html` in your browser and navigate to the "API Testing" section.

### 4. **Test Individual APIs**

#### Authentication API
1. Enter email and password (or use defaults)
2. Click "Test Login API"
3. Check the response and analytics events

#### Products API
1. Click "Get Products"
2. View the product list response
3. Monitor analytics tracking

#### Payment API
1. Enter amount and select currency
2. Click "Test Payment API"
3. See transaction details and analytics

#### System Performance API
1. Click "Get System Performance"
2. View memory usage and uptime
3. Track performance metrics

#### Health Check API
1. Click "Health Check"
2. Verify backend status
3. Monitor connectivity

### 5. **Batch Testing**
Click "Run All API Tests" to execute all tests sequentially with delays between them.

## Analytics Events Tracked

### Frontend Events (Website → Jitsu)
- `API Test - Login`: Login attempts with success status
- `API Test - Products`: Product API calls with count
- `API Test - Payment`: Payment processing with amount/currency
- `API Test - Performance`: System metrics tracking
- `API Test - Health`: Health check status

### Backend Events (Server → Jitsu)
- `Login API`: Authentication attempts
- `Products API`: Database queries for products
- `Payment API`: Payment processing events
- `System Performance`: Memory and performance metrics
- `Health Check`: Server status monitoring

## Status Indicators

### Backend Status
- **Online (Green)**: Backend server is responding
- **Offline (Red)**: Backend server is unreachable
- **Error (Red)**: Backend server returned error status

### Jitsu Status
- **Connected (Green)**: Jitsu analytics is ready
- **Disconnected (Red)**: Jitsu analytics is not available

## Testing Scenarios

### 1. **Basic Functionality Test**
1. Start backend server
2. Open website
3. Navigate to API Testing
4. Click "Check Backend Status"
5. Verify both status indicators are green

### 2. **Analytics Integration Test**
1. Ensure Jitsu is running
2. Test any API endpoint
3. Check "Analytics Events" panel
4. Verify events are being tracked

### 3. **Error Handling Test**
1. Stop the backend server
2. Try to test any API
3. Verify error messages appear
4. Check status indicators turn red

### 4. **Batch Testing**
1. Start all services
2. Click "Run All API Tests"
3. Monitor all responses
4. Check analytics events for all tests

## Troubleshooting

### Backend Server Issues
```bash
# Check if port 3001 is in use
netstat -an | grep 3001

# Kill process if needed
kill -9 <PID>

# Restart server
node backend/api-server.js
```

### Jitsu Connection Issues
```bash
# Check Jitsu container status
docker ps | grep jitsu

# Restart Jitsu
docker-compose restart
```

### CORS Issues
If you see CORS errors, ensure the backend server includes proper CORS headers:

```javascript
// In api-server.js
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
```

## Expected Analytics Events

When testing APIs, you should see events like:

```json
{
  "event": "API Test - Login",
  "api_endpoint": "/api/auth/login",
  "success": true,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

```json
{
  "event": "Login API",
  "event_category": "backend",
  "event_action": "user_login",
  "success": true,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Integration with Real Applications

This testing setup mirrors real-world scenarios where:

1. **Website triggers API calls** → Frontend analytics track user interactions
2. **Backend processes requests** → Backend analytics track server operations
3. **Both send events to Jitsu** → Unified analytics dashboard

This allows you to:
- Test API functionality
- Monitor analytics integration
- Debug event tracking
- Verify end-to-end workflows

## Next Steps

1. **Customize APIs**: Add your own API endpoints
2. **Extend Analytics**: Add more event tracking
3. **Add Authentication**: Implement real user authentication
4. **Database Integration**: Connect to real databases
5. **Production Deployment**: Deploy to production environment 