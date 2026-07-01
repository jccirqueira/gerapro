import zipfile
import xml.etree.ElementTree as ET

path = r"c:\Users\jose.cirqueira.DRIVETECH\Documents\GeraPro\TEMPLATE_TEC.docx"
w_ns = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
ns = {'w': w_ns}

with zipfile.ZipFile(path, 'r') as z:
    doc_xml = z.read("word/document.xml")
    root = ET.fromstring(doc_xml)
    
    tables = root.findall('.//w:tbl', ns)
    print(f"Total tables found: {len(tables)}")
    
    for idx, tbl in enumerate(tables):
        texts = [node.text for node in tbl.iter(f'{{{w_ns}}}t') if node.text]
        tbl_text = "".join(texts)
        if "PROJETOS" in tbl_text or "escopo" in tbl_text or "eletro" in tbl_text.lower():
            print(f"Table {idx} matches criteria. Length: {len(tbl_text)}")
            print("Snippet:", repr(tbl_text[:200]))
            print("Has 'PROJETOS':", "PROJETOS" in tbl_text)
            print("Has 'escopo_eletrocentro':", "escopo_eletrocentro" in tbl_text)
            print("Has 'ESCOPO_ELETROCENTRO':", "ESCOPO_ELETROCENTRO" in tbl_text)
