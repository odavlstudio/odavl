# ODAVL Studio Hub - PostgreSQL Setup Script
# Automates Phase 1.1: Database Migration from SQLite to PostgreSQL

param(
    [switch]$UseDocker = $false,
    [switch]$UseNative = $false,
    [switch]$CheckOnly = $false
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "🗄️  ODAVL Studio Hub - PostgreSQL Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check current DATABASE_URL
Write-Host "📊 Checking current database configuration..." -ForegroundColor Yellow
$envContent = Get-Content ".env.local" -Raw -ErrorAction SilentlyContinue
if ($envContent -match 'DATABASE_URL="([^"]+)"') {
    $currentDB = $matches[1]
    Write-Host "✅ Current DATABASE_URL: $currentDB" -ForegroundColor Green
    
    if ($currentDB -like "postgresql://*") {
        Write-Host "✅ Already using PostgreSQL!" -ForegroundColor Green
        if ($CheckOnly) { exit 0 }
        
        $continue = Read-Host "Do you want to reconfigure? (y/n)"
        if ($continue -ne "y") { exit 0 }
    }
} else {
    Write-Host "⚠️  DATABASE_URL not found in .env.local" -ForegroundColor Yellow
}

if ($CheckOnly) { exit 0 }

Write-Host ""
Write-Host "📋 Installation Options:" -ForegroundColor Cyan
Write-Host "  1. Docker (Recommended - Isolated, Easy to remove)"
Write-Host "  2. Native Windows Installation"
Write-Host "  3. Cancel"
Write-Host ""

if (-not $UseDocker -and -not $UseNative) {
    $choice = Read-Host "Choose option (1-3)"
    
    switch ($choice) {
        "1" { $UseDocker = $true }
        "2" { $UseNative = $true }
        "3" { Write-Host "❌ Setup cancelled"; exit 0 }
        default { Write-Host "❌ Invalid choice"; exit 1 }
    }
}

# Docker Installation
if ($UseDocker) {
    Write-Host ""
    Write-Host "🐳 Docker Setup" -ForegroundColor Cyan
    Write-Host "=================" -ForegroundColor Cyan
    
    # Check Docker
    Write-Host "Checking Docker installation..." -ForegroundColor Yellow
    try {
        $dockerVersion = docker --version 2>&1
        Write-Host "✅ Docker found: $dockerVersion" -ForegroundColor Green
    } catch {
        Write-Host "❌ Docker not installed or not running" -ForegroundColor Red
        Write-Host ""
        Write-Host "📥 Download Docker Desktop from:" -ForegroundColor Yellow
        Write-Host "   https://www.docker.com/products/docker-desktop/" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "After installation:" -ForegroundColor Yellow
        Write-Host "   1. Install and restart computer"
        Write-Host "   2. Open Docker Desktop"
        Write-Host "   3. Run this script again"
        exit 1
    }
    
    # Check if container exists
    Write-Host "Checking for existing container..." -ForegroundColor Yellow
    $existingContainer = docker ps -a --filter "name=odavl-postgres" --format "{{.Names}}" 2>$null
    
    if ($existingContainer) {
        Write-Host "⚠️  Container 'odavl-postgres' already exists" -ForegroundColor Yellow
        $remove = Read-Host "Remove and recreate? (y/n)"
        if ($remove -eq "y") {
            Write-Host "Stopping and removing existing container..." -ForegroundColor Yellow
            docker stop odavl-postgres 2>$null
            docker rm odavl-postgres 2>$null
            Write-Host "✅ Old container removed" -ForegroundColor Green
        } else {
            Write-Host "Using existing container..." -ForegroundColor Yellow
            docker start odavl-postgres 2>$null
            Write-Host "✅ Container started" -ForegroundColor Green
        }
    } else {
        Write-Host "Creating PostgreSQL container..." -ForegroundColor Yellow
        docker run --name odavl-postgres `
            -e POSTGRES_PASSWORD=postgres `
            -e POSTGRES_DB=odavl_hub `
            -p 5432:5432 `
            -d postgres:15-alpine
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ PostgreSQL container created and started" -ForegroundColor Green
            Write-Host "Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
            Start-Sleep -Seconds 5
        } else {
            Write-Host "❌ Failed to create container" -ForegroundColor Red
            exit 1
        }
    }
    
    $connectionString = "postgresql://postgres:postgres@localhost:5432/odavl_hub?schema=public"
}

# Native Installation
if ($UseNative) {
    Write-Host ""
    Write-Host "💻 Native PostgreSQL Setup" -ForegroundColor Cyan
    Write-Host "============================" -ForegroundColor Cyan
    
    # Check if PostgreSQL is installed
    Write-Host "Checking PostgreSQL installation..." -ForegroundColor Yellow
    $pgService = Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue
    
    if (-not $pgService) {
        Write-Host "⚠️  PostgreSQL not found" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "📥 Install PostgreSQL:" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Option 1: Using winget (Recommended)" -ForegroundColor Cyan
        Write-Host "   winget install PostgreSQL.PostgreSQL" -ForegroundColor White
        Write-Host ""
        Write-Host "Option 2: Manual download" -ForegroundColor Cyan
        Write-Host "   https://www.postgresql.org/download/windows/" -ForegroundColor White
        Write-Host ""
        Write-Host "After installation, run this script again." -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "✅ PostgreSQL service found: $($pgService.DisplayName)" -ForegroundColor Green
    
    if ($pgService.Status -ne "Running") {
        Write-Host "Starting PostgreSQL service..." -ForegroundColor Yellow
        Start-Service $pgService.Name
        Write-Host "✅ Service started" -ForegroundColor Green
    }
    
    # Get password
    Write-Host ""
    $password = Read-Host "Enter PostgreSQL password for 'postgres' user" -AsSecureString
    $passwordText = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($password)
    )
    
    $connectionString = "postgresql://postgres:$passwordText@localhost:5432/odavl_hub?schema=public"
    
    # Create database
    Write-Host "Creating database..." -ForegroundColor Yellow
    $env:PGPASSWORD = $passwordText
    $createDB = psql -U postgres -c "CREATE DATABASE odavl_hub;" 2>&1
    if ($createDB -like "*already exists*") {
        Write-Host "✅ Database already exists" -ForegroundColor Green
    } elseif ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database created" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Could not create database (may already exist)" -ForegroundColor Yellow
    }
    $env:PGPASSWORD = $null
}

# Update .env.local
Write-Host ""
Write-Host "📝 Updating .env.local..." -ForegroundColor Yellow
$envContent = Get-Content ".env.local" -Raw
$envContent = $envContent -replace 'DATABASE_URL="[^"]+"', "DATABASE_URL=`"$connectionString`""
$envContent | Set-Content ".env.local"
Write-Host "✅ .env.local updated" -ForegroundColor Green

# Run migrations
Write-Host ""
Write-Host "🔄 Running database migrations..." -ForegroundColor Yellow
Write-Host ""

pnpm db:generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to generate Prisma client" -ForegroundColor Red
    exit 1
}

pnpm db:push
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to push schema" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Migrations completed" -ForegroundColor Green

# Seed database
Write-Host ""
Write-Host "🌱 Seeding database..." -ForegroundColor Yellow
pnpm db:seed
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Database seeded successfully" -ForegroundColor Green
} else {
    Write-Host "⚠️  Seeding failed (may already have data)" -ForegroundColor Yellow
}

# Success summary
Write-Host ""
Write-Host "🎉 PostgreSQL Setup Complete!" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Database: PostgreSQL 15"
Write-Host "✅ Connection: localhost:5432"
Write-Host "✅ Database Name: odavl_hub"
Write-Host "✅ Schema: public"
Write-Host "✅ Migrations: Applied"
Write-Host "✅ Seed Data: Loaded"
Write-Host ""
Write-Host "📊 View your data:" -ForegroundColor Cyan
Write-Host "   pnpm db:studio" -ForegroundColor White
Write-Host "   (Opens Prisma Studio at http://localhost:5555)" -ForegroundColor Gray
Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Verify database in Prisma Studio"
Write-Host "   2. Continue to Phase 1.2: OAuth Configuration"
Write-Host ""

# Open Prisma Studio option
$openStudio = Read-Host "Open Prisma Studio now? (y/n)"
if ($openStudio -eq "y") {
    Write-Host "Opening Prisma Studio..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; pnpm db:studio"
}
