import os
import glob
import zipfile

downloads_dir = r"c:\Users\jose.cirqueira.DRIVETECH\Downloads"
pattern = os.path.join(downloads_dir, "*Proposta_Tecnica*.docx")
files = glob.glob(pattern)

if not files:
    print("No proposal files found!")
else:
    files.sort(key=os.path.getmtime, reverse=True)
    latest_file = files[0]
    print(f"Inspecting file: {latest_file}")
    
    try:
        with zipfile.ZipFile(latest_file, 'r') as z:
            for name in z.namelist():
                if name.endswith(".xml") or name.endswith(".rels"):
                    try:
                        content = z.read(name).decode("utf-8")
                        if "ns0:" in content:
                            print(f"File: {name} contains 'ns0:' prefix!")
                            pos = content.find("ns0:")
                            start = max(0, pos - 50)
                            end = min(len(content), pos + 100)
                            print("  Context:", repr(content[start:end]))
                    except Exception as e:
                        pass
    except Exception as e:
        print("Error:", e)
