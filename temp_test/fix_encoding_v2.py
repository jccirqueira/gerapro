path = 'js/propostaTecnica.js'

# The encoding corruption chain was:
# 1. Original file: proper UTF-8 (e.g. é = bytes C3 A9)
# 2. PowerShell Get-Content read it as cp1252: C3 -> 'Ã', A9 -> '©', making 'Ã©'
# 3. PowerShell Out-File -Encoding utf8 then encoded those chars as UTF-8:
#    'Ã' (U+00C3) -> C3 83, '©' (U+00A9) -> C2 A9
#    So é became: C3 83 C2 A9 in the file bytes
# Fix: read bytes as UTF-8, then encode each char as latin-1 bytes, decode as UTF-8

with open(path, 'rb') as f:
    raw = f.read()

# Decode as UTF-8 (this gives us Ã© for é, Ã for à etc.)
text = raw.decode('utf-8', errors='replace')

# Now fix: each Unicode char that is in the Latin-1 supplement range
# was originally a UTF-8 multi-byte sequence interpreted as cp1252.
# Encoding back to latin-1 and decoding as UTF-8 restores the original.
try:
    fixed = text.encode('latin-1', errors='replace').decode('utf-8', errors='replace')
except Exception as e:
    print("Direct fix failed:", e)
    fixed = text

# Verify
print("Verification after fix:")
samples = ['Técnica', 'Características', 'Eletrocentro', 'cálculos', 'Revisões',
           'Frequência', 'Execução', 'Definição', 'Mão de Obra']
for s in samples:
    found = s in fixed
    print(f"  [{'OK' if found else 'MISSING'}] '{s}'")

# Count remaining garbled patterns
garbled_count = fixed.count('Ã')
print(f"\nRemaining 'Ã' occurrences (garbled): {garbled_count}")
print(f"Total lines: {fixed.count(chr(10))}")

if garbled_count < 10:  # Accept minor residual
    with open(path, 'w', encoding='utf-8') as f:
        f.write(fixed)
    print("\nFile saved successfully as clean UTF-8!")
else:
    print(f"\nToo many garbled chars ({garbled_count}), NOT saving. Manual inspection needed.")
