// Jitsu Analytics Integration for E-commerce
// ==========================================

// Wait for Jitsu to be available
let jitsuReady = false;
let pendingEvents = [];

// Check if Jitsu is loaded
function waitForJitsu() {
    if (window.jitsu) {
        jitsuReady = true;
        console.log('✅ Jitsu Analytics Ready');
        
        // Process any pending events
        pendingEvents.forEach(event => {
            sendEvent(event.type, event.data);
        });
        pendingEvents = [];
        
        // Track initial page load
        trackPageView();
    } else {
        setTimeout(waitForJitsu, 100);
    }
}

// Start checking for Jitsu
document.addEventListener('DOMContentLoaded', waitForJitsu);

// Send event to Jitsu
function sendEvent(eventType, eventData) {
    if (!jitsuReady) {
        pendingEvents.push({ type: eventType, data: eventData });
        return;
    }

    try {
        if (eventType === 'page') {
            window.jitsu.page(eventData);
        } else if (eventType === 'identify') {
            window.jitsu.identify(eventData.userId, eventData.traits);
        } else {
            window.jitsu.track(eventType, eventData);
        }
        console.log(`📊 Tracked: ${eventType}`, eventData);
    } catch (error) {
        console.error('❌ Analytics tracking error:', error);
    }
}

// E-COMMERCE TRACKING FUNCTIONS
// =============================

// 1. Page View Tracking
function trackPageView() {
    const pageData = {
        page_title: document.title,
        page_url: window.location.href,
        page_path: window.location.pathname,
        page_referrer: document.referrer,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        screen_resolution: `${screen.width}x${screen.height}`,
        viewport_size: `${window.innerWidth}x${window.innerHeight}`
    };

    sendEvent('page', pageData);
}

// 2. Product View Tracking
function trackProductView(product) {
    const eventData = {
        event_category: 'ecommerce',
        event_action: 'product_view',
        product_id: product.id,
        product_name: product.name,
        product_category: product.category,
        product_price: product.price,
        product_brand: 'TechStore',
        currency: 'USD',
        product_rating: product.rating,
        product_reviews: product.reviews,
        in_stock: product.inStock,
        timestamp: new Date().toISOString()
    };

    sendEvent('Product Viewed', eventData);
}

// 3. Add to Cart Tracking
function trackAddToCart(product) {
    const eventData = {
        event_category: 'ecommerce',
        event_action: 'add_to_cart',
        product_id: product.id,
        product_name: product.name,
        product_category: product.category,
        product_price: product.price,
        product_brand: 'TechStore',
        currency: 'USD',
        quantity: 1,
        cart_total_items: cart.reduce((total, item) => total + item.quantity, 0) + 1,
        cart_total_value: calculateCartTotal() + product.price,
        timestamp: new Date().toISOString()
    };

    sendEvent('Product Added to Cart', eventData);
}

// 4. Remove from Cart Tracking
function trackRemoveFromCart(item) {
    const eventData = {
        event_category: 'ecommerce',
        event_action: 'remove_from_cart',
        product_id: item.id,
        product_name: item.name,
        product_price: item.price,
        quantity: item.quantity,
        removed_value: item.price * item.quantity,
        cart_total_items: cart.reduce((total, cartItem) => total + cartItem.quantity, 0),
        cart_total_value: calculateCartTotal(),
        timestamp: new Date().toISOString()
    };

    sendEvent('Product Removed from Cart', eventData);
}

// 5. Cart View Tracking
function trackCartView() {
    const cartItems = cart.map(item => ({
        product_id: item.id,
        product_name: item.name,
        product_price: item.price,
        quantity: item.quantity,
        item_total: item.price * item.quantity
    }));

    const eventData = {
        event_category: 'ecommerce',
        event_action: 'cart_view',
        cart_total_items: cart.reduce((total, item) => total + item.quantity, 0),
        cart_total_value: calculateCartTotal(),
        cart_items: cartItems,
        currency: 'USD',
        timestamp: new Date().toISOString()
    };

    sendEvent('Cart Viewed', eventData);
}

// 6. Begin Checkout Tracking
function trackBeginCheckout() {
    const cartItems = cart.map(item => ({
        product_id: item.id,
        product_name: item.name,
        product_category: getProductById(item.id)?.category || 'unknown',
        product_price: item.price,
        quantity: item.quantity,
        item_total: item.price * item.quantity
    }));

    const eventData = {
        event_category: 'ecommerce',
        event_action: 'begin_checkout',
        checkout_step: 1,
        checkout_step_name: 'initiate_checkout',
        cart_total_items: cart.reduce((total, item) => total + item.quantity, 0),
        cart_total_value: calculateCartTotal(),
        cart_items: cartItems,
        currency: 'USD',
        timestamp: new Date().toISOString()
    };

    sendEvent('Checkout Started', eventData);
}

// 7. Purchase Complete Tracking
function trackPurchase(purchaseData) {
    const purchaseItems = purchaseData.items.map(item => ({
        product_id: item.id,
        product_name: item.name,
        product_category: getProductById(item.id)?.category || 'unknown',
        product_price: item.price,
        quantity: item.quantity,
        item_total: item.price * item.quantity
    }));

    const eventData = {
        event_category: 'ecommerce',
        event_action: 'purchase',
        transaction_id: purchaseData.orderId,
        transaction_total: purchaseData.total,
        transaction_items: purchaseItems.length,
        currency: 'USD',
        payment_method: 'credit_card', // Simulated
        shipping_method: 'standard', // Simulated
        items: purchaseItems,
        timestamp: new Date().toISOString()
    };

    sendEvent('Purchase Completed', eventData);

    // Also track revenue
    trackRevenue(purchaseData);
}

// 8. Revenue Tracking
function trackRevenue(purchaseData) {
    const eventData = {
        event_category: 'ecommerce',
        event_action: 'revenue',
        revenue: purchaseData.total,
        currency: 'USD',
        transaction_id: purchaseData.orderId,
        items_count: purchaseData.items.length,
        avg_order_value: purchaseData.total,
        timestamp: new Date().toISOString()
    };

    sendEvent('Revenue Generated', eventData);
}

// USER INTERACTION TRACKING FUNCTIONS
// ===================================

// 9. Category Click Tracking
function trackCategoryClick(category) {
    const eventData = {
        event_category: 'engagement',
        event_action: 'category_click',
        category_name: category,
        section: 'featured_categories',
        timestamp: new Date().toISOString()
    };

    sendEvent('Category Clicked', eventData);
}

// 10. Hero Button Click Tracking
function trackHeroClick() {
    const eventData = {
        event_category: 'engagement',
        event_action: 'hero_cta_click',
        button_text: 'Shop Now',
        section: 'hero',
        timestamp: new Date().toISOString()
    };

    sendEvent('Hero CTA Clicked', eventData);
}

// 11. Newsletter Signup Tracking
function trackNewsletterSignup() {
    const emailInput = document.querySelector('input[type="email"]');
    const email = emailInput ? emailInput.value : '';

    const eventData = {
        event_category: 'engagement',
        event_action: 'newsletter_signup',
        has_email: !!email,
        section: 'newsletter',
        timestamp: new Date().toISOString()
    };

    sendEvent('Newsletter Signup', eventData);

    if (email) {
        // Identify user with email
        identifyUser(email);
    }
}

// 12. User Identification
function identifyUser(email, additionalTraits = {}) {
    const traits = {
        email: email,
        first_visit: new Date().toISOString(),
        source: 'ecommerce_site',
        ...additionalTraits
    };

    sendEvent('identify', {
        userId: email,
        traits: traits
    });
}

// 13. Search Tracking
function trackSearch(query, resultsCount = 0) {
    const eventData = {
        event_category: 'engagement',
        event_action: 'search',
        search_query: query,
        search_results_count: resultsCount,
        timestamp: new Date().toISOString()
    };

    sendEvent('Search Performed', eventData);
}

// 14. Session Tracking
function trackSession() {
    const sessionData = {
        event_category: 'engagement',
        event_action: 'session_start',
        session_id: generateSessionId(),
        timestamp: new Date().toISOString(),
        page_load_time: performance.now(),
        referrer: document.referrer,
        utm_source: getURLParameter('utm_source'),
        utm_medium: getURLParameter('utm_medium'),
        utm_campaign: getURLParameter('utm_campaign')
    };

    sendEvent('Session Started', sessionData);
}

// UTILITY FUNCTIONS
// =================

// Generate session ID
function generateSessionId() {
    return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Get URL parameter
function getURLParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Track page engagement time
let pageStartTime = Date.now();
let isPageVisible = true;

document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        isPageVisible = false;
        trackEngagementTime();
    } else {
        isPageVisible = true;
        pageStartTime = Date.now();
    }
});

window.addEventListener('beforeunload', function() {
    if (isPageVisible) {
        trackEngagementTime();
    }
});

function trackEngagementTime() {
    const engagementTime = Date.now() - pageStartTime;
    
    if (engagementTime > 5000) { // Only track if more than 5 seconds
        const eventData = {
            event_category: 'engagement',
            event_action: 'page_engagement',
            engagement_time_seconds: Math.round(engagementTime / 1000),
            page_url: window.location.href,
            timestamp: new Date().toISOString()
        };

        sendEvent('Page Engagement', eventData);
    }
}

// Initialize session tracking
document.addEventListener('DOMContentLoaded', function() {
    trackSession();
});

// Error tracking
window.addEventListener('error', function(e) {
    const eventData = {
        event_category: 'error',
        event_action: 'javascript_error',
        error_message: e.message,
        error_filename: e.filename,
        error_line: e.lineno,
        error_column: e.colno,
        page_url: window.location.href,
        timestamp: new Date().toISOString()
    };

    sendEvent('JavaScript Error', eventData);
});

console.log('🚀 Jitsu E-commerce Analytics Initialized'); 