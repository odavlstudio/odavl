#!/usr/bin/env python3
"""Fix relative paths for types/multi-tenant imports."""

import os
import re

def fix_types_imports(file_path: str):
    """Fix ../../types/src/multi-tenant to ../../../types/src/multi-tenant."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if '../../types/src/multi-tenant' not in content:
            return False
        
        # From packages/core/src/services/ to packages/types/src/multi-tenant
        # Need: ../../../types/src/multi-tenant (3 levels up)
        new_content = content.replace(
            "../../types/src/multi-tenant",
            "../../../types/src/multi-tenant"
        )
        
        if new_content != content:
            with open(file_path, 'w', encoding='utf-8', newline='') as f:
                f.write(new_content)
            print(f"✓ Fixed: {file_path}")
            return True
        return False
    
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

def main():
    base_dir = r"C:\Users\sabou\dev\odavl\packages\core\src"
    fixed_count = 0
    
    for root, dirs, files in os.walk(base_dir):
        for file in files:
            if file.endswith('.ts') or file.endswith('.tsx'):
                file_path = os.path.join(root, file)
                if fix_types_imports(file_path):
                    fixed_count += 1
    
    print(f"\nTotal files fixed: {fixed_count}")

if __name__ == '__main__':
    main()
