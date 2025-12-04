#!/usr/bin/env python3
"""
Fix all null safety issues with project references in analytics
Pattern: xxx.project.name → xxx.project?.name || 'Unknown'
"""
import os
import re
from pathlib import Path

os.chdir(r'C:\Users\sabou\dev\odavl\apps\studio-hub')

files_to_fix = [
    'app/api/analytics/export/route.ts',
]

for file_path in files_to_fix:
    path = Path(file_path)
    if not path.exists():
        print(f"⏭️ Skipped (not found): {file_path}")
        continue
    
    try:
        content = path.read_text(encoding='utf-8')
        
        # Pattern 1: xxx.project.name → xxx.project?.name || 'Unknown'
        new_content = re.sub(
            r'(\w+)\.project\.name',
            r"\1.project?.name || 'Unknown'",
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
