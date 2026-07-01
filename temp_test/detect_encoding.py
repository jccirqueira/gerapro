import re

path = 'js/propostaTecnica.js'

# Read raw bytes to understand what we have
with open(path, 'rb') as f:
    raw = f.read()

print(f"File size: {len(raw)} bytes")
print(f"First 4 bytes (BOM check): {raw[:4].hex()}")

# Look for the known garbled pattern: Ã© = UTF-8 bytes C3 A9 stored as two cp1252 chars
# In raw bytes: C3 83 C2 A9 (double-encoded UTF-8)
# Let's check what bytes surround 'T cnica' text
idx = raw.find(b'cnica')
if idx != -1:
    print(f"\nBytes around 'cnica' at offset {idx}:")
    print(f"  Hex: {raw[idx-5:idx+10].hex()}")
    print(f"  Raw: {raw[idx-5:idx+10]}")

# Try different decode strategies
print("\n--- Strategy tests ---")

# Strategy 1: raw as utf-8 (will fail on bad sequences)
try:
    s1 = raw.decode('utf-8')
    print(f"Strategy 1 (raw->utf8): OK - 'Técnica' found: {'Técnica' in s1}")
except Exception as e:
    print(f"Strategy 1 (raw->utf8): FAILED - {e}")

# Strategy 2: raw as latin-1 -> encode latin-1 -> decode utf-8 
try:
    s2 = raw.decode('latin-1').encode('latin-1').decode('utf-8')
    print(f"Strategy 2 (latin-1 roundtrip): OK - 'Técnica' found: {'Técnica' in s2}")
except Exception as e:
    print(f"Strategy 2 (latin-1 roundtrip): FAILED - {e}")

# Strategy 3: raw as utf-8-sig (with BOM)
try:
    s3 = raw.decode('utf-8-sig')
    print(f"Strategy 3 (utf-8-sig): OK - 'Técnica' found: {'Técnica' in s3}")
except Exception as e:
    print(f"Strategy 3 (utf-8-sig): FAILED - {e}")

# Strategy 4: check if it's double-encoded (UTF-8 bytes encoded as UTF-8 again)
# Ã© in utf-8 is C3 83 C2 A9
try:
    s4 = raw.decode('utf-8', errors='replace')
    # Check for double-encoded sequences
    has_tilde_a = 'Ã' in s4
    print(f"Strategy 4 (utf-8 with replace): 'Ã' present (double-encoded): {has_tilde_a}")
    if has_tilde_a:
        # Fix double-encoded UTF-8: encode as latin-1, decode as utf-8
        fixed = s4.encode('latin-1', errors='replace').decode('utf-8', errors='replace')
        print(f"  After double-encode fix: 'Técnica' found: {'Técnica' in fixed}")
except Exception as e:
    print(f"Strategy 4: FAILED - {e}")
