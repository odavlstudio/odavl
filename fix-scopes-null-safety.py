#!/usr/bin/env python3
"""
Fix verification.scopes null safety
Pattern: verification.scopes.includes → verification.scopes?.includes
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
        
        # Pattern: verification.scopes.includes → verification.scopes?.includes
        new_content = re.sub(
            r'verification\.scopes\.includes',
            r'verification.scopes?.includes',
            content
        )
        
        if new_content != content:
            path.write_text(new_content, encoding='utf-8')
            print(f"✓ Fixed: {file_path}")
        else:
            print(f"⏭️ Skipped (no changes): {file_path}")
    
    except Exception as e:
        print(f"✗ Error: {file_path}: {e}")

print(f"\n✅ Done!")
