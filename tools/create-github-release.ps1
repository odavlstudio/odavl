# GitHub Release Creation Script
# Creates v2.0.0 release with all assets

# Ensure we're on main branch
Write-Host "📍 Checking git status..." -ForegroundColor Cyan
$branch = git branch --show-current
if ($branch -ne "main") {
    Write-Host "❌ Error: Must be on 'main' branch. Current: $branch" -ForegroundColor Red
    exit 1
}

Write-Host "✅ On main branch" -ForegroundColor Green

# Check for uncommitted changes
$status = git status --porcelain
if ($status) {
    Write-Host "📝 Uncommitted changes detected:" -ForegroundColor Yellow
    Write-Host $status
    $commit = Read-Host "Commit these changes? (y/n)"
    
    if ($commit -eq "y") {
        git add .
        git commit -m "chore: prepare v2.0.0 release - update documentation and badges"
        Write-Host "✅ Changes committed" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Continuing with uncommitted changes" -ForegroundColor Yellow
    }
}

# Create git tag
Write-Host "`n🏷️  Creating git tag v2.0.0..." -ForegroundColor Cyan
$tagExists = git tag -l "v2.0.0"
if ($tagExists) {
    Write-Host "⚠️  Tag v2.0.0 already exists. Delete it? (y/n)" -ForegroundColor Yellow
    $delete = Read-Host
    if ($delete -eq "y") {
        git tag -d v2.0.0
        git push origin :refs/tags/v2.0.0
        Write-Host "✅ Old tag deleted" -ForegroundColor Green
    } else {
        Write-Host "❌ Cannot proceed with existing tag" -ForegroundColor Red
        exit 1
    }
}

git tag -a v2.0.0 -m "ODAVL Studio v2.0.0 - Global Public Release"
Write-Host "✅ Tag created locally" -ForegroundColor Green

# Push tag to remote
Write-Host "`n📤 Pushing tag to GitHub..." -ForegroundColor Cyan
git push origin v2.0.0
Write-Host "✅ Tag pushed to remote" -ForegroundColor Green

# Verify .vsix file exists
$vsixPath = "odavl-studio\insight\extension\odavl-insight-vscode-2.0.4.vsix"
if (!(Test-Path $vsixPath)) {
    Write-Host "❌ Error: .vsix file not found at: $vsixPath" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Found .vsix file: $(Get-Item $vsixPath | Select-Object -ExpandProperty Length) bytes" -ForegroundColor Green

# Instructions for manual release creation
Write-Host "`n═══════════════════════════════════════════════════════" -ForegroundColor Magenta
Write-Host "✅ Git tag v2.0.0 created and pushed!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Magenta

Write-Host "`n📋 Next Steps (Manual - GitHub Web UI):" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Go to: https://github.com/odavlstudio/odavl/releases/new" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. Fill in:" -ForegroundColor Yellow
Write-Host "   - Tag: v2.0.0" -ForegroundColor White
Write-Host "   - Title: ODAVL Studio v2.0.0 - Global Public Release 🎉" -ForegroundColor White
Write-Host ""
Write-Host "3. Copy release notes from:" -ForegroundColor Yellow
Write-Host "   - File: GITHUB_RELEASE_v2.0.0.md" -ForegroundColor White
Write-Host "   - Or use: Get-Content GITHUB_RELEASE_v2.0.0.md | Set-Clipboard" -ForegroundColor White
Write-Host ""
Write-Host "4. Upload .vsix file:" -ForegroundColor Yellow
Write-Host "   - Path: $vsixPath" -ForegroundColor White
Write-Host "   - Size: $((Get-Item $vsixPath).Length / 1MB) MB" -ForegroundColor White
Write-Host ""
Write-Host "5. Check 'Set as latest release' ✅" -ForegroundColor Yellow
Write-Host ""
Write-Host "6. Click 'Publish release'" -ForegroundColor Yellow
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Magenta

# Copy release notes to clipboard
Write-Host "`n📋 Copy release notes to clipboard? (y/n)" -ForegroundColor Cyan
$copy = Read-Host
if ($copy -eq "y") {
    Get-Content "GITHUB_RELEASE_v2.0.0.md" | Set-Clipboard
    Write-Host "✅ Release notes copied to clipboard!" -ForegroundColor Green
    Write-Host "   Just paste into GitHub release description" -ForegroundColor Gray
}

# Open GitHub releases page
Write-Host "`n🌐 Open GitHub releases page? (y/n)" -ForegroundColor Cyan
$open = Read-Host
if ($open -eq "y") {
    Start-Process "https://github.com/odavlstudio/odavl/releases/new?tag=v2.0.0"
    Write-Host "✅ Opening browser..." -ForegroundColor Green
}

Write-Host "`n🎉 Done! Create the release on GitHub now." -ForegroundColor Green
Write-Host "   Don't forget to upload: $vsixPath" -ForegroundColor Yellow
