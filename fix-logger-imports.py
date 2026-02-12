#!/usr/bin/env python3
"""
Better script to add logger imports at the correct location
"""
import re
from pathlib import Path

def fix_imports(filepath):
    """Fix imports in a single file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Skip logger.ts itself
        if 'logger.ts' in str(filepath) or 'main.tsx' in str(filepath):
            return False
        
        # Check if file uses logger.log/error/warn
        if not re.search(r'logger\.(log|error|warn|debug)', content):
            return False
        
        # Check if logger is already imported correctly
        if re.search(r"^import.*logger.*from.*['\"]@/utils/logger['\"]", content, re.MULTILINE):
            return False
        
        # Find the position after the last import statement
        lines = content.split('\n')
        last_import_line = -1
        
        for i, line in enumerate(lines):
            if line.strip().startswith('import ') and 'from' in line:
                last_import_line = i
        
        if last_import_line >= 0:
            # Insert logger import after last import
            lines.insert(last_import_line + 1, "import { logger } from '@/utils/logger';")
            new_content = '\n'.join(lines)
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            return True
        
        return False
    except Exception as e:
        print(f"Error fixing {filepath}: {e}")
        return False

def main():
    src_dir = Path('/home/justEmre/SendikaApp/admin-panel/src')
    
    fixed = 0
    for filepath in src_dir.rglob('*.ts'):
        if fix_imports(filepath):
            fixed += 1
            print(f"✓ Fixed: {filepath.relative_to(src_dir)}")
    
    for filepath in src_dir.rglob('*.tsx'):
        if fix_imports(filepath):
            fixed += 1
            print(f"✓ Fixed: {filepath.relative_to(src_dir)}")
    
    print(f"\n📊 Fixed {fixed} files")

if __name__ == '__main__':
    main()
