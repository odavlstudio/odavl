#!/usr/bin/env pwsh
<#
.SYNOPSIS
    ODAVL Guardian - Direct launcher (no pnpm wrapper)
.DESCRIPTION
    Clean launcher that bypasses pnpm for cleaner output
#>

param(
    [Parameter(Mandatory=$true, Position=0)]
    [string]$Url,
    
    [Parameter(ValueFromRemainingArguments=$true)]
    [string[]]$RemainingArgs
)

# Set UTF-8 encoding for proper emoji display
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$env:NODE_NO_WARNINGS = "1"

# Get paths
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$rootDir = Split-Path -Parent $scriptDir
$guardianCli = Join-Path $rootDir "odavl-studio\guardian\core\src\guardian-cli.ts"

# Build arguments
$args = @($guardianCli, $Url)
if ($RemainingArgs) {
    $args += $RemainingArgs
}

# Execute with tsx directly (cleaner than pnpm)
& pnpm exec tsx @args 2>&1 | Where-Object { 
    $line = $_.ToString()
    # Filter out pnpm noise
    $line -notmatch 'ELIFECYCLE' -and 
    $line -notmatch 'Command failed with exit code'
}

# Preserve exit code for CI/CD
exit $LASTEXITCODE
