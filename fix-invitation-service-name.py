#!/usr/bin/env python3
"""
Fix invitationService export name to invitationsService (plural)
AND update all usages in file
Targets: apps/studio-hub/app/api/v1/invitations/**/*.ts
"""

import os
import re
from pathlib import Path

WORKSPACE_ROOT = Path(__file__).parent
TARGET_PATTERN = "apps/studio-hub/app/api/v1/invitations"

def fix_service_name(file_path: Path):
    """Fix both import and all usages of invitationService → invitationsService"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Fix import statement
        content = content.replace(
            "import { invitationService }",
            "import { invitationsService }"
        )
        
        # Fix all usages: invitationService. → invitationsService.
        content = content.replace(
            "invitationService.",
            "invitationsService."
        )
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return True
    except Exception as e:
        print(f"✗ Error processing {file_path}: {e}")
        return False

def main():
    """Fix all invitation service names"""
    target_dir = WORKSPACE_ROOT / TARGET_PATTERN
    fixed_count = 0
    
    # Find all .ts files
    for ts_file in target_dir.rglob("*.ts"):
        try:
            with open(ts_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Only process if file has invitationService (singular)
            if "invitationService" in content:
                if fix_service_name(ts_file):
                    print(f"✓ Fixed: {ts_file.relative_to(WORKSPACE_ROOT)}")
                    fixed_count += 1
        
        except Exception as e:
            print(f"✗ Error checking {ts_file}: {e}")
    
    print(f"\n✅ Done! Fixed {fixed_count} file(s)")

if __name__ == '__main__':
    main()
