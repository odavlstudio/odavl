#!/usr/bin/env python3
"""
Fix ALL dynamic route params to use Next.js 15 async Promise pattern
"""
import os
import re
from pathlib import Path

# Navigate to studio-hub
os.chdir(r'C:\Users\sabou\dev\odavl\apps\studio-hub')

def find_files_with_dynamic_routes():
    """Find all files in directories with brackets [...]"""
    api_dir = Path('app/api')
    files = []
    for ts_file in api_dir.rglob('*.ts'):
        # Check if ANY parent directory has brackets
        if any('[' in part and ']' in part for part in ts_file.parts):
            files.append(ts_file)
    return files

def fix_params_signature(content: str, param_names: list[str]) -> tuple[str, bool]:
    """
    Fix params signature from:
      { params }: { params: { id: string } }
    To:
      { params }: { params: Promise<{ id: string }> }
    
    And add: const { id } = await params;
    """
    changed = False
    
    # Build type pattern: { id: string, orgId: string, ... }
    if len(param_names) == 1:
        type_pattern = rf'\{{\s*{param_names[0]}\s*:\s*string\s*\}}'
    else:
        # Multiple params
        type_pattern = r'\{[^}]*' + '|'.join(param_names) + r'[^}]*\}'
    
    # Pattern 1: Match sync params signature
    sync_pattern = rf'(\{{[\s\n]*params[\s\n]*\}}[\s\n]*:[\s\n]*\{{[\s\n]*params[\s\n]*:[\s\n]*)({type_pattern})'
    
    if re.search(sync_pattern, content) and 'Promise<{' not in content:
        # Replace with Promise<...>
        content = re.sub(
            sync_pattern,
            r'\1Promise<\2>',
            content
        )
        changed = True
        
        # Now add `const { param } = await params;` after function signature
        # Find the opening try { or the first real line after `{`
        for param_name in param_names:
            # Check if already has `await params`
            if f'const {{ {param_name} }} = await params' in content:
                continue
            
            # Pattern: Find where we currently use `params.paramName` or `{ paramName } = params`
            # Replace `const { paramName } = params;` → `const { paramName } = await params;`
            old_destructure = rf'const\s*\{{\s*{param_name}\s*\}}\s*=\s*params;'
            new_destructure = f'const {{ {param_name} }} = await params;'
            
            if re.search(old_destructure, content):
                content = re.sub(old_destructure, new_destructure, content)
            else:
                # Add destructure after first try { or after function open
                # Find first occurrence of `try {` after function signature
                try_match = re.search(r'(\)\s*\{[\s\n]*try\s*\{)', content)
                if try_match:
                    insert_pos = try_match.end()
                    indent = '    '  # 4 spaces
                    content = (
                        content[:insert_pos] +
                        f'\n{indent}const {{ {param_name} }} = await params;' +
                        content[insert_pos:]
                    )
    
    return content, changed

def detect_param_names(file_path: Path) -> list[str]:
    """Extract param names from file path like [id], [orgId], [token]"""
    params = []
    for part in file_path.parts:
        if '[' in part and ']' in part:
            # Extract param name from [name]
            param = part.strip('[]')
            # Handle special case [...nextauth] → just skip
            if param.startswith('...'):
                continue
            params.append(param)
    return params

def main():
    files = find_files_with_dynamic_routes()
    print(f"Found {len(files)} files with dynamic routes\n")
    
    fixed_count = 0
    
    for file_path in files:
        param_names = detect_param_names(file_path)
        if not param_names:
            continue  # Skip if no params (e.g., [...nextauth])
        
        try:
            content = file_path.read_text(encoding='utf-8')
            
            # Skip if already using Promise<{...}>
            if 'params: Promise<{' in content:
                continue
            
            # Skip if no params destructuring
            if 'params }: { params:' not in content:
                continue
            
            new_content, changed = fix_params_signature(content, param_names)
            
            if changed:
                file_path.write_text(new_content, encoding='utf-8')
                print(f"✓ Fixed: {file_path}")
                fixed_count += 1
        
        except Exception as e:
            print(f"✗ Error processing {file_path}: {e}")
    
    print(f"\nTotal files fixed: {fixed_count}")

if __name__ == '__main__':
    main()
