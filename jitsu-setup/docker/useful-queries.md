# Useful ClickHouse Queries for Jitsu Analytics

## Quick Start Commands

### Using the Script (Recommended)
```powershell
# Show help
.\query-events.ps1 -Action help

# View summary
.\query-events.ps1 -Action summary

# View recent events
.\query-events.ps1 -Action events

# View count
.\query-events.ps1 -Action count
```

### Direct ClickHouse Commands
```powershell
# Connect interactively
docker exec -it docker-clickhouse-1 clickhouse-client

# Run single query
docker exec docker-clickhouse-1 clickhouse-client --query "YOUR_QUERY_HERE"
```

## Useful SQL Queries

### 1. Basic Event Counts
```sql
-- Total events
SELECT COUNT(*) as total_events FROM newjitsu_metrics.events_log;

-- Events by type
SELECT type, COUNT(*) as count FROM newjitsu_metrics.events_log GROUP BY type ORDER BY count DESC;

-- Events by level
SELECT level, COUNT(*) as count FROM newjitsu_metrics.events_log GROUP BY level ORDER BY count DESC;
```

### 2. Recent Activity
```sql
-- Last 10 events
SELECT timestamp, type, level FROM newjitsu_metrics.events_log ORDER BY timestamp DESC LIMIT 10;

-- Events from last hour
SELECT timestamp, type, level FROM newjitsu_metrics.events_log 
WHERE timestamp >= now() - INTERVAL 1 HOUR 
ORDER BY timestamp DESC;

-- Events from last 24 hours
SELECT timestamp, type, level FROM newjitsu_metrics.events_log 
WHERE timestamp >= now() - INTERVAL 24 HOUR 
ORDER BY timestamp DESC;
```

### 3. Event Analysis
```sql
-- Events per hour (last 24 hours)
SELECT 
    toStartOfHour(timestamp) as hour,
    COUNT(*) as event_count
FROM newjitsu_metrics.events_log 
WHERE timestamp >= now() - INTERVAL 24 HOUR 
GROUP BY hour 
ORDER BY hour DESC;

-- Most active time periods
SELECT 
    toHour(timestamp) as hour_of_day,
    COUNT(*) as event_count
FROM newjitsu_metrics.events_log 
GROUP BY hour_of_day 
ORDER BY event_count DESC;
```

### 4. Table Information
```sql
-- Show all tables
SHOW TABLES FROM newjitsu_metrics;

-- Describe table structure
DESCRIBE newjitsu_metrics.events_log;

-- Show table size
SELECT 
    table,
    formatReadableSize(sum(bytes)) as size
FROM system.parts 
WHERE database = 'newjitsu_metrics' 
GROUP BY table;
```

### 5. Advanced Analytics
```sql
-- Events by actor (source)
SELECT 
    actorId,
    COUNT(*) as event_count,
    MIN(timestamp) as first_event,
    MAX(timestamp) as last_event
FROM newjitsu_metrics.events_log 
GROUP BY actorId 
ORDER BY event_count DESC;

-- Event frequency over time
SELECT 
    toDate(timestamp) as date,
    COUNT(*) as daily_events
FROM newjitsu_metrics.events_log 
GROUP BY date 
ORDER BY date DESC;
```

## Quick Commands Reference

### PowerShell Script Commands
- `.\query-events.ps1 -Action help` - Show help
- `.\query-events.ps1 -Action summary` - Event summary
- `.\query-events.ps1 -Action events` - Recent events
- `.\query-events.ps1 -Action count` - Total count
- `.\query-events.ps1 -Action recent` - Last hour events
- `.\query-events.ps1 -Action tables` - Show tables

### Direct Docker Commands
- `docker exec -it docker-clickhouse-1 clickhouse-client` - Interactive mode
- `docker exec docker-clickhouse-1 clickhouse-client --query "SELECT COUNT(*) FROM newjitsu_metrics.events_log"` - Single query

## Tips
1. Use the script for quick overviews
2. Use direct commands for custom queries
3. Use interactive mode for exploration
4. All data is persisted in Docker volumes
5. Queries are case-sensitive 