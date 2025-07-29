// Jitsu Event Router Function
// This function automatically routes events to different tables based on event type
// No changes needed to your website - this runs on the Jitsu server side

function pageViewsRouter(event) {
    const eventType = event.event || event.event_type;
    
    if (eventType === 'page' || eventType === 'Page Viewed') {
        return { ...event, _table: 'page_views' };
    }
    return null; // Don't process other events
}

function productEventsRouter(event) {
    const eventType = event.event || event.event_type;
    
    if (eventType === 'Product Viewed' || 
        eventType === 'Product Added to Cart' ||
        eventType === 'Product Removed from Cart' ||
        eventType === 'Product Image Changed' ||
        eventType === 'Product Color Selected' ||
        eventType === 'Product Storage Selected' ||
        eventType === 'Product Added to Wishlist' ||
        eventType === 'Product Shared' ||
        eventType === 'Buy Now Clicked') {
        return { ...event, _table: 'product_events' };
    }
    return null;
}

function ecommerceEventsRouter(event) {
    const eventType = event.event || event.event_type;
    const eventCategory = event.event_category;
    
    if (eventType === 'Cart Viewed' ||
        eventType === 'Checkout Started' ||
        eventType === 'Purchase Completed' ||
        eventType === 'Revenue Generated' ||
        eventCategory === 'ecommerce') {
        return { ...event, _table: 'ecommerce_events' };
    }
    return null;
}

function userEngagementRouter(event) {
    const eventType = event.event || event.event_type;
    const eventCategory = event.event_category;
    
    if (eventType === 'Category Clicked' ||
        eventType === 'Hero CTA Clicked' ||
        eventType === 'Newsletter Signup' ||
        eventType === 'Search Performed' ||
        eventType === 'Session Started' ||
        eventType === 'Page Engagement' ||
        eventCategory === 'engagement') {
        return { ...event, _table: 'user_engagement_events' };
    }
    return null;
}

function errorEventsRouter(event) {
    const eventType = event.event || event.event_type;
    const eventCategory = event.event_category;
    
    if (eventType === 'JavaScript Error' ||
        eventCategory === 'error') {
        return { ...event, _table: 'error_events' };
    }
    return null;
}

// Export for Jitsu
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        pageViewsRouter,
        productEventsRouter,
        ecommerceEventsRouter,
        userEngagementRouter,
        errorEventsRouter
    };
} 