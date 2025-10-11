function Flatten-JsonKeys {
    param([PSObject]$Object, [string]$Prefix = "")
    $keys = @()
    $Object.PSObject.Properties | ForEach-Object {
        if ($_.Value -is [PSObject] -and -not ($_.Value -is [array])) {
            $keys += Flatten-JsonKeys -Object $_.Value -Prefix "$Prefix$($_.Name)."
        } else {
            $keys += "$Prefix$($_.Name)"
        }
    }
    return $keys
}

# Read and flatten en.json keys
$enContent = Get-Content "c:\Users\sabou\dev\odavl\odavl-website\messages\en.json" -Raw | ConvertFrom-Json
$sourceKeys = Flatten-JsonKeys -Object $enContent | Sort-Object
Write-Host "📊 Source keys found: $($sourceKeys.Count)" -ForegroundColor Yellow
$sourceKeys | ForEach-Object { Write-Host "  $_" -ForegroundColor DarkGray }
