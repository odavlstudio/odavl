# Migrate from @heroicons/react to lucide-react
# Usage: .\migrate-icons.ps1

$iconMap = @{
    'CheckIcon' = 'Check'
    'ChevronDownIcon' = 'ChevronDown'
    'ChevronUpIcon' = 'ChevronUp'
    'XMarkIcon' = 'X'
    'PlusIcon' = 'Plus'
    'FolderIcon' = 'Folder'
    'ClipboardDocumentIcon' = 'Clipboard'
    'CheckCircleIcon' = 'CheckCircle'
    'XCircleIcon' = 'XCircle'
    'ArrowDownTrayIcon' = 'Download'
    'ClockIcon' = 'Clock'
    'DocumentTextIcon' = 'FileText'
    'ArrowUturnLeftIcon' = 'Undo'
    'Bars3Icon' = 'Menu'
    'BellIcon' = 'Bell'
    'MagnifyingGlassIcon' = 'Search'
    'UserCircleIcon' = 'UserCircle'
    'HomeIcon' = 'Home'
    'ChartBarIcon' = 'BarChart'
    'CogIcon' = 'Settings'
    'RocketLaunchIcon' = 'Rocket'
    'ShieldCheckIcon' = 'ShieldCheck'
}

$files = Get-ChildItem -Path "components" -Recurse -Filter "*.tsx" | Where-Object { $_.FullName -notmatch 'node_modules' }

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $changed = $false
    
    if ($content -match '@heroicons/react') {
        Write-Host "Processing: $($file.Name)" -ForegroundColor Cyan
        
        # Replace import statement
        $content = $content -replace "import \{ ([^\}]+) \} from '@heroicons/react/24/outline';", {
            $imports = $_.Groups[1].Value -split ',\s*'
            $lucideImports = $imports | ForEach-Object {
                $iconName = $_.Trim()
                if ($iconMap.ContainsKey($iconName)) {
                    $iconMap[$iconName]
                } else {
                    $iconName -replace 'Icon$', ''
                }
            }
            "import { $($lucideImports -join ', ') } from 'lucide-react';"
        }
        
        # Replace icon usages in JSX
        foreach ($oldIcon in $iconMap.Keys) {
            if ($content -match $oldIcon) {
                $content = $content -replace "<$oldIcon ", "<$($iconMap[$oldIcon]) "
                $content = $content -replace "</$oldIcon>", "</$($iconMap[$oldIcon])>"
            }
        }
        
        Set-Content $file.FullName -Value $content -NoNewline
        Write-Host "  ✓ Updated" -ForegroundColor Green
        $changed = $true
    }
}

Write-Host "`nMigration complete!" -ForegroundColor Green
