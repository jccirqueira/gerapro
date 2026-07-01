import zipfile
import re

docx_path = r"c:\Users\jose.cirqueira.DRIVETECH\Documents\Workspace_A\GeraPro\TEMPLATE_TEC.docx"

try:
    with zipfile.ZipFile(docx_path, 'r') as z:
        doc_xml = z.read("word/document.xml").decode("utf-8")
        
        # Search for all matches of lista_paineis
        for match in re.finditer(r"lista_paineis", doc_xml):
            start = max(0, match.start() - 300)
            end = min(len(doc_xml), match.end() + 300)
            print("-" * 80)
            print(f"Occurrence of lista_paineis at index {match.start()}:")
            print(doc_xml[start:end])
            
except Exception as e:
    print("Error:", e)
