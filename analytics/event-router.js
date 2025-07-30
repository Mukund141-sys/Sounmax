// Jitsu Event Router Function
// This function automatically routes events to different tables based on event type
// No changes needed to your website - this runs on the Jitsu server side

function routeFrontendEvents(event) {
    const eventType = event.event || event.event_type;
    const eventCategory = event.event_category;
    
    // Page Views
    if (eventType === 'page' || eventType === 'Page Viewed') {
        return { ...event, _table: 'page_views' };
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
        return { ...event, _table: 'product_events' };
    }
    
    // Ecommerce Events
    if (eventType === 'Cart Viewed' ||
        eventType === 'Checkout Started' ||
        eventType === 'Purchase Completed' ||
        eventType === 'Revenue Generated' ||
        eventCategory === 'ecommerce') {
        return { ...event, _table: 'ecommerce_events' };
    }
    
    // User Engagement Events
    if (eventType === 'Category Clicked' ||
        eventType === 'Hero CTA Clicked' ||
        eventType === 'Newsletter Signup' ||
        eventType === 'Search Performed' ||
        eventType === 'Session Started' ||
        eventType === 'Page Engagement' ||
        eventCategory === 'engagement') {
        return { ...event, _table: 'user_engagement_events' };
    }
    
    // Error Events
    if (eventType === 'JavaScript Error' ||
        eventCategory === 'error') {
        return { ...event, _table: 'error_events' };
    }
    
    // Default: route to general events table
    return { ...event, _table: 'general_events' };
}

// Export for Jitsu (single function)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = routeFrontendEvents;
} 