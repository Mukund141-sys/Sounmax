# Setup Multiple Tables for Event Grouping

## Overview
This guide will help you configure Jitsu to automatically group events into different ClickHouse tables based on event type, without changing your website code.

## Current Setup
- **Website**: Sends events to `http://localhost:8080`
- **Jitsu Console**: `http://localhost:3000`
- **ClickHouse**: `http://localhost:8123`
- **Database**: `newjitsu_metrics`

## Step 1: Access Jitsu Console

1. Open your browser and go to: `http://localhost:3000`
2. Login with your credentials
3. You should see the Jitsu dashboard

## Step 2: Create ClickHouse Destination

1. **Go to Destinations** (left sidebar)
2. **Click "Create Destination"**
3. **Select "ClickHouse"**
4. **Configure the connection:**

```yaml
Host: clickhouse:8123
Database: newjitsu_metrics
Username: default
Password: default
```

5. **Test the connection** and save

## Step 3: Create Event Routing Function

1. **Go to Functions** (left sidebar)
2. **Click "Create Function"**
3. **Configure the function:**

```yaml
Name: event_router
Type: Transformation
Description: Routes events to different tables based on event type
```

4. **Paste the function code** from `event-router.js`
5. **Save the function**

## Step 4: Create Streams for Different Event Types

### Stream 1: Page Views
1. **Go to Streams** (left sidebar)
2. **Click "Create Stream"**
3. **Configure:**
   - Name: `page_views_stream`
   - Description: `Page view events`
4. **Save the stream**

### Stream 2: Product Events
1. **Create another stream**
2. **Configure:**
   - Name: `product_events_stream`
   - Description: `Product interaction events`
4. **Save the stream**

### Stream 3: E-commerce Events
1. **Create stream**
2. **Configure:**
   - Name: `ecommerce_events_stream`
   - Description: `Shopping cart and purchase events`
4. **Save the stream**

### Stream 4: User Engagement
1. **Create stream**
2. **Configure:**
   - Name: `user_engagement_stream`
   - Description: `User interaction events`
4. **Save the stream**

### Stream 5: Error Events
1. **Create stream**
2. **Configure:**
   - Name: `error_events_stream`
   - Description: `JavaScript errors and issues`
4. **Save the stream**

## Step 5: Configure Connections

For each stream, create a connection to ClickHouse:

### Connection Configuration Template

1. **Go to Connections** (left sidebar)
2. **Click "Create Connection"**
3. **Configure each connection:**

```yaml
# For each connection:
Source: [Select your stream]
Destination: [Select your ClickHouse destination]
Mode: batch
Primary Key: timestamp,message_id
Data Layout: segment-single-table
Schema Freeze: false
Keep Original Names: true
Batch Size: 10000
Frequency: 60
```

### Table Names for Each Connection

- **Page Views Connection**: Table Name = `page_views`
- **Product Events Connection**: Table Name = `product_events`
- **E-commerce Events Connection**: Table Name = `ecommerce_events`
- **User Engagement Connection**: Table Name = `user_engagement_events`
- **Error Events Connection**: Table Name = `error_events`

## Step 6: Add Event Routing Function

For each connection:

1. **Go to the connection settings**
2. **Add Function**: Select your `event_router` function
3. **Function Order**: Place it first in the chain
4. **Save the connection**

## Step 7: Test the Configuration

### Test Event Sending

1. **Go to your website**: `http://localhost:8080` (or your site URL)
2. **Perform different actions**:
   - Visit different pages (page views)
   - Click on products (product events)
   - Add items to cart (e-commerce events)
   - Click buttons (user engagement)
   - Trigger errors (error events)

### Verify Data in ClickHouse

1. **Access ClickHouse**: `http://localhost:8123`
2. **Run queries** to check different tables:

```sql
-- Check page views
SELECT count() FROM page_views;

-- Check product events
SELECT count() FROM product_events;

-- Check e-commerce events
SELECT count() FROM ecommerce_events;

-- Check user engagement
SELECT count() FROM user_engagement_events;

-- Check error events
SELECT count() FROM error_events;
```

## Step 8: Create Dashboard Queries

### Page Views Dashboard
```sql
-- Daily page views
SELECT 
    toDate(timestamp) as date,
    count() as page_views,
    uniqExact(user_id) as unique_visitors
FROM page_views
WHERE timestamp >= now() - INTERVAL 30 DAY
GROUP BY date
ORDER BY date;
```

### Product Performance Dashboard
```sql
-- Product interaction metrics
SELECT 
    product_id,
    product_name,
    count() as interactions,
    uniqExact(user_id) as unique_users
FROM product_events
WHERE timestamp >= now() - INTERVAL 7 DAY
GROUP BY product_id, product_name
ORDER BY interactions DESC;
```

### E-commerce Dashboard
```sql
-- Revenue tracking
SELECT 
    toDate(timestamp) as date,
    sum(transaction_total) as daily_revenue,
    count() as transactions
FROM ecommerce_events
WHERE event_type = 'Purchase Completed'
GROUP BY date
ORDER BY date;
```

## Expected Event Grouping

Based on your current website events, here's how they'll be grouped:

### Page Views Table
- `page` events
- `Page Viewed` events

### Product Events Table
- `Product Viewed`
- `Product Added to Cart`
- `Product Removed from Cart`
- `Product Image Changed`
- `Product Color Selected`
- `Product Storage Selected`
- `Product Added to Wishlist`
- `Product Shared`
- `Buy Now Clicked`

### E-commerce Events Table
- `Cart Viewed`
- `Checkout Started`
- `Purchase Completed`
- `Revenue Generated`

### User Engagement Events Table
- `Category Clicked`
- `Hero CTA Clicked`
- `Newsletter Signup`
- `Search Performed`
- `Session Started`
- `Page Engagement`

### Error Events Table
- `JavaScript Error`

## Troubleshooting

### Common Issues

1. **Events not appearing in tables**:
   - Check function routing logic
   - Verify table names in connections
   - Check ClickHouse connection

2. **ClickHouse connection issues**:
   - Verify ClickHouse is running: `docker-compose ps`
   - Check credentials in destination config

3. **Function errors**:
   - Check function syntax in Jitsu console
   - Verify event structure matches routing logic

### Debug Queries

```sql
-- Check all events in default table
SELECT * FROM events ORDER BY timestamp DESC LIMIT 10;

-- Check specific event types
SELECT event_type, count() FROM events GROUP BY event_type;

-- Check routing function output
SELECT _table, count() FROM events GROUP BY _table;
```

## Access Points

- **Jitsu Console**: `http://localhost:3000`
- **ClickHouse Interface**: `http://localhost:8123`
- **Superset Dashboard**: `http://localhost:8088` (if configured)
- **Ingest Endpoint**: `http://localhost:8080`

## Next Steps

1. **Monitor data flow** for a few days
2. **Create dashboards** in Superset
3. **Optimize queries** based on your specific needs
4. **Add more event types** as your platform grows 