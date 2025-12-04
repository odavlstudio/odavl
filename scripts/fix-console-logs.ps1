#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Replace console.log with logger utility across codebase
.DESCRIPTION
    Bulk replacement of console statements to fix DEBUG_INFO_LEAK security issues
#>

param(
    [string]$Directory = "packages/insight-core/src"
)

Write-Host "🔧 Fixing console.log statements..." -ForegroundColor Cyan
Write-Host "📁 Directory: $Directory`n" -ForegroundColor Gray

# Find all TypeScript files with console statements
$files = Get-ChildItem -Path $Directory -Recurse -Filter "*.ts" | Where-Object {
    $content = Get-Content $_.FullName -Raw
    $content -match "console\.(log|error|warn|debug|info)"
}

Write-Host "📊 Found $($files.Count) files with console statements`n" -ForegroundColor Yellow

foreach ($file in $files) {
    Write-Host "  Processing: $($file.Name)" -ForegroundColor Green
    
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Add logger import if not exists
    if ($content -notmatch "import.*logger.*from") {
        # Find the last import statement
        if ($content -match "(?s)(import.*?;)\s*\n\s*\n") {
            $lastImport = $matches[1]
            $content = $content -replace [regex]::Escape($lastImport), "$lastImport`nimport { logger } from '../utils/logger';"
        }
    }
    
    # Replace console.log → logger.debug (for debug info)
    $content = $content -replace "console\.log\(", "logger.debug("
    
    # Replace console.error → logger.error
    $content = $content -replace "console\.error\(", "logger.error("
    
    # Replace console.warn → logger.warn
    $content = $content -replace "console\.warn\(", "logger.warn("
    
    # Replace console.info → logger.info
    $content = $content -replace "console\.info\(", "logger.info("
    
    # Replace console.debug → logger.debug
    $content = $content -replace "console\.debug\(", "logger.debug("
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "    ✅ Updated" -ForegroundColor Green
    } else {
        Write-Host "    ⏭️  No changes needed" -ForegroundColor Gray
    }
}

Write-Host "`n✨ Completed! Updated $($files.Count) files" -ForegroundColor Cyan
