#!/usr/bin/env python3
"""
Fix BROKEN syntax from previous script: orgId> → orgId:
"""
import os
from pathlib import Path

os.chdir(r'C:\Users\sabou\dev\odavl\apps\studio-hub')

def fix_broken_syntax():
    api_dir = Path('app/api')
    fixed = 0
    
    for ts_file in api_dir.rglob('*.ts'):
        try:
            content = ts_file.read_text(encoding='utf-8')
            
            # Pattern: orgId> → orgId:
            # Pattern: webhookId> → webhookId:
            # Pattern: userId> → userId:
            # Pattern: ANY_PARAM> → ANY_PARAM:
            
            if '>: string' in content or '>: number' in content:
                # Replace all occurrences
                new_content = content.replace('>: string', ': string')
                new_content = new_content.replace('>: number', ': number')
                
                ts_file.write_text(new_content, encoding='utf-8')
                print(f"✓ Fixed: {ts_file}")
                fixed += 1
        
        except Exception as e:
            print(f"✗ Error: {ts_file}: {e}")
    
    print(f"\nTotal files fixed: {fixed}")

if __name__ == '__main__':
    fix_broken_syntax()
