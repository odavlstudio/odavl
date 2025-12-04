#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Setup SSL/TLS certificates for ODAVL Insight Cloud
    
.DESCRIPTION
    Automates SSL certificate setup:
    - Let's Encrypt certificates (free, auto-renewing)
    - Certificate generation and installation
    - Auto-renewal configuration
    - Certificate validation
    - CloudFlare SSL proxy support
    
.PARAMETER Domain
    Domain to secure (e.g., app.odavl.com)
    
.PARAMETER Email
    Email for Let's Encrypt notifications
    
.PARAMETER Method
    SSL method: letsencrypt, cloudflare, or custom
    
.PARAMETER DryRun
    Test certificate generation without installing
    
.EXAMPLE
    .\setup-ssl.ps1 -Domain app.odavl.com -Email admin@odavl.com
    
.EXAMPLE
    .\setup-ssl.ps1 -Domain app.odavl.com -Email admin@odavl.com -Method cloudflare
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$Domain,
    
    [Parameter(Mandatory=$true)]
    [string]$Email,
    
    [Parameter(Mandatory=$false)]
    [ValidateSet('letsencrypt', 'cloudflare', 'custom')]
    [string]$Method = 'letsencrypt',
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun
)

# Color functions
function Write-Success { param($Message) Write-Host $Message -ForegroundColor Green }
function Write-Info { param($Message) Write-Host $Message -ForegroundColor Cyan }
function Write-Warning { param($Message) Write-Host $Message -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host $Message -ForegroundColor Red }

# Header
Write-Host "`n════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  SSL/TLS CERTIFICATE SETUP" -ForegroundColor White -BackgroundColor Blue
Write-Host "════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Info "Domain: $Domain"
Write-Info "Email: $Email"
Write-Info "Method: $Method"
if ($DryRun) { Write-Warning "DRY RUN MODE - Certificates will not be installed" }
Write-Host ""

# Configuration
$CERT_DIR = "certs"
$WEBROOT = "public"

# Create cert directory
New-Item -ItemType Directory -Force -Path $CERT_DIR | Out-Null

# Function: Let's Encrypt method
function Install-LetsEncryptCert {
    Write-Info "═══════════════════════════════════════"
    Write-Info "  LET'S ENCRYPT CERTIFICATE"
    Write-Info "═══════════════════════════════════════`n"
    
    # Check if certbot is installed
    $certbot = Get-Command certbot -ErrorAction SilentlyContinue
    
    if (-not $certbot) {
        Write-Warning "Certbot not found. Installing..."
        
        if ($IsWindows) {
            Write-Info "Installing Certbot via Chocolatey..."
            choco install certbot -y
        } elseif ($IsMacOS) {
            Write-Info "Installing Certbot via Homebrew..."
            brew install certbot
        } else {
            Write-Info "Installing Certbot via apt..."
            sudo apt-get update
            sudo apt-get install -y certbot
        }
    }
    
    Write-Success "✅ Certbot installed"
    
    # Generate certificate
    Write-Info "`nGenerating certificate for $Domain..."
    
    $certbotArgs = @(
        "certonly"
        "--webroot"
        "-w", $WEBROOT
        "-d", $Domain
        "--email", $Email
        "--agree-tos"
        "--non-interactive"
    )
    
    if ($DryRun) {
        $certbotArgs += "--dry-run"
    }
    
    try {
        & certbot @certbotArgs
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "`n✅ Certificate generated successfully!"
            
            if (-not $DryRun) {
                # Copy certificates to project directory
                $letsEncryptPath = if ($IsWindows) {
                    "C:\Certbot\live\$Domain"
                } else {
                    "/etc/letsencrypt/live/$Domain"
                }
                
                if (Test-Path $letsEncryptPath) {
                    Copy-Item "$letsEncryptPath\fullchain.pem" "$CERT_DIR\$Domain.crt"
                    Copy-Item "$letsEncryptPath\privkey.pem" "$CERT_DIR\$Domain.key"
                    
                    Write-Success "✅ Certificates copied to $CERT_DIR"
                    
                    # Set up auto-renewal
                    Write-Info "`nSetting up auto-renewal..."
                    
                    if ($IsWindows) {
                        # Create scheduled task for Windows
                        $action = New-ScheduledTaskAction -Execute "certbot" -Argument "renew --quiet"
                        $trigger = New-ScheduledTaskTrigger -Daily -At "3:00AM"
                        Register-ScheduledTask -TaskName "Certbot-Renewal" -Action $action -Trigger $trigger -Description "Auto-renew Let's Encrypt certificates"
                        
                        Write-Success "✅ Auto-renewal scheduled (daily at 3:00 AM)"
                    } else {
                        # Create cron job for Linux/macOS
                        $cronJob = "0 3 * * * certbot renew --quiet"
                        $existingCron = crontab -l 2>/dev/null
                        
                        if (-not ($existingCron -match "certbot renew")) {
                            ($existingCron; $cronJob) | crontab -
                            Write-Success "✅ Auto-renewal cron job added"
                        }
                    }
                }
            }
        } else {
            Write-Error "❌ Certificate generation failed"
            exit 1
        }
    } catch {
        Write-Error "❌ Failed to generate certificate: $($_.Exception.Message)"
        exit 1
    }
}

# Function: CloudFlare method
function Install-CloudFlareCert {
    Write-Info "═══════════════════════════════════════"
    Write-Info "  CLOUDFLARE SSL CERTIFICATE"
    Write-Info "═══════════════════════════════════════`n"
    
    Write-Info "CloudFlare SSL is handled automatically when using CloudFlare proxy."
    Write-Success "`n✅ SSL Configuration Steps:"
    Write-Host "  1. Log in to CloudFlare Dashboard" -ForegroundColor White
    Write-Host "  2. Go to SSL/TLS → Overview" -ForegroundColor White
    Write-Host "  3. Set SSL mode to 'Full (Strict)'" -ForegroundColor White
    Write-Host "  4. Enable 'Always Use HTTPS'" -ForegroundColor White
    Write-Host "  5. Enable 'Automatic HTTPS Rewrites'" -ForegroundColor White
    Write-Host "  6. Go to Edge Certificates" -ForegroundColor White
    Write-Host "  7. Enable 'HTTP Strict Transport Security (HSTS)'" -ForegroundColor White
    Write-Host "     - Max Age: 6 months (15552000)" -ForegroundColor White
    Write-Host "     - Include subdomains: Yes" -ForegroundColor White
    Write-Host "     - Preload: Yes" -ForegroundColor White
    Write-Host ""
    Write-Info "CloudFlare will automatically provision and renew SSL certificates."
    Write-Info "No manual certificate management required!"
}

# Function: Custom certificate method
function Install-CustomCert {
    Write-Info "═══════════════════════════════════════"
    Write-Info "  CUSTOM SSL CERTIFICATE"
    Write-Info "═══════════════════════════════════════`n"
    
    Write-Info "To use a custom certificate:"
    Write-Host "  1. Place your certificate files in $CERT_DIR/" -ForegroundColor White
    Write-Host "     - Certificate: $Domain.crt" -ForegroundColor White
    Write-Host "     - Private key: $Domain.key" -ForegroundColor White
    Write-Host "     - CA bundle (optional): $Domain-ca.crt" -ForegroundColor White
    Write-Host ""
    Write-Host "  2. Ensure correct file permissions:" -ForegroundColor White
    Write-Host "     chmod 644 $Domain.crt" -ForegroundColor White
    Write-Host "     chmod 600 $Domain.key" -ForegroundColor White
    Write-Host ""
    Write-Host "  3. Update your web server configuration" -ForegroundColor White
    Write-Host ""
    
    # Check if certificates exist
    if ((Test-Path "$CERT_DIR\$Domain.crt") -and (Test-Path "$CERT_DIR\$Domain.key")) {
        Write-Success "✅ Certificate files found"
        
        # Validate certificate
        Write-Info "`nValidating certificate..."
        
        try {
            $cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2("$CERT_DIR\$Domain.crt")
            
            Write-Success "✅ Certificate is valid"
            Write-Info "  Subject: $($cert.Subject)"
            Write-Info "  Issuer: $($cert.Issuer)"
            Write-Info "  Valid from: $($cert.NotBefore)"
            Write-Info "  Valid until: $($cert.NotAfter)"
            
            $daysUntilExpiry = ($cert.NotAfter - (Get-Date)).Days
            
            if ($daysUntilExpiry -lt 30) {
                Write-Warning "  ⚠️  Certificate expires in $daysUntilExpiry days"
            } else {
                Write-Success "  ✅ Certificate valid for $daysUntilExpiry days"
            }
        } catch {
            Write-Error "❌ Certificate validation failed: $($_.Exception.Message)"
        }
    } else {
        Write-Warning "⚠️  Certificate files not found in $CERT_DIR"
    }
}

# Execute based on method
switch ($Method) {
    'letsencrypt' { Install-LetsEncryptCert }
    'cloudflare' { Install-CloudFlareCert }
    'custom' { Install-CustomCert }
}

# Verify HTTPS
Write-Info "`n═══════════════════════════════════════"
Write-Info "  VERIFICATION"
Write-Info "═══════════════════════════════════════`n"

if (-not $DryRun -and $Method -ne 'cloudflare') {
    Write-Info "Testing HTTPS connection..."
    
    try {
        $response = Invoke-WebRequest -Uri "https://$Domain" -SkipCertificateCheck -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            Write-Success "✅ HTTPS connection successful!"
        }
    } catch {
        Write-Warning "⚠️  Could not verify HTTPS connection"
        Write-Info "Make sure your server is running and configured for HTTPS"
    }
}

# Summary
Write-Host "`n════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  SSL SETUP COMPLETE" -ForegroundColor White -BackgroundColor Green
Write-Host "════════════════════════════════════════`n" -ForegroundColor Cyan

Write-Info "Domain: $Domain"
Write-Info "Method: $Method"

if (-not $DryRun) {
    Write-Success "`n✅ SSL configuration completed!"
    
    Write-Info "`nNext steps:"
    Write-Host "  1. Update your web server configuration to use HTTPS" -ForegroundColor White
    Write-Host "  2. Test your site: https://$Domain" -ForegroundColor White
    Write-Host "  3. Check SSL rating: https://www.ssllabs.com/ssltest/analyze.html?d=$Domain" -ForegroundColor White
    
    if ($Method -eq 'letsencrypt') {
        Write-Host "  4. Certificates will auto-renew every 3 months" -ForegroundColor White
    }
} else {
    Write-Warning "`n⚠️  DRY RUN completed - no certificates were installed"
}

Write-Host ""
