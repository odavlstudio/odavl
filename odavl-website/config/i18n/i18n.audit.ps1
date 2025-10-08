# ODAVL-WAVE-X6: i18n Audit Script
# Verifies translation coverage & RTL compliance

Write-Host "🌐 ODAVL i18n Coverage Audit"
Write-Host "============================"

$locales = @('en', 'de', 'ar', 'fr', 'es', 'it', 'pt', 'ru', 'ja', 'zh')
$messagesDir = "messages"

Write-Host "`n📊 Translation Coverage:"
foreach ($locale in $locales) {
    $filePath = "$messagesDir\$locale.json"
    if (Test-Path $filePath) {
        $content = Get-Content $filePath -Raw | ConvertFrom-Json
        $keyCount = ($content | ConvertTo-Json -Depth 10).Split('"').Count / 2
        Write-Host "✅ $locale`: $keyCount keys"
    } else {
        Write-Host "❌ $locale`: Missing file"
    }
}

Write-Host "`n🔄 RTL Compliance Check:"
$rtlLocales = @('ar')
foreach ($rtl in $rtlLocales) {
    if (Test-Path "$messagesDir\$rtl.json") {
        Write-Host "✅ RTL locale '$rtl' - file exists"
    } else {
        Write-Host "❌ RTL locale '$rtl' - missing"
    }
}

Write-Host "`n🎯 Audit Complete"