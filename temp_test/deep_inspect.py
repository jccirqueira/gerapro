path = 'js/propostaTecnica.js'

with open(path, 'rb') as f:
    raw = f.read()

print(f"File size: {len(raw)} bytes")
print(f"First 4 bytes: {raw[:4].hex()}")

# Find 'cnica' and show surrounding bytes
for search in [b'cnica', b'lculos', b'is\xc3', b'is\xc3\xb5']:
    idx = raw.find(search)
    if idx != -1:
        print(f"\nFound {search!r} at offset {idx}:")
        print(f"  Hex: {raw[idx-8:idx+12].hex()}")
        print(f"  Repr: {raw[idx-8:idx+12]}")

# Check what encoding makes 'Técnica' appear
for enc in ['utf-8', 'latin-1', 'cp1252', 'utf-16', 'utf-16-le']:
    try:
        decoded = raw.decode(enc, errors='replace')
        found = 'Técnica' in decoded
        found2 = 'Ã©' in decoded
        print(f"[{enc}]: 'Técnica'={found}, 'Ã©'={found2}, first100={repr(decoded[4820:4860])}")
    except Exception as e:
        print(f"[{enc}]: ERROR {e}")
