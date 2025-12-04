#!/usr/bin/env python3
"""
Fix verification properties null safety in trackUsage calls
"""
import os
import re
from pathlib import Path

os.chdir(r'C:\Users\sabou\dev\odavl\apps\studio-hub')

files_to_fix = [
    'app/api/v1/insight/results/route.ts',
    'app/api/v1/autopilot/runs/route.ts',
    'app/api/v1/guardian/tests/route.ts',
]

for file_path in files_to_fix:
    path = Path(file_path)
    if not path.exists():
        print(f"⏭️ Skipped (not found): {file_path}")
        continue
    
    try:
        content = path.read_text(encoding='utf-8')
        
        # Pattern 1: userId: verification.userId, → userId: verification.userId || 'unknown',
        content = re.sub(
            r'userId: verification\.userId,',
            r"userId: verification.userId || 'unknown',",
            content
        )
        
        # Pattern 2: orgId: verification.orgId, → orgId: verification.orgId || '',
        content = re.sub(
            r'orgId: verification\.orgId,',
            r"orgId: verification.orgId || '',",
            content
        )
        
        # Pattern 3: apiKeyId: verification.apiKeyId, → apiKeyId: verification.apiKeyId || 'unknown',
        content = re.sub(
            r'apiKeyId: verification\.apiKeyId,',
            r"apiKeyId: verification.apiKeyId || 'unknown',",
            content
        )
        
        path.write_text(content, encoding='utf-8')
        print(f"✓ Fixed: {file_path}")
    
    except Exception as e:
        print(f"✗ Error: {file_path}: {e}")

print(f"\n✅ Done!")
