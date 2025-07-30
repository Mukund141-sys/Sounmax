// Backend Analytics Module for Jitsu Integration
// Sends backend events to Jitsu while preserving existing frontend setup

class BackendAnalytics {
    constructor(config = {}) {
        this.jitsuUrl = config.jitsuUrl || 'http://localhost:8080';
        this.writeKey = config.writeKey || 'QenKIfVBZJQc4Qg0WeZmWCbEnJHlPDAx:UsUuswtbG4wRsAhGZU3Etu4nu9frfCb6';
        this.enabled = config.enabled !== false;
        this.batchSize = config.batchSize || 10;
        this.batchTimeout = config.batchTimeout || 5000;
        this.eventQueue = [];
        this.batchTimer = null;
    }

    // Send event to Jitsu
    async sendEvent(event) {
        if (!this.enabled) {
            console.log('📊 Analytics disabled:', event);
            return;
        }

        try {
            const response = await fetch(`${this.jitsuUrl}/api/v1/events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Write-Key': this.writeKey
                },
                body: JSON.stringify(event)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            console.log('✅ Event sent to Jitsu:', event.event);
        } catch (error) {
            console.error('❌ Failed to send event to Jitsu:', error.message);
        }
    }

    // Track API calls with specific names
    async trackApiCall(data) {
        // Determine specific API name based on path
        let apiName = 'API Call';
        if (data.path) {
            if (data.path.includes('/auth/login')) {
                apiName = 'Login API';
            } else if (data.path.includes('/products')) {
                apiName = 'Products API';
            } else if (data.path.includes('/payment')) {
                apiName = 'Payment API';
            } else if (data.path.includes('/system/performance')) {
                apiName = 'Performance API';
            } else if (data.path.includes('/health')) {
                apiName = 'Health Check API';
            } else {
                apiName = `${data.method} ${data.path}`;
            }
        }

        const event = {
            event: apiName,
            event_category: 'backend',
            event_action: 'api_request',
            event_type: 'api_call',
            ...data,
            timestamp: new Date().toISOString()
        };

        await this.sendEvent(event);
    }

    // Track authentication events
    async trackAuthentication(data) {
        const event = {
            event: 'User Authentication',
            event_category: 'backend',
            event_action: 'user_login',
            event_type: 'api_call',
            ...data,
            timestamp: new Date().toISOString()
        };

        await this.sendEvent(event);
    }

    // Track payment events
    async trackPayment(data) {
        const event = {
            event: 'Payment Processing',
            event_category: 'backend',
            event_action: 'payment_charge',
            event_type: 'api_call',
            ...data,
            timestamp: new Date().toISOString()
        };

        await this.sendEvent(event);
    }

    // Track database events
    async trackDatabaseEvent(data) {
        const event = {
            event: 'Database Query',
            event_category: 'backend',
            event_action: 'database_operation',
            event_type: 'api_call',
            ...data,
            timestamp: new Date().toISOString()
        };

        await this.sendEvent(event);
    }

    // Track error events
    async trackError(data) {
        const event = {
            event: 'API Error',
            event_category: 'error',
            event_action: 'backend_error',
            event_type: 'api_call',
            ...data,
            timestamp: new Date().toISOString()
        };

        await this.sendEvent(event);
    }

    // Track system performance
    async trackSystemPerformance(data) {
        const event = {
            event: 'System Performance',
            event_category: 'backend',
            event_action: 'performance_metric',
            event_type: 'api_call',
            ...data,
            timestamp: new Date().toISOString()
        };

        await this.sendEvent(event);
    }

    // Express middleware for automatic API tracking
    apiTrackingMiddleware() {
        const self = this; // Store reference to this instance
        return async (req, res, next) => {
            const startTime = Date.now();
            
            // Store original methods
            const originalSend = res.send;
            const originalJson = res.json;
            
            // Override res.send
            res.send = function(data) {
                const duration = Date.now() - startTime;
                
                // Use self reference to access the analytics instance
                self.trackApiCall({
                    method: req.method,
                    path: req.path,
                    status_code: res.statusCode,
                    duration_ms: duration,
                    user_agent: req.get('User-Agent'),
                    ip_address: req.ip,
                    query_params: Object.keys(req.query).length > 0 ? req.query : null,
                    request_body_size: req.get('Content-Length') || 0,
                    response_body_size: typeof data === 'string' ? data.length : JSON.stringify(data).length
                });

                return originalSend.call(res, data);
            };

            // Override res.json
            res.json = function(data) {
                const duration = Date.now() - startTime;
                
                // Use self reference to access the analytics instance
                self.trackApiCall({
                    method: req.method,
                    path: req.path,
                    status_code: res.statusCode,
                    duration_ms: duration,
                    user_agent: req.get('User-Agent'),
                    ip_address: req.ip,
                    query_params: Object.keys(req.query).length > 0 ? req.query : null,
                    request_body_size: req.get('Content-Length') || 0,
                    response_body_size: JSON.stringify(data).length
                });

                return originalJson.call(res, data);
            };

            next();
        };
    }
}

module.exports = BackendAnalytics; 