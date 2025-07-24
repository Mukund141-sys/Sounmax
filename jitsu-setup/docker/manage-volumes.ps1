# Jitsu Docker Volume Management Script
# This script helps manage Docker volumes and verify data persistence

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("status", "backup", "restore", "cleanup", "info")]
    [string]$Action = "status"
)

Write-Host "=== Jitsu Docker Volume Management ===" -ForegroundColor Green

function Show-Status {
    Write-Host "`nChecking Jitsu services status..." -ForegroundColor Yellow
    docker-compose ps
    
    Write-Host "`nChecking Docker volumes..." -ForegroundColor Yellow
    docker volume ls --filter "name=docker_"
    
    Write-Host "`nVolume details:" -ForegroundColor Yellow
    $volumes = @("docker_postgres_data", "docker_clickhouse_data", "docker_mongo_data", "docker_kafka_data", "docker_bulker_cache", "docker_rotor_cache", "docker_ingest_cache")
    
    foreach ($volume in $volumes) {
        $info = docker volume inspect $volume 2>$null
        if ($info) {
            Write-Host "  $volume : Found" -ForegroundColor Cyan
        } else {
            Write-Host "  $volume : Not found" -ForegroundColor Red
        }
    }
}

function Show-Info {
    Write-Host "`nJitsu Volume Information:" -ForegroundColor Yellow
    Write-Host "  • docker_postgres_data    - PostgreSQL database data" -ForegroundColor White
    Write-Host "  • docker_clickhouse_data  - ClickHouse analytics data" -ForegroundColor White
    Write-Host "  • docker_mongo_data       - MongoDB metadata" -ForegroundColor White
    Write-Host "  • docker_kafka_data       - Kafka message queue data" -ForegroundColor White
    Write-Host "  • docker_bulker_cache     - Bulker service cache" -ForegroundColor White
    Write-Host "  • docker_rotor_cache      - Rotor service cache" -ForegroundColor White
    Write-Host "  • docker_ingest_cache     - Ingest service cache" -ForegroundColor White
    
    Write-Host "`nAccess URLs:" -ForegroundColor Yellow
    Write-Host "  • Jitsu Console: http://localhost:3000" -ForegroundColor White
    Write-Host "  • ClickHouse Play: http://localhost:8123" -ForegroundColor White
    Write-Host "  • Ingest API: http://localhost:8080" -ForegroundColor White
    
    Write-Host "`nTips:" -ForegroundColor Yellow
    Write-Host "  • Use 'docker-compose down' to stop services (data preserved)" -ForegroundColor White
    Write-Host "  • Use 'docker-compose down -v' to remove volumes (data lost)" -ForegroundColor White
    Write-Host "  • Use 'docker-compose up -d' to start services" -ForegroundColor White
}

function Backup-Volumes {
    Write-Host "`nCreating backup of volumes..." -ForegroundColor Yellow
    $backupDir = "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    
    $volumes = @("docker_postgres_data", "docker_clickhouse_data", "docker_mongo_data")
    
    foreach ($volume in $volumes) {
        Write-Host "  Backing up $volume..." -ForegroundColor Cyan
        docker run --rm -v ${volume}:/source -v ${PWD}/${backupDir}:/backup alpine tar czf /backup/${volume}.tar.gz -C /source .
    }
    
    Write-Host "`nBackup completed in: $backupDir" -ForegroundColor Green
}

function Restore-Volumes {
    Write-Host "`nRestoring volumes from backup..." -ForegroundColor Yellow
    $backupDir = Read-Host "Enter backup directory path"
    
    if (-not (Test-Path $backupDir)) {
        Write-Host "Backup directory not found!" -ForegroundColor Red
        return
    }
    
    $volumes = @("docker_postgres_data", "docker_clickhouse_data", "docker_mongo_data")
    
    foreach ($volume in $volumes) {
        $backupFile = Join-Path $backupDir "$volume.tar.gz"
        if (Test-Path $backupFile) {
            Write-Host "  Restoring $volume..." -ForegroundColor Cyan
            docker run --rm -v ${volume}:/target -v ${backupFile}:/backup.tar.gz alpine sh -c "cd /target && tar xzf /backup.tar.gz"
        }
    }
    
    Write-Host "`nRestore completed!" -ForegroundColor Green
}

function Cleanup-Volumes {
    Write-Host "`nWARNING: This will remove ALL Jitsu data!" -ForegroundColor Red
    $confirm = Read-Host "Are you sure? Type 'YES' to confirm"
    
    if ($confirm -eq "YES") {
        Write-Host "Stopping services..." -ForegroundColor Yellow
        docker-compose down
        
        Write-Host "Removing volumes..." -ForegroundColor Yellow
        docker volume rm docker_postgres_data docker_clickhouse_data docker_mongo_data docker_kafka_data docker_bulker_cache docker_rotor_cache docker_ingest_cache 2>$null
        
        Write-Host "Cleanup completed!" -ForegroundColor Green
    } else {
        Write-Host "Cleanup cancelled." -ForegroundColor Yellow
    }
}

# Main execution
switch ($Action) {
    "status" { Show-Status }
    "info" { Show-Info }
    "backup" { Backup-Volumes }
    "restore" { Restore-Volumes }
    "cleanup" { Cleanup-Volumes }
    default { Show-Status }
}

Write-Host "`n=== End ===" -ForegroundColor Green 