#!/usr/bin/env pwsh
# ODAVL Release Builder - Wave 10
param([string]$Version = "0.1.0")

$timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
Write-Host "📦 ODAVL Enterprise Release - $timestamp" -ForegroundColor Cyan

# Create dist directory
New-Item -ItemType Directory -Force -Path "dist" | Out-Null

# Build CLI package
Write-Host "🏗️ Building CLI package..." -ForegroundColor Yellow
pnpm --filter @odavl/cli build
if ($LASTEXITCODE -ne 0) { Write-Error "CLI build failed"; exit 1 }
Copy-Item "apps/cli/dist/*" -Destination "dist/" -Recurse -Force

# Build VS Code extension
Write-Host "🎨 Building VS Code extension..." -ForegroundColor Yellow
Push-Location "apps/vscode-ext"
npm run build
if ($LASTEXITCODE -ne 0) { Pop-Location; Write-Error "VS Code build failed"; exit 1 }
if (Test-Path "odavl.vsix") { Copy-Item "odavl.vsix" -Destination "../../dist/" -Force }
Pop-Location

# Generate release manifest
$manifest = @{
    version = $Version
    timestamp = $timestamp
    artifacts = @(
        @{ name = "odavl-cli"; path = "dist/index.js"; type = "cli" }
        @{ name = "odavl-vscode"; path = "dist/odavl.vsix"; type = "extension" }
    )
    checksums = @{}
}

# Calculate checksums
foreach ($artifact in $manifest.artifacts) {
    if (Test-Path $artifact.path) {
        $hash = Get-FileHash $artifact.path -Algorithm SHA256
        $manifest.checksums[$artifact.name] = $hash.Hash
    }
}

$manifest | ConvertTo-Json -Depth 3 | Out-File "dist/release-manifest.json" -Encoding UTF8
Write-Host "✅ Release artifacts created in dist/ directory" -ForegroundColor Green

# Verify artifacts
$cliExists = Test-Path "dist/index.js"
$vsixExists = Test-Path "dist/odavl.vsix"
$manifestExists = Test-Path "dist/release-manifest.json"

if ($cliExists -and $vsixExists -and $manifestExists) { 
    Write-Host "🎯 Enterprise release: READY ✅" -ForegroundColor Green; exit 0 
} else { 
    Write-Error "Missing artifacts"; exit 1 
}