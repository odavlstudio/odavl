#!/usr/bin/env python3
"""Fix @odavl/types/multi-tenant imports in packages/ directory."""

import os
import re
from pathlib import Path

def fix_multi_tenant_imports(file_path: str):
    """Fix @odavl/types/multi-tenant imports to use relative paths."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if file has @odavl/types/multi-tenant imports
        if '@odavl/types/multi-tenant' not in content:
            return False
        
        # Calculate relative path from packages/X/src to packages/types/src
        # From packages/core/src → ../../types/src/multi-tenant
        rel_path = "../../types/src/multi-tenant"
        
        # Replace pattern (both static imports and dynamic imports)
        new_content = content.replace(
            "from '@odavl/types/multi-tenant'",
            f"from '{rel_path}'"
        )
        new_content = new_content.replace(
            "import('@odavl/types/multi-tenant')",
            f"import('{rel_path}')"
        )
        
        if new_content != content:
            with open(file_path, 'w', encoding='utf-8', newline='') as f:
                f.write(new_content)
            print(f"✓ Fixed: {file_path}")
            return True
        return False
    
    except Exception as e:
        print(f"✗ Error in {file_path}: {e}")
        return False

def main():
    packages_dir = r"C:\Users\sabou\dev\odavl\packages"
    fixed_count = 0
    
    for root, dirs, files in os.walk(packages_dir):
        # Skip types package itself
        if 'types' in root:
            continue
            
        for file in files:
            if file.endswith('.ts') or file.endswith('.tsx'):
                file_path = os.path.join(root, file)
                if fix_multi_tenant_imports(file_path):
                    fixed_count += 1
    
    print(f"\nTotal files fixed: {fixed_count}")

if __name__ == '__main__':
    main()
