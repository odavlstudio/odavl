#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Add GitHub Secrets to ODAVL Studio repository

.DESCRIPTION
    This script automates adding all 19 required GitHub Secrets for ODAVL Studio v2.0.
    It reads secrets from a JSON file and uses GitHub CLI to add them to the repository.

.PARAMETER SecretsFile
    Path to JSON file containing secrets (default: secrets.json)

.PARAMETER DryRun
    Show what would be added without actually adding secrets

.PARAMETER Verify
    Verify secrets after adding them

.EXAMPLE
    .\add-github-secrets.ps1
    # Interactive mode - prompts for each secret

.EXAMPLE
    .\add-github-secrets.ps1 -SecretsFile secrets.json
    # Read from file

.EXAMPLE
    .\add-github-secrets.ps1 -DryRun
    # Test run without actually adding

.NOTES
    Author: ODAVL Studio Team
    Version: 1.0
    Requires: GitHub CLI (gh)
#>

[CmdletBinding()]
param(
    [Parameter()]
    [string]$SecretsFile = "secrets.json",
    
    [Parameter()]
    [switch]$DryRun,
    
    [Parameter()]
    [switch]$Verify
)

# Colors
$Red = "`e[31m"
$Green = "`e[32m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Magenta = "`e[35m"
$Cyan = "`e[36m"
$Reset = "`e[0m"

# Banner
function Show-Banner {
    Write-Host ""
    Write-Host "${Cyan}╔═══════════════════════════════════════════════════════════════╗${Reset}"
    Write-Host "${Cyan}║${Reset}  ${Magenta}🔐 ODAVL Studio - GitHub Secrets Setup${Reset}               ${Cyan}║${Reset}"
    Write-Host "${Cyan}╚═══════════════════════════════════════════════════════════════╝${Reset}"
    Write-Host ""
}

# Check prerequisites
function Test-Prerequisites {
    Write-Host "${Blue}[1/3]${Reset} Checking prerequisites..." -NoNewline
    
    # Check GitHub CLI
    if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
        Write-Host " ${Red}✗${Reset}"
        Write-Host ""
        Write-Host "${Red}Error:${Reset} GitHub CLI (gh) is not installed."
        Write-Host ""
        Write-Host "${Yellow}Install:${Reset}"
        Write-Host "  Windows: ${Cyan}winget install --id GitHub.cli${Reset}"
        Write-Host "  Mac:     ${Cyan}brew install gh${Reset}"
        Write-Host "  Linux:   ${Cyan}sudo apt install gh${Reset}"
        Write-Host ""
        exit 1
    }
    
    # Check if authenticated
    $auth = gh auth status 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host " ${Red}✗${Reset}"
        Write-Host ""
        Write-Host "${Red}Error:${Reset} Not authenticated with GitHub CLI."
        Write-Host ""
        Write-Host "${Yellow}Run:${Reset} ${Cyan}gh auth login${Reset}"
        Write-Host ""
        exit 1
    }
    
    Write-Host " ${Green}✓${Reset}"
}

# Required secrets definition
function Get-RequiredSecrets {
    return @(
        @{
            Name = "STAGING_DATABASE_URL"
            Description = "PostgreSQL connection string for staging environment"
            Example = "postgresql://user:pass@host.railway.app:5432/staging_db?sslmode=require"
            Required = $true
            Category = "Database"
        },
        @{
            Name = "PRODUCTION_DATABASE_URL"
            Description = "PostgreSQL connection string for production environment"
            Example = "postgresql://user:pass@host.railway.app:5432/prod_db?sslmode=require"
            Required = $true
            Category = "Database"
        },
        @{
            Name = "STAGING_NEXTAUTH_SECRET"
            Description = "NextAuth encryption secret for staging (32+ random chars)"
            Example = "run: openssl rand -base64 32"
            Required = $true
            Category = "Authentication"
        },
        @{
            Name = "PRODUCTION_NEXTAUTH_SECRET"
            Description = "NextAuth encryption secret for production (32+ random chars)"
            Example = "run: openssl rand -base64 32"
            Required = $true
            Category = "Authentication"
        },
        @{
            Name = "STAGING_URL"
            Description = "Staging environment URL"
            Example = "https://staging-odavl-insight.vercel.app"
            Required = $true
            Category = "Authentication"
        },
        @{
            Name = "VERCEL_TOKEN"
            Description = "Vercel API token for deployments"
            Example = "Get from: https://vercel.com/account/tokens"
            Required = $true
            Category = "Deployment"
        },
        @{
            Name = "VERCEL_ORG_ID"
            Description = "Vercel organization ID"
            Example = "Get from: .vercel/project.json after 'vercel link'"
            Required = $true
            Category = "Deployment"
        },
        @{
            Name = "VERCEL_PROJECT_ID"
            Description = "Vercel project ID"
            Example = "Get from: .vercel/project.json after 'vercel link'"
            Required = $true
            Category = "Deployment"
        },
        @{
            Name = "SNYK_TOKEN"
            Description = "Snyk API token for security scanning"
            Example = "Get from: https://app.snyk.io/account"
            Required = $true
            Category = "Security"
        },
        @{
            Name = "SNYK_ORG_ID"
            Description = "Snyk organization ID"
            Example = "Get from Snyk dashboard URL"
            Required = $true
            Category = "Security"
        },
        @{
            Name = "SLACK_WEBHOOK"
            Description = "Slack webhook for deployment notifications"
            Example = "https://hooks.slack.com/services/T.../B.../xxx"
            Required = $true
            Category = "Notifications"
        },
        @{
            Name = "CLOUDFLARE_ACCOUNT_ID"
            Description = "Cloudflare account ID for CDN"
            Example = "Get from Cloudflare dashboard URL"
            Required = $false
            Category = "CDN"
        },
        @{
            Name = "CLOUDFLARE_API_TOKEN"
            Description = "Cloudflare API token"
            Example = "Create token with Workers & Cache permissions"
            Required = $false
            Category = "CDN"
        },
        @{
            Name = "CLOUDFLARE_ZONE_ID"
            Description = "Cloudflare zone ID for domain"
            Example = "Get from domain Overview page in Cloudflare"
            Required = $false
            Category = "CDN"
        },
        @{
            Name = "AWS_ACCESS_KEY_ID"
            Description = "AWS access key for S3 backups"
            Example = "Get from AWS IAM console"
            Required = $false
            Category = "Cloud Storage"
        },
        @{
            Name = "AWS_SECRET_ACCESS_KEY"
            Description = "AWS secret key for S3 backups"
            Example = "Get from AWS IAM console (shown only once!)"
            Required = $false
            Category = "Cloud Storage"
        },
        @{
            Name = "CLOUDFRONT_DISTRIBUTION_ID"
            Description = "CloudFront distribution ID"
            Example = "Get from CloudFront console"
            Required = $false
            Category = "Cloud Storage"
        },
        @{
            Name = "AZURE_STORAGE_CONNECTION_STRING"
            Description = "Azure Blob Storage connection string"
            Example = "Get from Azure Portal → Storage Account → Access keys"
            Required = $false
            Category = "Cloud Storage"
        },
        @{
            Name = "GITLEAKS_LICENSE"
            Description = "GitLeaks Pro license key (optional - works without)"
            Example = "Get from: https://gitleaks.io/"
            Required = $false
            Category = "Security"
        }
    )
}

# Interactive secret input
function Read-SecretValue {
    param(
        [Parameter(Mandatory)]
        [hashtable]$SecretInfo
    )
    
    Write-Host ""
    Write-Host "${Cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${Reset}"
    Write-Host "${Yellow}Secret:${Reset} $($SecretInfo.Name)"
    Write-Host "${Yellow}Category:${Reset} $($SecretInfo.Category)"
    Write-Host "${Yellow}Description:${Reset} $($SecretInfo.Description)"
    Write-Host "${Yellow}Example:${Reset} $($SecretInfo.Example)"
    
    if ($SecretInfo.Required) {
        Write-Host "${Red}[REQUIRED]${Reset}"
    } else {
        Write-Host "${Blue}[OPTIONAL]${Reset} (press Enter to skip)"
    }
    
    Write-Host ""
    $value = Read-Host "Enter value (input hidden)" -AsSecureString
    
    # Convert SecureString to plain text
    $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($value)
    $plainValue = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
    [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    
    return $plainValue
}

# Add secret to GitHub
function Add-GitHubSecret {
    param(
        [Parameter(Mandatory)]
        [string]$Name,
        
        [Parameter(Mandatory)]
        [string]$Value
    )
    
    if ($DryRun) {
        Write-Host "${Blue}[DRY RUN]${Reset} Would add secret: ${Green}$Name${Reset}"
        return $true
    }
    
    # Add secret via GitHub CLI
    $Value | gh secret set $Name 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ${Green}✓${Reset} $Name"
        return $true
    } else {
        Write-Host "  ${Red}✗${Reset} $Name ${Red}(failed)${Reset}"
        return $false
    }
}

# Verify secrets exist
function Test-GitHubSecrets {
    Write-Host ""
    Write-Host "${Blue}[3/3]${Reset} Verifying secrets..." -NoNewline
    
    $existingSecrets = gh secret list --json name | ConvertFrom-Json
    $secretNames = $existingSecrets | ForEach-Object { $_.name }
    
    Write-Host " ${Green}✓${Reset}"
    Write-Host ""
    
    $requiredSecrets = Get-RequiredSecrets | Where-Object { $_.Required }
    $missing = @()
    
    foreach ($secret in $requiredSecrets) {
        if ($secretNames -contains $secret.Name) {
            Write-Host "  ${Green}✓${Reset} $($secret.Name)"
        } else {
            Write-Host "  ${Red}✗${Reset} $($secret.Name) ${Red}(missing)${Reset}"
            $missing += $secret.Name
        }
    }
    
    if ($missing.Count -eq 0) {
        Write-Host ""
        Write-Host "${Green}Success:${Reset} All required secrets are configured! 🎉"
        return $true
    } else {
        Write-Host ""
        Write-Host "${Red}Warning:${Reset} $($missing.Count) required secret(s) missing:"
        $missing | ForEach-Object { Write-Host "  - $_" }
        return $false
    }
}

# Generate random secret
function New-RandomSecret {
    param(
        [int]$Length = 32
    )
    
    $bytes = New-Object byte[] $Length
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    return [Convert]::ToBase64String($bytes)
}

# Main execution
function Start-Setup {
    Show-Banner
    Test-Prerequisites
    
    Write-Host "${Blue}[2/3]${Reset} Adding secrets..."
    Write-Host ""
    
    if ($DryRun) {
        Write-Host "${Yellow}Running in DRY RUN mode - no secrets will be added${Reset}"
        Write-Host ""
    }
    
    $secrets = Get-RequiredSecrets
    $added = 0
    $skipped = 0
    $failed = 0
    
    # Check if secrets file exists
    if (Test-Path $SecretsFile) {
        Write-Host "${Blue}Reading from file:${Reset} $SecretsFile"
        $secretsData = Get-Content $SecretsFile | ConvertFrom-Json
        
        foreach ($secret in $secrets) {
            $value = $secretsData.($secret.Name)
            
            if ($value) {
                $success = Add-GitHubSecret -Name $secret.Name -Value $value
                if ($success) { $added++ } else { $failed++ }
            } else {
                Write-Host "  ${Yellow}○${Reset} $($secret.Name) ${Yellow}(not in file)${Reset}"
                $skipped++
            }
        }
    } else {
        # Interactive mode
        Write-Host "${Yellow}Interactive mode:${Reset} Enter secrets manually"
        Write-Host "${Blue}Tip:${Reset} Generate random secrets with: ${Cyan}openssl rand -base64 32${Reset}"
        
        foreach ($secret in $secrets) {
            $value = Read-SecretValue -SecretInfo $secret
            
            if ([string]::IsNullOrWhiteSpace($value)) {
                if ($secret.Required) {
                    Write-Host "${Red}Error:${Reset} Required secret cannot be empty"
                    Write-Host "Please enter a value:"
                    $value = Read-SecretValue -SecretInfo $secret
                    
                    if ([string]::IsNullOrWhiteSpace($value)) {
                        Write-Host "${Red}Skipping required secret - setup incomplete!${Reset}"
                        $failed++
                        continue
                    }
                } else {
                    Write-Host "${Blue}Skipped${Reset} (optional)"
                    $skipped++
                    continue
                }
            }
            
            $success = Add-GitHubSecret -Name $secret.Name -Value $value
            if ($success) { $added++ } else { $failed++ }
        }
    }
    
    # Summary
    Write-Host ""
    Write-Host "${Cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${Reset}"
    Write-Host "${Magenta}Summary:${Reset}"
    Write-Host "  Added:   ${Green}$added${Reset}"
    Write-Host "  Skipped: ${Yellow}$skipped${Reset}"
    Write-Host "  Failed:  ${Red}$failed${Reset}"
    Write-Host "${Cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${Reset}"
    
    # Verify if requested
    if ($Verify -and -not $DryRun) {
        Test-GitHubSecrets
    }
    
    if ($failed -eq 0 -and $added -gt 0) {
        Write-Host ""
        Write-Host "${Green}✓ Secrets setup complete!${Reset}"
        Write-Host ""
        Write-Host "${Blue}Next steps:${Reset}"
        Write-Host "  1. Test secrets: ${Cyan}gh workflow run test-secrets.yml${Reset}"
        Write-Host "  2. Deploy staging: ${Cyan}gh workflow run deploy-staging.yml${Reset}"
        Write-Host "  3. Monitor: ${Cyan}gh run list${Reset}"
        Write-Host ""
    } elseif ($failed -gt 0) {
        Write-Host ""
        Write-Host "${Red}⚠ Some secrets failed to add.${Reset}"
        Write-Host "${Yellow}Please check the errors above and try again.${Reset}"
        Write-Host ""
        exit 1
    }
}

# Helper command to generate random secret
function New-AuthSecret {
    Write-Host "${Green}Generated random secret (32 bytes):${Reset}"
    $secret = New-RandomSecret
    Write-Host $secret
    Write-Host ""
    Write-Host "${Yellow}Save this securely - it won't be shown again!${Reset}"
}

# Helper command to verify setup
function Test-Setup {
    Show-Banner
    Test-Prerequisites
    Test-GitHubSecrets
}

# Execute
try {
    Start-Setup
} catch {
    Write-Host ""
    Write-Host "${Red}Error:${Reset} $($_.Exception.Message)"
    Write-Host ""
    exit 1
}
