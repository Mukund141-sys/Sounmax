# ClickHouse Events Query Script
# This script helps you query Jitsu events from the command line

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("tables", "events", "count", "recent", "summary", "help")]
    [string]$Action = "help"
)

Write-Host "=== ClickHouse Events Query Tool ===" -ForegroundColor Green

function Show-Help {
    Write-Host "`nAvailable commands:" -ForegroundColor Yellow
    Write-Host "  tables  - Show all tables in the database" -ForegroundColor White
    Write-Host "  events  - Show recent events (last 10)" -ForegroundColor White
    Write-Host "  count   - Show total event count" -ForegroundColor White
    Write-Host "  recent  - Show events from last hour" -ForegroundColor White
    Write-Host "  summary - Show event summary and types" -ForegroundColor White
    Write-Host "  help    - Show this help message" -ForegroundColor White
    
    Write-Host "`nUsage examples:" -ForegroundColor Yellow
    Write-Host "  .\query-events.ps1 -Action tables" -ForegroundColor White
    Write-Host "  .\query-events.ps1 -Action events" -ForegroundColor White
    Write-Host "  .\query-events.ps1 -Action summary" -ForegroundColor White
}

function Show-Tables {
    Write-Host "`nShowing all tables in ClickHouse..." -ForegroundColor Yellow
    $query = "SHOW TABLES FROM newjitsu_metrics"
    docker exec docker-clickhouse-1 clickhouse-client --query "$query"
}

function Show-Events {
    Write-Host "`nShowing recent events (last 10)..." -ForegroundColor Yellow
    $query = "SELECT timestamp, actorId, type, level FROM newjitsu_metrics.events_log ORDER BY timestamp DESC LIMIT 10"
    docker exec docker-clickhouse-1 clickhouse-client --query "$query"
}

function Show-Count {
    Write-Host "`nShowing total event count..." -ForegroundColor Yellow
    $query = "SELECT COUNT(*) as total_events FROM newjitsu_metrics.events_log"
    docker exec docker-clickhouse-1 clickhouse-client --query "$query"
}

function Show-Recent {
    Write-Host "`nShowing events from last hour..." -ForegroundColor Yellow
    $query = "SELECT timestamp, actorId, type, level FROM newjitsu_metrics.events_log WHERE timestamp >= now() - INTERVAL 1 HOUR ORDER BY timestamp DESC"
    docker exec docker-clickhouse-1 clickhouse-client --query "$query"
}

function Show-Summary {
    Write-Host "`nEvent Summary:" -ForegroundColor Yellow
    
    Write-Host "`nTotal Events:" -ForegroundColor Cyan
    $query = "SELECT COUNT(*) as total_events FROM newjitsu_metrics.events_log"
    docker exec docker-clickhouse-1 clickhouse-client --query "$query"
    
    Write-Host "`nEvents by Type:" -ForegroundColor Cyan
    $query = "SELECT type, COUNT(*) as count FROM newjitsu_metrics.events_log GROUP BY type ORDER BY count DESC"
    docker exec docker-clickhouse-1 clickhouse-client --query "$query"
    
    Write-Host "`nEvents by Level:" -ForegroundColor Cyan
    $query = "SELECT level, COUNT(*) as count FROM newjitsu_metrics.events_log GROUP BY level ORDER BY count DESC"
    docker exec docker-clickhouse-1 clickhouse-client --query "$query"
    
    Write-Host "`nRecent Activity (last 5 events):" -ForegroundColor Cyan
    $query = "SELECT timestamp, type, level FROM newjitsu_metrics.events_log ORDER BY timestamp DESC LIMIT 5"
    docker exec docker-clickhouse-1 clickhouse-client --query "$query"
}

function Interactive-Mode {
    Write-Host "`nEntering interactive ClickHouse mode..." -ForegroundColor Yellow
    Write-Host "Type 'exit' to quit, or enter SQL queries directly." -ForegroundColor White
    Write-Host "Example queries:" -ForegroundColor Cyan
    Write-Host "  SELECT COUNT(*) FROM newjitsu_metrics.events_log;" -ForegroundColor White
    Write-Host "  SELECT * FROM newjitsu_metrics.events_log LIMIT 5;" -ForegroundColor White
    Write-Host "  SELECT type, COUNT(*) FROM newjitsu_metrics.events_log GROUP BY type;" -ForegroundColor White
    Write-Host ""
    
    docker exec -it docker-clickhouse-1 clickhouse-client
}

# Main execution
switch ($Action) {
    "tables" { Show-Tables }
    "events" { Show-Events }
    "count" { Show-Count }
    "recent" { Show-Recent }
    "summary" { Show-Summary }
    "help" { Show-Help }
    default { Show-Help }
}

Write-Host "`n=== End ===" -ForegroundColor Green 