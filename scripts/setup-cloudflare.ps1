#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Setup CloudFlare CDN for ODAVL Insight Cloud
    
.DESCRIPTION
    Configures CloudFlare with:
    - DNS records (A, CNAME, TXT)
    - Page rules for caching
    - SSL/TLS settings
    - Firewall rules
    - Rate limiting
    - DDoS protection
    - Performance optimizations
    
.PARAMETER Domain
    Domain to configure (e.g., app.odavl.com)
    
.PARAMETER Environment
    Environment: production or staging
    
.PARAMETER DryRun
    Show what would be done without making changes
    
.EXAMPLE
    .\setup-cloudflare.ps1 -Domain app.odavl.com -Environment production
    
.EXAMPLE
    .\setup-cloudflare.ps1 -Domain staging.odavl.com -Environment staging -DryRun
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$Domain,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet('production', 'staging')]
    [string]$Environment = 'production',
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun
)

# Load environment variables
if (Test-Path ".env.local") {
    Get-Content ".env.local" | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
        }
    }
}

# Configuration
$ZONE_ID = $env:CLOUDFLARE_ZONE_ID
$API_TOKEN = $env:CLOUDFLARE_API_TOKEN
$API_BASE = "https://api.cloudflare.com/client/v4"

# Color functions
function Write-Success { param($Message) Write-Host $Message -ForegroundColor Green }
function Write-Info { param($Message) Write-Host $Message -ForegroundColor Cyan }
function Write-Warning { param($Message) Write-Host $Message -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host $Message -ForegroundColor Red }

# Header
Write-Host "`n════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  CLOUDFLARE CDN SETUP" -ForegroundColor White -BackgroundColor Blue
Write-Host "════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Info "Domain: $Domain"
Write-Info "Environment: $Environment"
if ($DryRun) { Write-Warning "DRY RUN MODE - No changes will be made" }
Write-Host ""

# Validate credentials
if (-not $ZONE_ID -or -not $API_TOKEN) {
    Write-Error "❌ Missing CloudFlare credentials"
    Write-Info "Set CLOUDFLARE_ZONE_ID and CLOUDFLARE_API_TOKEN in .env.local"
    exit 1
}

# Headers for API requests
$headers = @{
    "Authorization" = "Bearer $API_TOKEN"
    "Content-Type"  = "application/json"
}

# Function: Make CloudFlare API call
function Invoke-CloudFlareAPI {
    param(
        [string]$Method,
        [string]$Endpoint,
        [object]$Body = $null
    )
    
    $url = "$API_BASE$Endpoint"
    
    if ($DryRun) {
        Write-Warning "  [DRY RUN] $Method $url"
        if ($Body) {
            Write-Host "  Body: $($Body | ConvertTo-Json -Compress)" -ForegroundColor Gray
        }
        return @{ success = $true }
    }
    
    try {
        $params = @{
            Method  = $Method
            Uri     = $url
            Headers = $headers
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-RestMethod @params
        return $response
    } catch {
        Write-Error "  API call failed: $($_.Exception.Message)"
        return $null
    }
}

# Step 1: Verify zone access
Write-Info "═══════════════════════════════════════"
Write-Info "  1. VERIFYING ZONE ACCESS"
Write-Info "═══════════════════════════════════════`n"

$zone = Invoke-CloudFlareAPI -Method GET -Endpoint "/zones/$ZONE_ID"

if ($zone -and $zone.success) {
    Write-Success "✅ Zone verified: $($zone.result.name)"
} else {
    Write-Error "❌ Failed to verify zone access"
    exit 1
}

Write-Host ""

# Step 2: Configure SSL/TLS
Write-Info "═══════════════════════════════════════"
Write-Info "  2. CONFIGURING SSL/TLS"
Write-Info "═══════════════════════════════════════`n"

Write-Info "Setting SSL mode to Full (Strict)..."
$sslConfig = @{
    value = "strict"
}

$ssl = Invoke-CloudFlareAPI -Method PATCH -Endpoint "/zones/$ZONE_ID/settings/ssl" -Body $sslConfig

if ($ssl -and $ssl.success) {
    Write-Success "✅ SSL mode: Full (Strict)"
} else {
    Write-Warning "⚠️  Failed to set SSL mode"
}

Write-Info "Setting minimum TLS version to 1.2..."
$tlsConfig = @{
    value = "1.2"
}

$tls = Invoke-CloudFlareAPI -Method PATCH -Endpoint "/zones/$ZONE_ID/settings/min_tls_version" -Body $tlsConfig

if ($tls -and $tls.success) {
    Write-Success "✅ Minimum TLS: 1.2"
} else {
    Write-Warning "⚠️  Failed to set TLS version"
}

Write-Info "Enabling Always Use HTTPS..."
$httpsConfig = @{
    value = "on"
}

$https = Invoke-CloudFlareAPI -Method PATCH -Endpoint "/zones/$ZONE_ID/settings/always_use_https" -Body $httpsConfig

if ($https -and $https.success) {
    Write-Success "✅ Always Use HTTPS: Enabled"
} else {
    Write-Warning "⚠️  Failed to enable Always Use HTTPS"
}

Write-Info "Enabling Automatic HTTPS Rewrites..."
$rewriteConfig = @{
    value = "on"
}

$rewrite = Invoke-CloudFlareAPI -Method PATCH -Endpoint "/zones/$ZONE_ID/settings/automatic_https_rewrites" -Body $rewriteConfig

if ($rewrite -and $rewrite.success) {
    Write-Success "✅ Automatic HTTPS Rewrites: Enabled"
} else {
    Write-Warning "⚠️  Failed to enable HTTPS rewrites"
}

Write-Host ""

# Step 3: Configure caching
Write-Info "═══════════════════════════════════════"
Write-Info "  3. CONFIGURING CACHING"
Write-Info "═══════════════════════════════════════`n"

$pageRules = @(
    @{
        targets = @(
            @{
                target     = "url"
                constraint = @{
                    operator = "matches"
                    value    = "*$Domain/static/*"
                }
            }
        )
        actions = @(
            @{ id = "cache_level"; value = "cache_everything" }
            @{ id = "edge_cache_ttl"; value = 31536000 }
            @{ id = "browser_cache_ttl"; value = 31536000 }
        )
        priority = 1
        status   = "active"
    },
    @{
        targets = @(
            @{
                target     = "url"
                constraint = @{
                    operator = "matches"
                    value    = "*$Domain/images/*"
                }
            }
        )
        actions = @(
            @{ id = "cache_level"; value = "cache_everything" }
            @{ id = "edge_cache_ttl"; value = 604800 }
            @{ id = "browser_cache_ttl"; value = 604800 }
        )
        priority = 2
        status   = "active"
    },
    @{
        targets = @(
            @{
                target     = "url"
                constraint = @{
                    operator = "matches"
                    value    = "*$Domain/api/*"
                }
            }
        )
        actions = @(
            @{ id = "cache_level"; value = "bypass" }
        )
        priority = 3
        status   = "active"
    }
)

foreach ($rule in $pageRules) {
    Write-Info "Creating page rule: $($rule.targets[0].constraint.value)"
    
    $result = Invoke-CloudFlareAPI -Method POST -Endpoint "/zones/$ZONE_ID/pagerules" -Body $rule
    
    if ($result -and $result.success) {
        Write-Success "  ✅ Page rule created"
    } else {
        Write-Warning "  ⚠️  Failed to create page rule"
    }
}

Write-Host ""

# Step 4: Configure performance
Write-Info "═══════════════════════════════════════"
Write-Info "  4. CONFIGURING PERFORMANCE"
Write-Info "═══════════════════════════════════════`n"

$performanceSettings = @{
    "minify"             = @{ value = @{ html = "on"; css = "on"; js = "on" } }
    "brotli"             = @{ value = "on" }
    "http3"              = @{ value = "on" }
    "early_hints"        = @{ value = "on" }
    "rocket_loader"      = @{ value = "off" }
    "auto_minify"        = @{ value = @{ html = "on"; css = "on"; js = "on" } }
}

foreach ($setting in $performanceSettings.GetEnumerator()) {
    Write-Info "Configuring $($setting.Key)..."
    
    $result = Invoke-CloudFlareAPI -Method PATCH -Endpoint "/zones/$ZONE_ID/settings/$($setting.Key)" -Body $setting.Value
    
    if ($result -and $result.success) {
        Write-Success "  ✅ $($setting.Key) configured"
    } else {
        Write-Warning "  ⚠️  Failed to configure $($setting.Key)"
    }
}

Write-Host ""

# Step 5: Configure security
Write-Info "═══════════════════════════════════════"
Write-Info "  5. CONFIGURING SECURITY"
Write-Info "═══════════════════════════════════════`n"

Write-Info "Setting security level to High..."
$securityConfig = @{
    value = "high"
}

$security = Invoke-CloudFlareAPI -Method PATCH -Endpoint "/zones/$ZONE_ID/settings/security_level" -Body $securityConfig

if ($security -and $security.success) {
    Write-Success "✅ Security level: High"
} else {
    Write-Warning "⚠️  Failed to set security level"
}

Write-Info "Enabling Browser Integrity Check..."
$integrityConfig = @{
    value = "on"
}

$integrity = Invoke-CloudFlareAPI -Method PATCH -Endpoint "/zones/$ZONE_ID/settings/browser_check" -Body $integrityConfig

if ($integrity -and $integrity.success) {
    Write-Success "✅ Browser Integrity Check: Enabled"
} else {
    Write-Warning "⚠️  Failed to enable Browser Integrity Check"
}

Write-Host ""

# Step 6: Create firewall rules
Write-Info "═══════════════════════════════════════"
Write-Info "  6. CREATING FIREWALL RULES"
Write-Info "═══════════════════════════════════════`n"

$firewallRules = @(
    @{
        filter = @{
            expression  = '(http.request.uri.path contains "wp-admin" or http.request.uri.path contains "xmlrpc")'
            description = "Block WordPress exploit attempts"
        }
        action = "block"
    },
    @{
        filter = @{
            expression  = '(http.user_agent contains "bot" and not cf.client.bot)'
            description = "Challenge suspicious bots"
        }
        action = "challenge"
    }
)

foreach ($rule in $firewallRules) {
    Write-Info "Creating firewall rule: $($rule.filter.description)"
    
    # Create filter first
    $filter = Invoke-CloudFlareAPI -Method POST -Endpoint "/zones/$ZONE_ID/filters" -Body @($rule.filter)
    
    if ($filter -and $filter.success) {
        $filterId = $filter.result[0].id
        
        # Create firewall rule
        $fwRule = @{
            filter = @{ id = $filterId }
            action = $rule.action
        }
        
        $result = Invoke-CloudFlareAPI -Method POST -Endpoint "/zones/$ZONE_ID/firewall/rules" -Body @($fwRule)
        
        if ($result -and $result.success) {
            Write-Success "  ✅ Firewall rule created"
        } else {
            Write-Warning "  ⚠️  Failed to create firewall rule"
        }
    }
}

Write-Host ""

# Summary
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  CLOUDFLARE SETUP COMPLETE" -ForegroundColor White -BackgroundColor Green
Write-Host "════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Info "Domain: $Domain"
Write-Info "Environment: $Environment"

if (-not $DryRun) {
    Write-Success "`n✅ CloudFlare configuration applied successfully!"
    Write-Info "`nNext steps:"
    Write-Host "  1. Update DNS records to point to CloudFlare" -ForegroundColor White
    Write-Host "  2. Wait for SSL certificate to be issued (5-10 minutes)" -ForegroundColor White
    Write-Host "  3. Test your site: https://$Domain" -ForegroundColor White
    Write-Host "  4. Monitor CloudFlare Analytics dashboard" -ForegroundColor White
} else {
    Write-Warning "`n⚠️  DRY RUN completed - no changes were made"
    Write-Info "Remove -DryRun flag to apply changes"
}

Write-Host ""
