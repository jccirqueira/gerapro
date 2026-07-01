import re

path = 'js/propostaTecnica.js'

with open(path, 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

print(f"FFFD occurrences before fix: {content.count(chr(0xFFFD))}")

# The corruption pattern: FFFD + '?' + latin_supplement_char
# Original char = chr(0x40 + ord(latin_supplement_char))
# This works because:
#   UTF-8 for U+00E0..U+00FF is: C3 (0x80+(c-0xC0)) 
#   second byte XX = 0x80 + (c & 0x3F) = c - 0x40
#   so c = XX + 0x40

def fix_corruption(m):
    # m.group(1) is the char after '?'
    xx = ord(m.group(1))
    if 0xA0 <= xx <= 0xBF:  # Valid Latin supplement range
        return chr(0x40 + xx)
    return m.group(0)  # Leave unchanged if unknown

# Pattern: FFFD followed by '?' followed by a Latin supplement char (U+00A0 to U+00BF)
pattern = re.compile(r'\ufffd\?(.)', re.DOTALL)
fixed = pattern.sub(fix_corruption, content)

remaining = fixed.count(chr(0xFFFD))
print(f"FFFD occurrences after fix: {remaining}")

# Verify known Portuguese words
samples = ['Técnica', 'Características', 'cálculos', 'Revisões',
           'Frequência', 'Execução', 'Definição', 'Mão de Obra',
           'Eletrocentro', 'função', 'Gerenciamento', 'Especificações']
for s in samples:
    found = s in fixed
    print(f"  [{'OK' if found else 'MISSING'}] '{s}'")

print(f"\nTotal lines: {fixed.count(chr(10))}")

with open(path, 'w', encoding='utf-8') as f:
    f.write(fixed)
print("File saved!")
