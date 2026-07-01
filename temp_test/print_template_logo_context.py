import zipfile
import re

docx_path = r"c:\Users\jose.cirqueira.DRIVETECH\Documents\Workspace_A\GeraPro\TEMPLATE_TEC.docx"

try:
    with zipfile.ZipFile(docx_path, 'r') as z:
        doc_xml = z.read("word/document.xml").decode("utf-8")
        matches = list(re.finditer(r"client_logo", doc_xml))
        print(f"Occurrences of 'client_logo' in TEMPLATE_TEC.docx: {len(matches)}")
        for idx, match in enumerate(matches):
            start = max(0, match.start() - 100)
            end = min(len(doc_xml), match.end() + 100)
            print(f"\nMatch {idx} at index {match.start()}:")
            print(doc_xml[start:end])
except Exception as e:
    print("Error:", e)
