// Backend Event Router Function for Jitsu
// This function routes backend events to different tables based on event type
// Runs on the Jitsu server side

function routeBackendEvents(event) {
    const eventType = event.event || event.event_type;
    const eventCategory = event.event_category;
    const eventAction = event.event_action;
    
    // API Events
    if (eventType === 'API Call' || 
        eventType === 'API Error' ||
        eventCategory === 'backend') {
        return { ...event, _table: 'api_events' };
    }
    
    // Database Events
    if (eventType === 'Database Query' ||
        eventType === 'Database Connection' ||
        eventAction === 'database_query' ||
        eventAction === 'database_connection') {
        return { ...event, _table: 'database_events' };
    }
    
    // Authentication Events
    if (eventType === 'User Authentication' ||
        eventAction === 'user_authentication') {
        return { ...event, _table: 'authentication_events' };
    }
    
    // Payment Events
    if (eventType === 'Payment Processing' ||
        eventAction === 'payment_processing') {
        return { ...event, _table: 'payment_events' };
    }
    
    // Email Events
    if (eventType === 'Email Sent' ||
        eventAction === 'email_sent') {
        return { ...event, _table: 'email_events' };
    }
    
    // File Operation Events
    if (eventType === 'File Operation' ||
        eventAction === 'file_operation') {
        return { ...event, _table: 'file_operation_events' };
    }
    
    // External API Events
    if (eventType === 'External API Call' ||
        eventAction === 'external_api_call') {
        return { ...event, _table: 'external_api_events' };
    }
    
    // System Performance Events
    if (eventType === 'Memory Usage' ||
        eventType === 'CPU Usage' ||
        eventAction === 'system_performance') {
        return { ...event, _table: 'system_performance_events' };
    }
    
    // Error Events
    if (eventType === 'API Error' ||
        eventType === 'Database Error' ||
        eventType === 'Authentication Error' ||
        eventType === 'Payment Error' ||
        eventType === 'Email Error' ||
        eventType === 'File Operation Error' ||
        eventType === 'External API Error' ||
        eventCategory === 'error') {
        return { ...event, _table: 'backend_error_events' };
    }
    
    // Default: route to general backend events table
    return { ...event, _table: 'backend_events' };
}

// Export for Jitsu (single function)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = routeBackendEvents;
} 