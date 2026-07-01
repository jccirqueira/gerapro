import os
import json

base_dir = r"c:\Users\jose.cirqueira.DRIVETECH\Documents"

for root, dirs, files in os.walk(base_dir):
    for f in files:
        if f == "PropostaTecnica.json":
            p = os.path.join(root, f)
            try:
                with open(p, 'r', encoding='utf-8', errors='ignore') as file_obj:
                    data = json.load(file_obj)
                    project = data.get('projeto', '')
                    cliente = data.get('cliente', '')
                    if "cmaa" in project.lower() or "uvp" in project.lower() or "cmaa" in cliente.lower() or "uvp" in cliente.lower() or "subestação" in project.lower():
                        print(f"MATCH FOUND: {p}")
                        print(f"  Project: {project}")
                        print(f"  Client: {cliente}")
                        print(f"  JSON Path: {p}")
            except Exception as e:
                pass
