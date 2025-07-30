// Jitsu Event Router Function
// Routes both frontend and backend events to appropriate tables
// This function runs on the Jitsu server side

function routeEvents(event) {
    const eventType = event.event || event.event_type;
    const eventCategory = event.event_category;
    const eventAction = event.event_action;
    
    // FRONTEND EVENTS
    // ===============
    
    // Page Views
    if (eventType === 'page' || eventType === 'Page Viewed') {
        return { ...event, _table: 'pages' };
    }
    
    // Product Events
    if (eventType === 'Product Viewed' || 
        eventType === 'Product Added to Cart' ||
        eventType === 'Product Removed from Cart' ||
        eventType === 'Product Image Changed' ||
        eventType === 'Product Color Selected' ||
        eventType === 'Product Storage Selected' ||
        eventType === 'Product Added to Wishlist' ||
        eventType === 'Product Shared' ||
        eventType === 'Buy Now Clicked') {
        return { ...event, _table: 'Product Viewed' };
    }
    
    // User Engagement
    if (eventType === 'Category Clicked' ||
        eventType === 'Hero CTA Clicked' ||
        eventType === 'Newsletter Signup' ||
        eventType === 'Search Performed' ||
        eventType === 'Session Started' ||
        eventType === 'Page Engagement') {
        return { ...event, _table: 'Page Engagement' };
    }
    
    // Session Events
    if (eventType === 'Session Started') {
        return { ...event, _table: 'Session Started' };
    }
    
    // BACKEND EVENTS
    // ==============
    
    // API Calls
    if (eventType === 'API Call' || 
        eventCategory === 'backend') {
        return { ...event, _table: 'tracks' };
    }
    
    // Authentication Events
    if (eventType === 'User Authentication' ||
        eventAction === 'user_login') {
        return { ...event, _table: 'tracks' };
    }
    
    // Payment Events
    if (eventType === 'Payment Processing' ||
        eventAction === 'payment_charge') {
        return { ...event, _table: 'tracks' };
    }
    
    // Database Events
    if (eventType === 'Database Query' ||
        eventAction === 'database_operation') {
        return { ...event, _table: 'tracks' };
    }
    
    // System Performance
    if (eventType === 'System Performance' ||
        eventAction === 'performance_metric') {
        return { ...event, _table: 'tracks' };
    }
    
    // Error Events
    if (eventType === 'API Error' ||
        eventCategory === 'error') {
        return { ...event, _table: 'tracks' };
    }
    
    // Default: route to tracks table
    return { ...event, _table: 'tracks' };
}

// Export for Jitsu
if (typeof module !== 'undefined' && module.exports) {
    module.exports = routeEvents;
} 