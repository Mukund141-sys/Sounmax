# 🛒 TechStore - E-commerce Website with Jitsu Analytics

A modern, fully-featured e-commerce website with comprehensive **Jitsu Analytics** tracking integration. This project demonstrates how to implement complete e-commerce analytics tracking including page views, product interactions, cart operations, and purchase tracking.

## 🎯 **Features**

### **Website Features**
- ✅ Modern responsive design using Tailwind CSS
- ✅ Product catalog with real product data
- ✅ Interactive shopping cart with localStorage persistence
- ✅ Product detail pages with variants (color/storage)
- ✅ Checkout simulation with order generation
- ✅ User engagement features (wishlist, sharing, newsletter)

### **Analytics Tracking Features**
- 📊 **Page View Tracking** - Complete page analytics with metadata
- 🏷️ **Product View Tracking** - Track product impressions and details
- 🛒 **E-commerce Events** - Add to cart, remove from cart, purchases
- 🛍️ **Shopping Cart Analytics** - Cart views, modifications, abandonment
- 💰 **Revenue Tracking** - Complete purchase and revenue analytics
- 👤 **User Identification** - Email capture and user trait tracking
- 🎯 **Engagement Tracking** - Button clicks, form submissions, time on page
- ⚡ **Real-time Analytics** - Instant event tracking with Jitsu
- 🔍 **Search Analytics** - Search queries and results tracking
- 📱 **Session Analytics** - Session tracking with referrer data

## 🗂️ **Project Structure**

```
ecommerce-site/
├── index.html              # Homepage with product catalog
├── product.html             # Product detail page
├── README.md               # This documentation
└── js/
    ├── products.js         # Product data and rendering
    ├── cart.js            # Shopping cart functionality
    └── analytics.js       # Jitsu analytics integration
```

## 🚀 **Getting Started**

### **Prerequisites**
- Jitsu server running on `localhost:8080` (ingest)
- Jitsu console running on `localhost:3000` (management)
- Modern web browser with JavaScript enabled

### **Installation**
1. **Clone or download this e-commerce site**
2. **Open `index.html` in your web browser**
3. **Start browsing and see analytics in Jitsu console!**

### **Testing the Analytics**
1. **Open your browser's Developer Tools (F12)**
2. **Go to Console tab to see analytics logs**
3. **Navigate through the website and perform actions**
4. **Check Jitsu console for incoming events**

## 📊 **Analytics Events Tracked**

### **E-commerce Events**
| Event | Description | Triggered When |
|-------|-------------|----------------|
| `Page Viewed` | Page view with metadata | Page loads |
| `Product Viewed` | Product detail view | Click on product |
| `Product Added to Cart` | Add to cart action | Click "Add to Cart" |
| `Product Removed from Cart` | Remove from cart | Remove item from cart |
| `Cart Viewed` | Shopping cart opened | Click cart icon |
| `Checkout Started` | Begin checkout process | Click "Proceed to Checkout" |
| `Purchase Completed` | Successful purchase | Complete checkout |
| `Revenue Generated` | Revenue tracking | After purchase |

### **Engagement Events**
| Event | Description | Triggered When |
|-------|-------------|----------------|
| `Category Clicked` | Category selection | Click category button |
| `Hero CTA Clicked` | Hero button click | Click "Shop Now" |
| `Newsletter Signup` | Email subscription | Submit newsletter form |
| `Search Performed` | Product search | Search products |
| `Session Started` | Session initiation | Page load |
| `Page Engagement` | Time on page | Page visibility change |

### **Product Interaction Events**
| Event | Description | Triggered When |
|-------|-------------|----------------|
| `Product Image Changed` | Image gallery interaction | Click thumbnail |
| `Product Color Selected` | Color variant selection | Select color option |
| `Product Storage Selected` | Storage variant selection | Select storage option |
| `Product Added to Wishlist` | Wishlist addition | Click wishlist button |
| `Product Shared` | Social sharing | Click share button |
| `Buy Now Clicked` | Immediate purchase intent | Click "Buy Now" |

## 🎨 **Key Analytics Features**

### **1. Comprehensive E-commerce Tracking**
```javascript
// Example: Add to Cart Event
{
  event_category: 'ecommerce',
  event_action: 'add_to_cart',
  product_id: 1,
  product_name: 'iPhone 15 Pro',
  product_category: 'smartphones',
  product_price: 999,
  currency: 'USD',
  quantity: 1,
  cart_total_value: 1247,
  timestamp: '2024-01-15T10:30:00.000Z'
}
```

### **2. Revenue and Purchase Tracking**
```javascript
// Example: Purchase Complete Event
{
  event_category: 'ecommerce',
  event_action: 'purchase',
  transaction_id: 'ORD-1642248600000-ABC123XYZ',
  transaction_total: 1247,
  currency: 'USD',
  items: [
    {
      product_id: 1,
      product_name: 'iPhone 15 Pro',
      quantity: 1,
      item_total: 999
    }
  ]
}
```

### **3. User Identification**
```javascript
// Example: User Identification
jitsu.identify('user@example.com', {
  email: 'user@example.com',
  first_visit: '2024-01-15T10:30:00.000Z',
  source: 'ecommerce_site'
});
```

### **4. Session and Engagement Tracking**
```javascript
// Example: Session Tracking
{
  event_category: 'engagement',
  event_action: 'session_start',
  session_id: 'sess_1642248600000_abc123xyz',
  referrer: 'https://google.com',
  utm_source: 'google',
  utm_medium: 'cpc'
}
```

## 🛠️ **Customization**

### **Adding New Products**
Edit `js/products.js` and add new product objects:
```javascript
{
  id: 9,
  name: "Your Product",
  price: 299,
  image: "product-image-url",
  category: "category",
  description: "Product description",
  inStock: true,
  rating: 4.5,
  reviews: 123
}
```

### **Customizing Analytics Events**
Edit `js/analytics.js` to add new tracking events:
```javascript
function trackCustomEvent(data) {
  sendEvent('Custom Event', {
    event_category: 'custom',
    event_action: 'custom_action',
    ...data,
    timestamp: new Date().toISOString()
  });
}
```

### **Modifying Jitsu Configuration**
Update the Jitsu script tag in HTML files:
```html
<script async src="http://your-jitsu-host/p.js" 
        data-write-key="your-write-key"></script>
```

## 🧪 **Testing Guide**

### **1. Basic Functionality Test**
1. ✅ Load homepage - check product display
2. ✅ Add products to cart - verify cart updates
3. ✅ Modify cart quantities - test cart operations
4. ✅ Complete checkout - test purchase flow

### **2. Analytics Verification**
1. ✅ Open browser DevTools console
2. ✅ Look for "📊 Tracked:" messages
3. ✅ Check Jitsu console for incoming events
4. ✅ Verify event data completeness

### **3. E-commerce Flow Test**
```
Homepage → Product View → Add to Cart → Cart View → Checkout → Purchase
    ↓           ↓             ↓           ↓          ↓         ↓
Page View → Product → Add to Cart → Cart View → Begin → Purchase
           Viewed     Event       Event      Checkout  Complete
```

## 📈 **Analytics Dashboard**

### **Key Metrics to Monitor**
- **Page Views** - Traffic and popular pages
- **Product Views** - Product interest and performance
- **Cart Operations** - Add/remove patterns
- **Conversion Rate** - Views to purchases
- **Revenue** - Total sales and order values
- **User Engagement** - Time on site, interactions
- **Traffic Sources** - Referrers and campaigns

### **Sample Analytics Queries**
```sql
-- Top Products by Views
SELECT product_name, COUNT(*) as views
FROM events 
WHERE event = 'Product Viewed'
GROUP BY product_name
ORDER BY views DESC;

-- Revenue by Day
SELECT DATE(timestamp) as date, SUM(transaction_total) as revenue
FROM events 
WHERE event = 'Purchase Completed'
GROUP BY DATE(timestamp);

-- Cart Abandonment Rate
SELECT 
  cart_views,
  checkouts_started,
  purchases,
  (purchases / cart_views * 100) as conversion_rate
FROM analytics_summary;
```

## 🔧 **Configuration**

### **Jitsu Write Key**
Current configuration uses:
```
kiH8101T34HqABLMg4axhFMTVhOISPWT:L98xSWMaAhJEHa6ctb6LJNm20fcdgFzG
```

### **Environment Variables**
- `JITSU_HOST`: http://localhost:8080
- `JITSU_CONSOLE`: http://localhost:3000

## 🚨 **Troubleshooting**

### **Analytics Not Working**
1. ✅ Check browser console for errors
2. ✅ Verify Jitsu server is running
3. ✅ Confirm write key is correct
4. ✅ Check network tab for failed requests

### **Products Not Loading**
1. ✅ Check browser console for JavaScript errors
2. ✅ Verify image URLs are accessible
3. ✅ Check products.js for syntax errors

### **Cart Issues**
1. ✅ Clear localStorage: `localStorage.clear()`
2. ✅ Check cart.js for errors
3. ✅ Verify product IDs match

## 🎯 **Next Steps**

### **Enhancements**
- [ ] Add user authentication
- [ ] Implement search functionality
- [ ] Add product reviews and ratings
- [ ] Create admin dashboard
- [ ] Add payment processing
- [ ] Implement inventory management

### **Advanced Analytics**
- [ ] A/B testing integration
- [ ] Cohort analysis
- [ ] Funnel analysis
- [ ] Real-time dashboard
- [ ] Custom event tracking
- [ ] Advanced segmentation

## 📞 **Support**

For questions about:
- **Jitsu Setup**: Check [Jitsu Documentation](https://docs.jitsu.com)
- **Website Issues**: Review browser console errors
- **Analytics**: Verify events in Jitsu console

---

**🎉 Congratulations!** You now have a fully functional e-commerce website with comprehensive Jitsu analytics tracking. Every user interaction is being tracked and can be analyzed to improve your business performance! 