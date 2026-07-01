import sys
import re
sys.stdout.reconfigure(encoding='utf-8')

path = 'js/propostaTecnica.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

print(f"FFFD remaining: {content.count(chr(0xFFFD))}")

# Show unique patterns around FFFD
pattern = re.compile(r'.{0,10}\ufffd.{0,10}')
matches = pattern.findall(content)
seen = set()
for m in matches:
    # Show what follows FFFD
    idx = m.find('\ufffd')
    after = m[idx+1:idx+4]
    key = repr(after)
    if key not in seen:
        seen.add(key)
        print(f"  After FFFD: {repr(after)} | context: {repr(m)}")
