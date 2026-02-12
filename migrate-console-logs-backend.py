#!/usr/bin/env python3
"""
Script to replace console.log/error/warn with logger in backend TypeScript files
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
        
        # Skip if it's the logger.ts file itself
        if 'logger.ts' in str(filepath):
            return False
        
        # Check if file already uses console
        has_console = re.search(r'console\.(log|error|warn|debug)', content)
        if not has_console:
            return False
        
        # Check if logger is already imported
        has_logger_import = "'@/lib/utils/logger'" in content or '"@/lib/utils/logger"' in content or "'../lib/utils/logger'" in content or "from '../utils/logger'" in content or "from './utils/logger'" in content
        
        # Add logger import if not present
        if not has_logger_import:
            # Find the last import statement
            import_pattern = r'(import[^;]+;)\n(?!import)'
            match = None
            for m in re.finditer(import_pattern, content):
                match = m
            
            if match:
                # Determine relative path to logger
                depth = len(str(filepath.relative_to('/home/justEmre/SendikaApp/api/backend/src')).split('/')) - 1
                relative_path = '../' * depth + 'lib/utils/logger'
                
                insert_pos = match.end()
                content = content[:insert_pos] + f"\nimport {{ logger }} from '{relative_path}';" + content[insert_pos:]
                modified = True
        
        # Replace console.log with logger.log
        new_content = re.sub(r'\bconsole\.log\b', 'logger.log', content)
        # Replace console.error with logger.error  
        new_content = re.sub(r'\bconsole\.error\b', 'logger.error', new_content)
        # Replace console.warn with logger.warn
        new_content = re.sub(r'\bconsole\.warn\b', 'logger.warn', new_content)
        # Replace console.debug with logger.debug
        new_content = re.sub(r'\bconsole\.debug\b', 'logger.debug', new_content)
        
        if new_content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            return True
        
        return False
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return False

def main():
    """Main function"""
    src_dir = Path('/home/justEmre/SendikaApp/api/backend/src')
    
    processed = 0
    modified = 0
    
    # Find all TypeScript files
    for filepath in src_dir.rglob('*.ts'):
        processed += 1
        if process_file(filepath):
            modified += 1
            print(f"✓ Modified: {filepath.relative_to(src_dir)}")
    
    print(f"\n📊 Summary:")
    print(f"   Processed: {processed} files")
    print(f"   Modified:  {modified} files")

if __name__ == '__main__':
    main()
