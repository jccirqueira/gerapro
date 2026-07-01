import sys
import re
sys.stdout.reconfigure(encoding='utf-8')

path = 'js/propostaTecnica.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

print(f"FFFD before: {content.count(chr(0xFFFD))}")

# Fix pattern: \ufffd?©\ufffd?© -> ção (two accented chars)
# \ufffd?§ -> ç, \ufffd?\xa3 -> ã already fixed from before
# Remaining cases: multi-byte sequences where the extra © or similar appear

# Pattern 1: FFFD + '?' + © + FFFD + '?' + © type sequences
# These are things like 'ção' = C3 A7 C3 A3 6F
# After corruption: FFFD?§FFFD?£o

# Additional direct string replacements for known words
direct_fixes = [
    # çã pattern -> ção, configuração, definição, execução, etc.
    ('\ufffd?\xa7\ufffd?\xa3', 'çã'),   # ção
    ('\ufffd?\xa7\ufffd?\xa5', 'çõ'),
    # Specific remaining patterns from the show_remaining output
    # 'â€"' style or 'PAINEL' related
    ('\ufffd?\ufffd\ufffd??', ''),  # garbage
    # POTÊNCIA
    ('\ufffd?\u0160N', 'ÊN'),   # ŠN -> ÊN (POTÊNCIA)
    # ELÉTRICOS
    ('\ufffd?\ufffd\ufffd?T', 'ÉT'),
]

fixed = content
for old, new in direct_fixes:
    count = fixed.count(old)
    if count > 0:
        fixed = fixed.replace(old, new)
        print(f"  Replaced '{repr(old)}' -> '{new}' ({count}x)")

# Also: FFFD + '?' + Š (U+0160) -> Ê (for POTÊNCIA, ELÉTRICA, etc.)
# Š = U+0160 = 0x160, but our formula only works for 0xA0-0xBF range
# For Š (U+0160), the original byte was... different chain
# Let's try: the remaining patterns may be from ç in words like PAINEL
# PAINÉIS = P-A-I-N-É-I-S: É = C3 89 -> © chain. But © was fixed.
# Let me check what FFFD?©FFFD pattern means

# Pattern: \ufffd?©\ufffd?© -> should be... ©=0xA9, so char1=chr(0xE9)=é, char2=é?
# No, let me look at context: 'de itens â\ufffd?\ufffd?\ufffd?? migr'
# This suggests 'ã' followed by garbage

# Apply regex for remaining: FFFD + '?' + char in 0x80-0xBF that we may have missed
def fix_remaining(m):
    xx = ord(m.group(1))
    # For standard Latin Extended (U+00C0-U+00FF), the formula is chr(0x40+xx)
    if 0xA0 <= xx <= 0xBF:
        return chr(0x40 + xx)
    # For Š (U+0160) -> Ê is not standard, skip
    return m.group(0)

# Already done the main fix. Now try fixing double sequences:
# \ufffd?©\ufffd -> this is é followed by another corrupted char
# The remaining 42 may be in template strings that have specific chars

# Let's look at PAINÉIS pattern: P-A-I-N-É-I-S
# É = U+00C9, UTF-8: C3 89
# 89 in cp1252 = U+2030 (per mille sign ‰) - NOT in latin-1!
# So the chain for É:
# Original: C3 89 -> PS reads as cp1252: 'Ã' + '‰' -> UTF-8: C3 83 E2 80 B0
# fix_encoding.py: C3=Ã, 83=ƒ, E2=â, 80=undefined->FFFD, B0=°
# -> latin-1: C3 3F 3F B0 -> utf8: FFFD '?' FFFD '°'
# So É -> FFFD + '?' + FFFD + '°'

# Let's also handle: FFFD + '?' + FFFD + chr(xx) -> É, etc.
def fix_double(m):
    xx = ord(m.group(1))
    # For this double pattern, the second FFFD+char maps to specific chars
    double_map = {
        '°': 'É',   # 0xB0
        '±': 'Á',   # 0xB1  
        '²': 'Â',   # 0xB2
        '³': 'Ã',   # 0xB3 -> Ã (capital A tilde)
        '´': 'Ä',   # 0xB4
        'µ': 'Å',   # 0xB5
        '¶': 'Æ',   # 0xB6
        '·': 'Ç',   # 0xB7
        '¸': 'È',   # 0xB8
        '¹': 'Ê',   # 0xB9 -> wait
        '°': 'É',
        '\xb9': 'Ê',  # U+00B9
        '\xba': 'Ê',
    }
    c = m.group(1)
    if c in double_map:
        return double_map[c]
    # Generic: for U+00B0-0xBF, original char = chr(0xC0 + (xx-0x80)) 
    # But this gets complicated. For É specifically:
    # É = U+00C9, second UTF-8 byte = 0x80|(0xC9&0x3F) = 0x80|0x09 = 0x89 = 137
    # 0x89 in cp1252 = U+2030 (‰), in UTF-8 = E2 80 B0 (3 bytes)
    # After fix_encoding.py mess: the E2 becomes 'â', 80 -> FFFD, B0 -> '°'
    # So É chain: FFFD '?' â FFFD '°'
    return m.group(0)

# Pattern for É type (double FFFD): FFFD + '?' + â + FFFD + '°'
specific_fixes = {
    '\ufffd?â\ufffd?°': 'É',
    '\ufffd?â\ufffd?¹': 'Ê',  # check
    '\ufffd?Š': 'Ê',  # Š = U+0160
}

for old, new in specific_fixes.items():
    count = fixed.count(old)
    if count > 0:
        fixed = fixed.replace(old, new)
        print(f"  Specific fix '{old}' -> '{new}' ({count}x)")

print(f"FFFD after: {fixed.count(chr(0xFFFD))}")

with open(path, 'w', encoding='utf-8') as f:
    f.write(fixed)
print("Saved!")

# Final check
for s in ['Técnica', 'Características', 'PAINÉIS', 'PAINEL', 'ELÉTRICA', 'POTÊNCIA', 'cálculos', 'função', 'Revisões']:
    print(f"  [{'OK' if s in fixed else 'MISSING'}] {s}")
