import json
import os

docs_dir = r"c:\Users\jose.cirqueira.DRIVETECH\Documents"
entries = os.listdir(docs_dir)
dvt_folder = [e for e in entries if "1488" in e][0]
p_path = os.path.join(docs_dir, dvt_folder, "Documentação Drivetech", "Rev1", "PropostaTecnica.json")

with open(p_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

logo = data.get("client_logo_base64", "")
if logo:
    print("Length of client_logo_base64:", len(logo))
    print("Start of client_logo_base64:", repr(logo[:60]))
else:
    print("client_logo_base64 is empty or not present in JSON.")
