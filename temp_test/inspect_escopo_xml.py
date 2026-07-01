import zipfile
import re

docx_path = r"c:\Users\jose.cirqueira.DRIVETECH\Documents\Workspace_A\GeraPro\TEMPLATE_TEC.docx"

try:
    with zipfile.ZipFile(docx_path, 'r') as z:
        doc_xml = z.read("word/document.xml").decode("utf-8")
        
        # Search for all matches of escopo_eletrocentro
        # We will print 300 characters before and after each occurrence
        for match in re.finditer(r"escopo_eletrocentro", doc_xml):
            start = max(0, match.start() - 300)
            end = min(len(doc_xml), match.end() + 300)
            print("-" * 80)
            print(f"Occurrence at index {match.start()}:")
            print(doc_xml[start:end])
            
except Exception as e:
    print("Error:", e)
