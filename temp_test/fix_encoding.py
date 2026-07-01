
# Fix: the PowerShell Out-File command read UTF-8 bytes as cp1252 and re-saved them.
# Result: UTF-8 multi-byte sequences (e.g. é = 0xC3 0xA9) were stored as two
# separate cp1252 characters (Ã + ©), creating garbled text.
# Fix: read the file as cp1252 (Latin-1), then re-encode those bytes as UTF-8.

path = 'js/propostaTecnica.js'

# Read as cp1252 (how PowerShell misinterpreted it)
with open(path, 'r', encoding='cp1252', errors='replace') as f:
    content = f.read()

# The file should now have the correct Unicode characters.
# Write back as UTF-8.
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

# Verify a few known strings
content_check = open(path, encoding='utf-8').read()
samples = ['Técnica', 'Características', 'Eletrocentro', 'cálculos', 'Revisões']
print("Encoding fix results:")
for s in samples:
    found = s in content_check
    print(f"  [{'OK' if found else 'MISSING'}] '{s}'")

print(f"\nTotal lines: {content_check.count(chr(10))}")
print("Done!")
