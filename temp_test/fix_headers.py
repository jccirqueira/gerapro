import sys
import re
sys.stdout.reconfigure(encoding='utf-8')

path = 'js/propostaTecnica.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

print("Total chars:", len(content))

# Show the actual line 4651 content
lines = content.split('\n')
print("Line 4651:", repr(lines[4650]))

# Find any line with FAB and double </th>
for i, line in enumerate(lines):
    if 'FAB' in line and lines[i].count('</th>') > 1:
        print(f"Double </th> at line {i+1}:", repr(line))
        # Fix: keep only the first valid <th>...</th>
        fixed = re.sub(r'(CÓD\. FAB\.</th>).*', r'\1', line)
        lines[i] = fixed
        print(f"Fixed to:", repr(lines[i]))

result = '\n'.join(lines)
with open(path, 'w', encoding='utf-8') as f:
    f.write(result)
print("Done!")
