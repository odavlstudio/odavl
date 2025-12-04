# Migrate ALL files from @heroicons/react to lucide-react
# Usage: .\migrate-all-icons.ps1

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
    'ExclamationTriangleIcon' = 'AlertTriangle'
    'ArrowLeftIcon' = 'ArrowLeft'
    'CodeBracketIcon' = 'Code'
    'CommandLineIcon' = 'Terminal'
    'BugAntIcon' = 'Bug'
    'CurrencyDollarIcon' = 'DollarSign'
    'UsersIcon' = 'Users'
    'ChartPieIcon' = 'PieChart'
}

$files = Get-ChildItem -Path "." -Recurse -Filter "*.tsx" -Exclude "node_modules" | Where-Object { $_.FullName -notmatch 'node_modules' }

Write-Host "Found $($files.Count) .tsx files" -ForegroundColor Yellow

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    
    if ($content -match '@heroicons/react') {
        Write-Host "Processing: $($file.FullName.Replace($PWD.Path, '.'))" -ForegroundColor Cyan
        
        # Replace import statement - handle both single and multi-line imports
        $content = $content -replace "import \{([^\}]+)\} from '@heroicons/react/24/outline';?", {
            $imports = $_.Groups[1].Value -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }
            $lucideImports = $imports | ForEach-Object {
                if ($iconMap.ContainsKey($_)) {
                    $iconMap[$_]
                } else {
                    $_ -replace 'Icon$', ''
                }
            }
            "import { $($lucideImports -join ', ') } from 'lucide-react';"
        }
        
        # Replace icon usages in JSX
        foreach ($oldIcon in $iconMap.Keys) {
            if ($content -match $oldIcon) {
                $newIcon = $iconMap[$oldIcon]
                # Replace opening tags
                $content = $content -replace "<$oldIcon\s", "<$newIcon "
                # Replace self-closing tags  
                $content = $content -replace "<$oldIcon/>", "<$newIcon/>"
                # Replace closing tags
                $content = $content -replace "</$oldIcon>", "</$newIcon>"
            }
        }
        
        Set-Content $file.FullName -Value $content -NoNewline
        Write-Host "  ✓ Updated" -ForegroundColor Green
    }
}

Write-Host "`n✅ Migration complete!" -ForegroundColor Green
Write-Host "Total files processed: $($files.Count)" -ForegroundColor Yellow
