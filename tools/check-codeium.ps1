$ErrorActionPreference = 'Stop'

function Get-LatestCodeiumExtension {
  $extRoot = Join-Path $env:USERPROFILE '.vscode' 'extensions'
  if (-not (Test-Path $extRoot)) { return $null }
  Get-ChildItem -Directory $extRoot |
    Where-Object { $_.Name -like 'codeium.codeium*' } |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1
}

$ext = Get-LatestCodeiumExtension
if ($null -eq $ext) {
  Write-Host 'Codeium extension not found under %USERPROFILE%\.vscode\extensions' -ForegroundColor Yellow
  exit 1
}

$dist = Join-Path $ext.FullName 'dist'
if (-not (Test-Path $dist)) {
  Write-Host "dist folder not found: $dist" -ForegroundColor Yellow
  exit 1
}

Write-Host "Codeium extension: $($ext.Name)" -ForegroundColor Cyan
Write-Host "dist: $dist" -ForegroundColor Cyan

$nodes = Get-ChildItem -Path $dist -Filter '*.node' -File -ErrorAction SilentlyContinue
if (-not $nodes) {
  Write-Host 'No .node files found in dist (unexpected).' -ForegroundColor Red
} else {
  Write-Host 'Native .node binaries:' -ForegroundColor Green
  $nodes | Select-Object Name, Length, FullName | Format-Table -AutoSize
}

# Scan latest VS Code logs for common errors
$logsRoot = Join-Path $env:APPDATA 'Code' 'logs'
$latestLogRoot = $null
if (Test-Path $logsRoot) {
  $latestLogRoot = Get-ChildItem -Directory $logsRoot |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1
}

$patterns = @('not a valid Win32 application','codeium','Codeium')
$hits = @()
if ($null -ne $latestLogRoot) {
  $candLogs = Get-ChildItem -Path $latestLogRoot.FullName -Recurse -Filter '*.log' -File -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -match 'exthost|window' }
  foreach ($log in $candLogs) {
    $content = Get-Content -Path $log.FullName -Raw -ErrorAction SilentlyContinue
    foreach ($p in $patterns) {
      if ($content -match [regex]::Escape($p)) {
        $hits += [PSCustomObject]@{ Log=$log.FullName; Pattern=$p }
      }
    }
  }
}

if ($hits.Count -gt 0) {
  Write-Host 'Log hits found:' -ForegroundColor Yellow
  $hits | Format-Table -AutoSize
} else {
  Write-Host 'No matching error patterns found in latest logs.' -ForegroundColor Green
}

exit 0
