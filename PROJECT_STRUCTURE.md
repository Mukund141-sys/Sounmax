# 📁 Analytics Dashboard - Project Structure

## 🏗️ **Organized Folder Structure**

```
Analytics Dashboard/
├── 📁 frontend/                    # Frontend web pages and assets
│   ├── 📄 index.html              # Main landing page
│   ├── 📄 product.html            # Product showcase page
│   └── 📁 js/                     # Frontend JavaScript files
│       ├── 📄 analytics.js        # Frontend analytics tracking
│       ├── 📄 cart.js            # Shopping cart functionality
│       ├── 📄 products.js        # Product management
│       └── 📄 backend-analytics.js # Backend analytics module
│
├── 📁 backend/                     # Backend API server
│   ├── 📄 api-server.js          # Main API server (production)
│   ├── 📄 analytics-api.js       # Analytics-focused API
│   ├── 📄 debug-api.js           # Debug version
│   └── 📄 example-api.js         # Example implementation
│
├── 📁 analytics/                   # Jitsu analytics configuration
│   ├── 📄 jitsu-router.js        # Main event router for Jitsu
│   ├── 📄 event-router.js        # Frontend event routing
│   └── 📄 backend-event-router.js # Backend event routing
│
├── 📁 tests/                       # Test files
│   ├── 📄 test-backend-analytics.js # Comprehensive backend tests
│   ├── 📄 simple-test.js         # Simple Jitsu connection test
│   └── 📄 test-jitsu-connection.js # Jitsu connectivity tests
│
├── 📁 docs/                        # Documentation
│   ├── 📄 README.md              # Main project documentation
│   ├── 📄 backend-analytics-guide.md # Backend analytics guide
│   └── 📄 setup-multiple-tables.md # Multi-table setup guide
│
├── 📁 jitsu-setup/                # Jitsu Docker setup (existing)
├── 📁 superset/                   # Apache Superset (existing)
├── 📄 package.json               # Node.js dependencies
├── 📄 package-lock.json          # Locked dependencies
└── 📄 PROJECT_STRUCTURE.md       # This file
```

## 🚀 **Quick Start Commands**

### **Start the Backend Server:**
```bash
npm start
```

### **Development Mode:**
```bash
npm run dev
```

### **Run Tests:**
```bash
npm test                    # Full backend tests
npm run test:connection     # Simple connection test
npm run test:jitsu         # Jitsu connectivity test
```

## 📊 **Analytics Integration**

### **Frontend Events** (tracked via `frontend/js/analytics.js`):
- Page views (`index.html`, `product.html`)
- Product interactions
- Shopping cart actions
- User engagement metrics

### **Backend Events** (tracked via `frontend/js/backend-analytics.js`):
- API calls with specific names (Login API, Products API, etc.)
- Database operations
- Authentication events
- Payment processing
- System performance metrics
- Error tracking

## 🔧 **Configuration Files**

### **Jitsu Router** (`analytics/jitsu-router.js`):
- Routes frontend events to: `pages`, `Product Viewed`, `Page Engagement`, `Session Started`
- Routes backend events to: `tracks` table
- Handles event categorization and table assignment

### **Backend Analytics** (`frontend/js/backend-analytics.js`):
- Express middleware for automatic API tracking
- Event batching and sending to Jitsu
- Specific API naming (Login API, Products API, etc.)
- Performance monitoring

## 🎯 **Key Features**

1. **Dual Analytics**: Frontend + Backend tracking
2. **Specific Event Names**: Instead of generic "API Call"
3. **Organized Structure**: Clear separation of concerns
4. **Comprehensive Testing**: Multiple test scenarios
5. **Documentation**: Complete setup and usage guides

## 📈 **Event Types in Jitsu**

| Event Type | Table | Description |
|------------|-------|-------------|
| `page` | `pages` | Frontend page views |
| `Product Viewed` | `Product Viewed` | Product interactions |
| `Session Started` | `Session Started` | User sessions |
| `Login API` | `tracks` | Authentication calls |
| `Products API` | `tracks` | Product API calls |
| `Payment API` | `tracks` | Payment processing |
| `Database Query` | `tracks` | Database operations |

## 🔄 **Workflow**

1. **Frontend**: User interacts with `index.html` or `product.html`
2. **Frontend Analytics**: Events sent via `frontend/js/analytics.js`
3. **Backend**: API calls handled by `backend/api-server.js`
4. **Backend Analytics**: Events tracked via `frontend/js/backend-analytics.js`
5. **Jitsu Router**: Events routed to appropriate tables via `analytics/jitsu-router.js`
6. **Dashboard**: View analytics in Jitsu dashboard at `localhost:3000` 