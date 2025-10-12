#Requires -Version 5.1

<#
.SYNOPSIS
ODAVL Evidence Retention Cleanup Script

.DESCRIPTION
Manages evidence file lifecycle according to retention policy.
Never deletes critical files (attestations, audits, outcomes).
#>

param(
    [switch]$DryRun = $true,
    [switch]$Json,
    [switch]$Confirm
)

$ErrorActionPreference = "Stop"

# Import common utilities
. "$PSScriptRoot\common.ps1"

function Get-EvidenceFiles {
    $evidenceDir = "evidence"
    if (!(Test-Path $evidenceDir)) { return @() }
    
    Get-ChildItem $evidenceDir -File -Recurse | ForEach-Object {
        [PSCustomObject]@{
            Path = $_.FullName
            Age = (Get-Date) - $_.CreationTime
            Size = $_.Length
            Type = Get-EvidenceType $_.Name
        }
    }
}

function Get-EvidenceType($fileName) {
    if ($fileName -match "attestation") { return "attestation" }
    if ($fileName -match "audit") { return "audit" }
    if ($fileName -match "outcome") { return "outcome" }
    if ($fileName -match "rollback") { return "rollback" }
    return "other"
}

$retentionPath = ".odavl\retention.yml"
$retention = @{ max_age_days = 30; exclude_types = @("attestation","audit","outcome","rollback") }

$files = Get-EvidenceFiles
$oldFiles = $files | Where-Object { $_.Age.Days -gt $retention.max_age_days -and $_.Type -notin $retention.exclude_types }

$result = @{
    total_files = $files.Count
    old_files = $oldFiles.Count
    protected_files = ($files | Where-Object { $_.Type -in $retention.exclude_types }).Count
    would_delete = if ($DryRun) { $oldFiles.Count } else { 0 }
}

if ($Json) {
    New-ODAVLResponse -Data $result -Status "PASS" -Tool "cleanup"
} else {
    Write-Host "Evidence cleanup summary: $($oldFiles.Count) of $($files.Count) files eligible for cleanup"
}