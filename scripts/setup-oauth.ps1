# OAuth Setup Automation Script
# Usage: .\scripts\setup-oauth.ps1
# PowerShell 7+ required

param(
    [switch]$Help,
    [switch]$Verify,
    [switch]$Generate
)

$ErrorActionPreference = "Stop"

function Show-Help {
    Write-Host @"

🔐 ODAVL Studio OAuth Setup Script
====================================

USAGE:
    .\scripts\setup-oauth.ps1 [OPTIONS]

OPTIONS:
    -Help       Show this help message
    -Verify     Verify OAuth configuration
    -Generate   Generate NEXTAUTH_SECRET only

EXAMPLES:
    .\scripts\setup-oauth.ps1               # Interactive setup
    .\scripts\setup-oauth.ps1 -Verify       # Check configuration
    .\scripts\setup-oauth.ps1 -Generate     # Generate secret only

PREREQUISITES:
    - PowerShell 7+
    - OpenSSL installed (for secret generation)
    - .env.local file exists in apps/studio-hub/

NEXT STEPS:
    1. Run this script to check prerequisites
    2. Create GitHub OAuth App: https://github.com/settings/developers
    3. Create Google OAuth Client: https://console.cloud.google.com/apis/credentials
    4. Update .env.local with credentials
    5. Run: .\scripts\setup-oauth.ps1 -Verify
    6. Start app: pnpm dev

"@ -ForegroundColor Cyan
    exit 0
}

function Test-Prerequisites {
    Write-Host "`n🔍 Checking Prerequisites..." -ForegroundColor Cyan
    
    $issues = @()
    
    # Check .env.local exists
    if (!(Test-Path "apps/studio-hub/.env.local")) {
        $issues += "❌ .env.local not found in apps/studio-hub/"
        Write-Host "   Create it: cp apps/studio-hub/.env.production.example apps/studio-hub/.env.local" -ForegroundColor Yellow
    } else {
        Write-Host "✅ .env.local exists" -ForegroundColor Green
    }
    
    # Check OpenSSL
    try {
        $null = openssl version 2>$null
        Write-Host "✅ OpenSSL installed" -ForegroundColor Green
    } catch {
        $issues += "❌ OpenSSL not found (required for secret generation)"
        Write-Host "   Install: choco install openssl (or download from https://slproweb.com/products/Win32OpenSSL.html)" -ForegroundColor Yellow
    }
    
    # Check pnpm
    try {
        $null = pnpm --version 2>$null
        Write-Host "✅ pnpm installed" -ForegroundColor Green
    } catch {
        $issues += "⚠️  pnpm not found (optional, but recommended)"
    }
    
    if ($issues.Count -gt 0) {
        Write-Host "`n⚠️  Issues found:" -ForegroundColor Yellow
        $issues | ForEach-Object { Write-Host "  $_" }
        return $false
    }
    
    Write-Host "`n✅ All prerequisites met!" -ForegroundColor Green
    return $true
}

function Generate-NextAuthSecret {
    Write-Host "`n🔑 Generating NEXTAUTH_SECRET..." -ForegroundColor Cyan
    
    try {
        $secret = openssl rand -base64 32
        Write-Host "✅ Generated: $secret" -ForegroundColor Green
        
        # Check if NEXTAUTH_SECRET already exists
        $envContent = Get-Content "apps/studio-hub/.env.local" -Raw
        
        if ($envContent -match 'NEXTAUTH_SECRET=') {
            Write-Host "`n⚠️  NEXTAUTH_SECRET already exists in .env.local" -ForegroundColor Yellow
            $response = Read-Host "Replace existing secret? (y/N)"
            
            if ($response -eq 'y' -or $response -eq 'Y') {
                $envContent = $envContent -replace 'NEXTAUTH_SECRET=.*', "NEXTAUTH_SECRET=`"$secret`""
                Set-Content "apps/studio-hub/.env.local" $envContent
                Write-Host "✅ NEXTAUTH_SECRET updated" -ForegroundColor Green
            } else {
                Write-Host "⏭️  Skipping update" -ForegroundColor Yellow
            }
        } else {
            Add-Content "apps/studio-hub/.env.local" "`nNEXTAUTH_SECRET=`"$secret`""
            Write-Host "✅ NEXTAUTH_SECRET added to .env.local" -ForegroundColor Green
        }
        
        return $secret
    } catch {
        Write-Host "❌ Failed to generate secret: $_" -ForegroundColor Red
        return $null
    }
}

function Verify-OAuthConfig {
    Write-Host "`n🔍 Verifying OAuth Configuration..." -ForegroundColor Cyan
    
    $requiredVars = @(
        "NEXTAUTH_SECRET",
        "NEXTAUTH_URL",
        "GITHUB_CLIENT_ID",
        "GITHUB_CLIENT_SECRET",
        "GOOGLE_CLIENT_ID",
        "GOOGLE_CLIENT_SECRET"
    )
    
    $envContent = Get-Content "apps/studio-hub/.env.local" -Raw
    $missing = @()
    $empty = @()
    
    foreach ($var in $requiredVars) {
        if ($envContent -notmatch "$var=") {
            $missing += $var
        } elseif ($envContent -match "$var=`"`"") {
            $empty += $var
        } else {
            Write-Host "✅ $var configured" -ForegroundColor Green
        }
    }
    
    if ($missing.Count -eq 0 -and $empty.Count -eq 0) {
        Write-Host "`n✅ All OAuth variables configured!" -ForegroundColor Green
        Write-Host "`n🚀 Ready to start:" -ForegroundColor Cyan
        Write-Host "   cd apps/studio-hub" -ForegroundColor White
        Write-Host "   pnpm dev" -ForegroundColor White
        Write-Host "   Visit: http://localhost:3000" -ForegroundColor White
        return $true
    }
    
    if ($missing.Count -gt 0) {
        Write-Host "`n❌ Missing variables:" -ForegroundColor Red
        $missing | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
    }
    
    if ($empty.Count -gt 0) {
        Write-Host "`n⚠️  Empty variables (need values):" -ForegroundColor Yellow
        $empty | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
    }
    
    Write-Host "`n📄 Next steps:" -ForegroundColor Cyan
    Write-Host "  1. GitHub OAuth: https://github.com/settings/developers" -ForegroundColor White
    Write-Host "  2. Google OAuth: https://console.cloud.google.com/apis/credentials" -ForegroundColor White
    Write-Host "  3. Update .env.local with credentials" -ForegroundColor White
    Write-Host "  4. Run: .\scripts\setup-oauth.ps1 -Verify" -ForegroundColor White
    Write-Host "`n📖 Full guide: apps/studio-hub/OAUTH_AUTOMATION_GUIDE.md" -ForegroundColor Cyan
    
    return $false
}

function Show-NextSteps {
    Write-Host @"

📋 Next Steps:
==============

1️⃣  Create GitHub OAuth App
   → https://github.com/settings/developers
   → New OAuth App
   → Callback URL: http://localhost:3000/api/auth/callback/github
   → Copy Client ID and Secret

2️⃣  Create Google OAuth Client
   → https://console.cloud.google.com/apis/credentials
   → Create OAuth Client ID
   → Web application
   → Authorized redirect: http://localhost:3000/api/auth/callback/google
   → Copy Client ID and Secret

3️⃣  Update .env.local
   → Open: apps/studio-hub/.env.local
   → Add your GitHub credentials (GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET)
   → Add your Google credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)

4️⃣  Verify Configuration
   → Run: .\scripts\setup-oauth.ps1 -Verify

5️⃣  Start Application
   → cd apps/studio-hub
   → pnpm dev
   → Visit: http://localhost:3000
   → Test: Sign in with GitHub / Google

📖 Detailed Guide: apps/studio-hub/OAUTH_AUTOMATION_GUIDE.md

"@ -ForegroundColor Cyan
}

# Main script execution
Clear-Host
Write-Host "🔐 ODAVL Studio OAuth Setup" -ForegroundColor Cyan
Write-Host "============================`n" -ForegroundColor Cyan

# Handle flags
if ($Help) {
    Show-Help
}

if ($Generate) {
    if (Test-Prerequisites) {
        $secret = Generate-NextAuthSecret
        if ($secret) {
            Write-Host "`n✅ Secret generation complete!" -ForegroundColor Green
        }
    }
    exit 0
}

if ($Verify) {
    if (Test-Prerequisites) {
        $isConfigured = Verify-OAuthConfig
        exit $(if ($isConfigured) { 0 } else { 1 })
    } else {
        exit 1
    }
}

# Interactive mode
if (!(Test-Prerequisites)) {
    Write-Host "`n⚠️  Please fix prerequisites first" -ForegroundColor Yellow
    exit 1
}

# Check NEXTAUTH_SECRET
$envContent = Get-Content "apps/studio-hub/.env.local" -Raw
if ($envContent -notmatch 'NEXTAUTH_SECRET=' -or $envContent -match 'NEXTAUTH_SECRET=""') {
    Write-Host "`n⚠️  NEXTAUTH_SECRET not configured" -ForegroundColor Yellow
    $response = Read-Host "Generate NEXTAUTH_SECRET now? (Y/n)"
    
    if ($response -ne 'n' -and $response -ne 'N') {
        $null = Generate-NextAuthSecret
    }
}

# Show verification status
Write-Host ""
$isConfigured = Verify-OAuthConfig

if (!$isConfigured) {
    Show-NextSteps
}

Write-Host "`n✅ Setup script complete!" -ForegroundColor Green
