#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Setup PostgreSQL for ODAVL Cloud Console
.DESCRIPTION
    Starts PostgreSQL (Docker or local), pushes schema, and seeds database
.PARAMETER UseDocker
    Use Docker container (default: true)
.PARAMETER UseLocal
    Use local PostgreSQL installation
.PARAMETER Port
    PostgreSQL port (default: 5432)
.EXAMPLE
    .\setup-postgres.ps1 -UseDocker
    .\setup-postgres.ps1 -UseLocal
#>

param(
    [switch]$UseDocker = $true,
    [switch]$UseLocal = $false,
    [int]$Port = 5432
)

$ErrorActionPreference = "Stop"
Write-Host "🚀 ODAVL Cloud Console - PostgreSQL Setup" -ForegroundColor Cyan
Write-Host "=" * 60

# Configuration
$containerName = "odavl-postgres"
$dbName = "odavl_cloud"
$dbUser = "postgres"
$dbPassword = "postgres"
$databaseUrl = "postgresql://${dbUser}:${dbPassword}@localhost:${Port}/${dbName}?schema=public"

function Test-DockerAvailable {
    try {
        docker --version | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

function Test-DockerRunning {
    try {
        docker ps | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

function Test-PostgresRunning {
    param([int]$port)
    
    try {
        $connection = New-Object System.Net.Sockets.TcpClient
        $connection.Connect("localhost", $port)
        $connection.Close()
        return $true
    }
    catch {
        return $false
    }
}

function Start-DockerPostgres {
    Write-Host "`n📦 Starting PostgreSQL Docker container..." -ForegroundColor Yellow
    
    # Check if container exists
    $existing = docker ps -a --filter "name=$containerName" --format "{{.Names}}"
    
    if ($existing -eq $containerName) {
        Write-Host "Container '$containerName' exists. Checking status..."
        
        $status = docker ps --filter "name=$containerName" --format "{{.Status}}"
        if ($status -like "Up*") {
            Write-Host "✅ Container is already running" -ForegroundColor Green
            return $true
        }
        
        Write-Host "Starting existing container..."
        docker start $containerName
        Start-Sleep -Seconds 3
    }
    else {
        Write-Host "Creating new PostgreSQL container..."
        docker run -d `
            --name $containerName `
            -e POSTGRES_PASSWORD=$dbPassword `
            -e POSTGRES_DB=$dbName `
            -p "${Port}:5432" `
            postgres:15-alpine
        
        Write-Host "⏳ Waiting for PostgreSQL to be ready (15 seconds)..."
        Start-Sleep -Seconds 15
    }
    
    # Verify container is running
    $status = docker ps --filter "name=$containerName" --format "{{.Status}}"
    if ($status -like "Up*") {
        Write-Host "✅ PostgreSQL container is running" -ForegroundColor Green
        return $true
    }
    else {
        Write-Host "❌ Failed to start container" -ForegroundColor Red
        return $false
    }
}

function Update-EnvFile {
    param([string]$databaseUrl)
    
    Write-Host "`n📝 Updating .env.local with DATABASE_URL..." -ForegroundColor Yellow
    
    $envFile = ".env.local"
    if (-not (Test-Path $envFile)) {
        Write-Host "❌ .env.local not found. Creating from example..." -ForegroundColor Red
        if (Test-Path ".env.example") {
            Copy-Item ".env.example" $envFile
        }
        else {
            Write-Host "⚠️ No .env.example found. Manual configuration needed." -ForegroundColor Yellow
            return
        }
    }
    
    # Update DATABASE_URL
    $content = Get-Content $envFile -Raw
    if ($content -match 'DATABASE_URL=') {
        $content = $content -replace 'DATABASE_URL="[^"]*"', "DATABASE_URL=`"$databaseUrl`""
        Set-Content $envFile $content -NoNewline
        Write-Host "✅ DATABASE_URL updated in .env.local" -ForegroundColor Green
    }
    else {
        Add-Content $envFile "`nDATABASE_URL=`"$databaseUrl`""
        Write-Host "✅ DATABASE_URL added to .env.local" -ForegroundColor Green
    }
}

function Push-PrismaSchema {
    Write-Host "`n🔄 Pushing Prisma schema to database..." -ForegroundColor Yellow
    
    # Set environment variable for this session
    $env:DATABASE_URL = $databaseUrl
    
    try {
        pnpm prisma db push --skip-generate
        Write-Host "✅ Prisma schema pushed successfully" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ Failed to push Prisma schema: $_" -ForegroundColor Red
        return $false
    }
}

function Generate-PrismaClient {
    Write-Host "`n🔧 Generating Prisma Client..." -ForegroundColor Yellow
    
    try {
        pnpm prisma generate
        Write-Host "✅ Prisma Client generated" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ Failed to generate Prisma Client: $_" -ForegroundColor Red
        return $false
    }
}

function Seed-Database {
    Write-Host "`n🌱 Seeding database with default data..." -ForegroundColor Yellow
    
    $env:DATABASE_URL = $databaseUrl
    
    try {
        pnpm prisma db seed
        Write-Host "✅ Database seeded successfully" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "⚠️ Seed script not found or failed. This is optional." -ForegroundColor Yellow
        Write-Host "You can manually seed the database later." -ForegroundColor Yellow
        return $true
    }
}

function Test-DatabaseConnection {
    Write-Host "`n🧪 Testing database connection..." -ForegroundColor Yellow
    
    $env:DATABASE_URL = $databaseUrl
    
    try {
        # Try to connect and query
        $testQuery = @"
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.\`$connect()
  .then(() => {
    console.log('✅ Database connection successful');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  });
"@
        
        $testFile = [System.IO.Path]::GetTempFileName() + ".js"
        Set-Content $testFile $testQuery
        
        node $testFile
        Remove-Item $testFile
        
        return $LASTEXITCODE -eq 0
    }
    catch {
        Write-Host "❌ Database connection test failed: $_" -ForegroundColor Red
        return $false
    }
}

# ============================================================================
# Main Execution
# ============================================================================

try {
    # Step 1: Check prerequisites
    Write-Host "`n🔍 Checking prerequisites..." -ForegroundColor Yellow
    
    if ($UseLocal -or -not $UseDocker) {
        Write-Host "Using local PostgreSQL installation..."
        
        if (-not (Test-PostgresRunning -port $Port)) {
            Write-Host "❌ PostgreSQL is not running on port $Port" -ForegroundColor Red
            Write-Host "Please start PostgreSQL manually or use -UseDocker" -ForegroundColor Yellow
            exit 1
        }
        
        Write-Host "✅ PostgreSQL is running on port $Port" -ForegroundColor Green
    }
    else {
        Write-Host "Using Docker for PostgreSQL..."
        
        if (-not (Test-DockerAvailable)) {
            Write-Host "❌ Docker is not installed" -ForegroundColor Red
            Write-Host "Install Docker Desktop or use -UseLocal for local PostgreSQL" -ForegroundColor Yellow
            exit 1
        }
        
        if (-not (Test-DockerRunning)) {
            Write-Host "❌ Docker Desktop is not running" -ForegroundColor Red
            Write-Host "Please start Docker Desktop and try again" -ForegroundColor Yellow
            exit 1
        }
        
        Write-Host "✅ Docker is available" -ForegroundColor Green
        
        # Start PostgreSQL container
        if (-not (Start-DockerPostgres)) {
            Write-Host "❌ Failed to start PostgreSQL container" -ForegroundColor Red
            exit 1
        }
    }
    
    # Step 2: Update .env.local
    Update-EnvFile -databaseUrl $databaseUrl
    
    # Step 3: Push Prisma schema
    if (-not (Push-PrismaSchema)) {
        Write-Host "❌ Schema push failed. Check DATABASE_URL and database access" -ForegroundColor Red
        exit 1
    }
    
    # Step 4: Generate Prisma Client
    if (-not (Generate-PrismaClient)) {
        Write-Host "❌ Client generation failed" -ForegroundColor Red
        exit 1
    }
    
    # Step 5: Seed database (optional)
    Seed-Database | Out-Null
    
    # Step 6: Test connection
    if (-not (Test-DatabaseConnection)) {
        Write-Host "⚠️ Connection test failed, but setup might still work" -ForegroundColor Yellow
    }
    
    # Success!
    Write-Host "`n" + ("=" * 60)
    Write-Host "🎉 PostgreSQL setup complete!" -ForegroundColor Green
    Write-Host "=" * 60
    Write-Host "`nDatabase URL: $databaseUrl" -ForegroundColor Cyan
    Write-Host "`nNext steps:" -ForegroundColor Yellow
    Write-Host "  1. Run 'pnpm dev' to start the development server"
    Write-Host "  2. Visit http://localhost:3003 to test"
    Write-Host "  3. Check Prisma Studio: 'pnpm prisma studio'"
    Write-Host "`nTo stop PostgreSQL container:" -ForegroundColor Yellow
    Write-Host "  docker stop $containerName"
    Write-Host "`nTo remove PostgreSQL container:" -ForegroundColor Yellow
    Write-Host "  docker rm -f $containerName"
    
}
catch {
    Write-Host "`n❌ Setup failed: $_" -ForegroundColor Red
    exit 1
}
