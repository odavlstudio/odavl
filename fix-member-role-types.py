#!/usr/bin/env python3
"""
Fix MemberRole type casting in organization routes
1. Add MemberRole import
2. Cast role to MemberRole where used
"""

import re
from pathlib import Path

WORKSPACE_ROOT = Path(__file__).parent
TARGET_FILES = [
    "apps/studio-hub/app/api/v1/organizations/[orgId]/members/route.ts",
    "apps/studio-hub/app/api/v1/organizations/[orgId]/members/[userId]/route.ts",
]

MEMBER_ROLE_IMPORT = "import { MemberRole } from '../../../../../../../../packages/types/src/multi-tenant';"

def add_member_role_import(content: str) -> str:
    """Add Member Role import after last import statement"""
    # Find last import statement
    import_pattern = r"(import .+ from .+;)\n(?!import)"
    
    def replacer(match):
        return f"{match.group(1)}\n{MEMBER_ROLE_IMPORT}\n"
    
    # Only add if not already present
    if "MemberRole" in content and "from" in content and "multi-tenant" in content:
        return content  # Already has import
    
    return re.sub(import_pattern, replacer, content, count=1)

def cast_role_usage(content: str) -> str:
    """Cast role: validatedData.role, → role: validatedData.role as MemberRole,"""
    # Pattern: role: validatedData.role, (with comma)
    content = re.sub(
        r'role: validatedData\.role,',
        'role: validatedData.role as MemberRole,',
        content
    )
    
    # Pattern: role: body.role, (with comma)
    content = re.sub(
        r'role: body\.role,',
        'role: body.role as MemberRole,',
        content
    )
    
    return content

def main():
    """Fix all member role casts"""
    fixed_count = 0
    
    for file_path_str in TARGET_FILES:
        file_path = WORKSPACE_ROOT / file_path_str
        
        if not file_path.exists():
            print(f"✗ File not found: {file_path_str}")
            continue
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Add import
            new_content = add_member_role_import(content)
            
            # Cast role usages
            new_content = cast_role_usage(new_content)
            
            if new_content != content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                
                print(f"✓ Fixed: {file_path_str}")
                fixed_count += 1
            else:
                print(f"○ Skipped (no changes): {file_path_str}")
        
        except Exception as e:
            print(f"✗ Error processing {file_path_str}: {e}")
    
    print(f"\n✅ Done! Fixed {fixed_count} file(s)")

if __name__ == '__main__':
    main()
