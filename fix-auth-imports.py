#!/usr/bin/env python3
"""Fix authOptions imports - change from route handler to @/lib/auth."""

import os
import re

def fix_auth_imports(file_path: str):
    """Fix authOptions imports."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if "from '@/app/api/auth/[...nextauth]/route'" not in content:
            return False
        
        # Replace import path
        new_content = content.replace(
            "from '@/app/api/auth/[...nextauth]/route'",
            "from '@/lib/auth'"
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
    api_dir = r"C:\Users\sabou\dev\odavl\apps\studio-hub\app\api"
    fixed_count = 0
    
    for root, dirs, files in os.walk(api_dir):
        for file in files:
            if file.endswith('.ts') or file.endswith('.tsx'):
                file_path = os.path.join(root, file)
                if fix_auth_imports(file_path):
                    fixed_count += 1
    
    print(f"\nTotal files fixed: {fixed_count}")

if __name__ == '__main__':
    main()
