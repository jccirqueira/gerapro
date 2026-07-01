import os
import json

base_dir = r"c:\Users\jose.cirqueira.DRIVETECH\Documents"
print("Scanning:", base_dir)

found_files = []
for root, dirs, files in os.walk(base_dir):
    for f in files:
        if f == "PropostaTecnica.json" or "proposta" in f.lower():
            p = os.path.join(root, f)
            found_files.append(p)
            print("Found proposal file:", p)

print(f"Total proposal files found: {len(found_files)}")
