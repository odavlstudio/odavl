#!/usr/bin/env python3
"""Fix @odavl-studio/core/services/* imports to use relative paths."""

import os
import re
from pathlib import Path

def count_levels_up(file_path: str) -> int:
    """Count how many ../ needed from api directory."""
    rel_path = file_path.replace("C:\\Users\\sabou\\dev\\odavl\\apps\\studio-hub\\app\\api\\", "")
    depth = rel_path.count("\\")
    return depth + 4  # +4 to get from app/api to workspace root

def fix_imports(file_path: str):
    """Fix imports in a single file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if file has @odavl-studio/core/services imports
        if '@odavl-studio/core/services/' not in content:
            return False
        
        # Calculate relative path
        levels_up = count_levels_up(file_path)
        rel_prefix = '../' * levels_up
        
        # Replace pattern
        pattern = r"from '@odavl-studio/core/services/([^']+)'"
        replacement = f"from '{rel_prefix}packages/core/src/services/\\1'"
        
        new_content = re.sub(pattern, replacement, content)
        
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
    api_dir = r"C:\Users\sabou\dev\odavl\apps\studio-hub\app\api"
    fixed_count = 0
    
    for root, dirs, files in os.walk(api_dir):
        for file in files:
            if file.endswith('.ts') or file.endswith('.tsx'):
                file_path = os.path.join(root, file)
                if fix_imports(file_path):
                    fixed_count += 1
    
    print(f"\nTotal files fixed: {fixed_count}")

if __name__ == '__main__':
    main()
