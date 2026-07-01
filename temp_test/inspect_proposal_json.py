import json
import os

docs_dir = r"c:\Users\jose.cirqueira.DRIVETECH\Documents"

candidates = [
    os.path.join(docs_dir, "DVT-2026-1488-Subesta\u00e7\u00e3o CMAA UVP", "Documenta\u00e7\u00e3o Drivetech", "PropostaTecnica.json"),
    os.path.join(docs_dir, "DVT-2026-1488-Subesta\u00e7\u00e3o CMAA UVP", "Documenta\u00e7\u00e3o Drivetech", "Rev1", "PropostaTecnica.json"),
    os.path.join(docs_dir, "DVT-2026-2212-Teste", "Documenta\u00e7\u00e3o Drivetech", "PropostaTecnica.json")
]

for p in candidates:
    # Resolve exact path (with encoding)
    dir_part = os.path.dirname(p)
    file_part = os.path.basename(p)
    
    # Try to find match
    if not os.path.exists(dir_part):
        # Scan parent
        parent = os.path.dirname(dir_part)
        if os.path.exists(parent):
            matched_dirs = [os.path.join(parent, d) for d in os.listdir(parent) if d.lower() in dir_part.lower() or dir_part.lower() in d.lower() or "1488" in d or "2212" in d]
            if matched_dirs:
                p = os.path.join(matched_dirs[0], "Documenta\u00e7\u00e3o Drivetech", file_part)
                # handle Rev1
                if "Rev1" in dir_part:
                    p = os.path.join(matched_dirs[0], "Documenta\u00e7\u00e3o Drivetech", "Rev1", file_part)
    
    # Resolve the second time with encoding
    parent_of_dvt = os.path.dirname(p)
    if os.path.exists(parent_of_dvt):
        files_in_dvt = os.listdir(parent_of_dvt)
        for f in files_in_dvt:
            if f.lower() == file_part.lower():
                p = os.path.join(parent_of_dvt, f)
                break
                
    if os.path.exists(p):
        print("=" * 60)
        print("LOADING PATH:", p)
        try:
            with open(p, 'r', encoding='utf-8') as f:
                data = json.load(f)
            print("Successfully loaded JSON")
            print("Project:", data.get("projeto"))
            print("Client:", data.get("cliente"))
            print("Logo Base64 Length:", len(data.get("logo_base64", "") or ""))
            print("Client Logo Base64 Length:", len(data.get("client_logo_base64", "") or ""))
            print("Watermark Base64 Length:", len(data.get("watermark_base64", "") or ""))
            
            equipments = data.get("equipments", [])
            print(f"Number of equipments: {len(equipments)}")
            for idx, eq in enumerate(equipments):
                print(f"  Eq {idx}: Tag={eq.get('tag')}, Type={eq.get('type')}")
                if eq.get('type') == 'ELETROCENTRO':
                    scope = eq.get('eletrocentroScope', [])
                    print(f"    Eletrocentro Scope Length: {len(scope)}")
        except Exception as e:
            print("Error loading:", e)
    else:
        print("PATH NOT FOUND:", p)
