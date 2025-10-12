#!/usr/bin/env pwsh
# ODAVL Common PowerShell Utilities
# Shared functions for consistent tool behavior

# Standard response schema for all ODAVL tools
function New-ODAVLResponse {
    param(
        [Parameter(Mandatory)]
        [ValidateSet("golden", "policy-guard", "security-scan", "release", "cleanup")]
        [string]$Tool,
        
        [Parameter(Mandatory)]
        [ValidateSet("PASS", "WARN", "FAIL", "ERROR")]
        [string]$Status,
        
        [hashtable]$Data = @{},
        [string[]]$Errors = @()
    )
    
    return @{
        tool = $Tool
        timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ss.fffZ"
        status = $Status
        data = $Data
        errors = $Errors
    }
}

# Cross-platform path handling
function Get-NormalizedPath {
    param([string]$Path)
    
    if ($PSVersionTable.PSVersion.Major -ge 6) {
        # PowerShell 7+ cross-platform
        return [System.IO.Path]::GetFullPath($Path)
    } else {
        # Windows PowerShell 5.1
        return $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($Path)
    }
}

# Standard exit code handler
function Exit-WithCode {
    param(
        [int]$Code,
        [hashtable]$Response,
        [switch]$Json
    )
    
    if ($Json) {
        $Response | ConvertTo-Json -Depth 4 -Compress
    }
    
    exit $Code
}