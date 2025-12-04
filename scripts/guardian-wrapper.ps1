#!/usr/bin/env pwsh
<#
.SYNOPSIS
    ODAVL Guardian wrapper - hides pnpm error messages
.DESCRIPTION
    Clean wrapper that only shows Guardian output
#>

param(
    [Parameter(Mandatory=$true, Position=0)]
    [string]$Url,
    
    [Parameter(ValueFromRemainingArguments=$true)]
    [string[]]$RemainingArgs
)

# Run Guardian CLI directly with tsx (bypass pnpm)
$guardianPath = Join-Path $PSScriptRoot ".." "odavl-studio" "guardian" "core" "src" "guardian-cli.ts"

# Build arguments array
$args = @($guardianPath, $Url)
if ($RemainingArgs) {
    $args += $RemainingArgs
}

# Execute directly with pnpm exec tsx (clean output)
& pnpm exec tsx @args 2>&1 | Where-Object { $_ -notmatch 'ELIFECYCLE' }

# Preserve exit code for CI/CD
exit $LASTEXITCODE
