#!/usr/bin/env python3
"""
Fix invitationService imports from 'invitation' to 'invitations' (plural)
Targets: apps/studio-hub/app/api/v1/invitations/**/*.ts
"""

import os
import re
from pathlib import Path

WORKSPACE_ROOT = Path(__file__).parent
TARGET_PATTERN = "apps/studio-hub/app/api/v1/invitations"
OLD_IMPORT = "from '../../../../../../../packages/core/src/services/invitation';"
NEW_IMPORT = "from '../../../../../../../packages/core/src/services/invitations';"

def fix_imports():
    """Fix all invitation service imports"""
    target_dir = WORKSPACE_ROOT / TARGET_PATTERN
    fixed_count = 0
    
    # Find all .ts files
    for ts_file in target_dir.rglob("*.ts"):
        try:
            with open(ts_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Check if file has the old import
            if OLD_IMPORT in content:
                new_content = content.replace(OLD_IMPORT, NEW_IMPORT)
                
                with open(ts_file, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                
                print(f"✓ Fixed: {ts_file.relative_to(WORKSPACE_ROOT)}")
                fixed_count += 1
        
        except Exception as e:
            print(f"✗ Error processing {ts_file}: {e}")
    
    print(f"\n✅ Done! Fixed {fixed_count} file(s)")

if __name__ == '__main__':
    fix_imports()
