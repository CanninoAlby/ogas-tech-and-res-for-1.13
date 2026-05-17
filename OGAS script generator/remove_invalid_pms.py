import re
import os

errorlog_path = r"C:\Users\axioo\Documents\Paradox Interactive\Victoria 3\mod\ogas tech and res for 1.13\errorlog.txt"
csv1 = r"C:\Users\axioo\Documents\Paradox Interactive\Victoria 3\mod\ogas tech and res for 1.13\OGAS script generator\pm_goods.csv"
csv2 = r"C:\Users\axioo\Documents\Paradox Interactive\Victoria 3\mod\ogas tech and res for 1.13\Victoria3 building PM\victoria3_building_pm_goods.csv"

# 1. Parse error log
with open(errorlog_path, 'r', encoding='utf8') as f:
    text = f.read()

pattern = r"Invalid production method '([^']+)'"
invalid_pms = set(re.findall(pattern, text))
print(f"Found {len(invalid_pms)} unique invalid PMs to remove:")
for pm in invalid_pms:
    print(f" - {pm}")

# 2. Function to filter csv
def filter_csv(filepath):
    if not os.path.exists(filepath):
        print(f"Not found: {filepath}")
        return
    
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    initial_count = len(lines)
    new_lines = []
    
    for line in lines:
        parts = line.split(',')
        if len(parts) >= 3:
            pm = parts[2].strip()
            if pm in invalid_pms:
                continue # Skip this line
        new_lines.append(line)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
        
    print(f"Processed {filepath}: Removed {initial_count - len(new_lines)} lines.")

filter_csv(csv1)
filter_csv(csv2)
