import zipfile
import re

docx_path = r"c:\Users\jose.cirqueira.DRIVETECH\Documents\Workspace_A\GeraPro\TEMPLATE_TEC.docx"

with zipfile.ZipFile(docx_path, 'r') as z:
    doc_xml = z.read("word/document.xml").decode("utf-8")
    
    # Find client_logo
    idx = doc_xml.find("client_logo")
    if idx != -1:
        # Get 15 characters before client_logo and 15 after
        snippet = doc_xml[idx-10:idx+30]
        print("Snippet:", repr(snippet))
        print("Character codes in snippet:")
        for char in snippet:
            print(f"  {repr(char)} -> U+{ord(char):04X}")
