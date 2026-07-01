import zipfile
import re

docx_path = r"c:\Users\jose.cirqueira.DRIVETECH\Documents\Workspace_A\GeraPro\TEMPLATE_TEC.docx"

def check_file(zip_obj, filename):
    print("=" * 60)
    print("CHECKING:", filename)
    try:
        content = zip_obj.read(filename).decode("utf-8")
        placeholders = re.findall(r"\{[^{}]+\}", content)
        print(f"Found {len(placeholders)} placeholders:")
        for p in sorted(list(set(placeholders))):
            print("  ", p)
    except KeyError:
        print("File not found in archive.")
    except Exception as e:
        print("Error:", e)

with zipfile.ZipFile(docx_path, 'r') as z:
    for name in sorted(z.namelist()):
        if "header" in name or "footer" in name:
            check_file(z, name)
