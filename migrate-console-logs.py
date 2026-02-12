#!/usr/bin/env python3
"""
Script to replace console.log/error/warn with logger in TypeScript files
"""
import os
import re
from pathlib import Path

def process_file(filepath):
    """Process a single TypeScript file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        modified = False
        
        # Skip if it's the logger.ts file itself or main.tsx
        if 'logger.ts' in str(filepath) or 'main.tsx' in str(filepath):
            return False
        
        # Check if file already uses logger
        has_console = re.search(r'console\.(log|error|warn|debug)', content)
        if not has_console:
            return False
        
        # Check if logger is already imported
        has_logger_import = 'from \'@/utils/logger\'' in content or 'from "@/utils/logger"' in content
        
        # Add logger import if not present
        if not has_logger_import:
            # Find the last import statement
            import_pattern = r'(import[^;]+;)\n(?!import)'
            match = None
            for m in re.finditer(import_pattern, content):
                match = m
            
            if match:
                insert_pos = match.end()
                content = content[:insert_pos] + "\nimport { logger } from '@/utils/logger';" + content[insert_pos:]
                modified = True
        
        # Replace console.log with logger.log
        content = re.sub(r'\bconsole\.log\b', 'logger.log', content)
        # Replace console.error with logger.error  
        content = re.sub(r'\bconsole\.error\b', 'logger.error', content)
        # Replace console.warn with logger.warn
        content = re.sub(r'\bconsole\.warn\b', 'logger.warn', content)
        # Replace console.debug with logger.debug
        content = re.sub(r'\bconsole\.debug\b', 'logger.debug', content)
        
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        
        return False
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return False

def main():
    """Main function"""
    src_dir = Path('/home/justEmre/SendikaApp/admin-panel/src')
    
    processed = 0
    modified = 0
    
    # Find all TypeScript files
    for filepath in src_dir.rglob('*.ts'):
        processed += 1
        if process_file(filepath):
            modified += 1
            print(f"✓ Modified: {filepath.relative_to(src_dir)}")
    
    for filepath in src_dir.rglob('*.tsx'):
        processed += 1
        if process_file(filepath):
            modified += 1
            print(f"✓ Modified: {filepath.relative_to(src_dir)}")
    
    print(f"\n📊 Summary:")
    print(f"   Processed: {processed} files")
    print(f"   Modified:  {modified} files")

if __name__ == '__main__':
    main()
