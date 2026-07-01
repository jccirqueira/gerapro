import zipfile
import xml.etree.ElementTree as ET

path = "TEMPLATE_TEC.docx"
w_ns = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
ns = {'w': w_ns}

with zipfile.ZipFile(path, 'r') as z:
    doc_xml = z.read("word/document.xml")
    root = ET.fromstring(doc_xml)
    
    tables = root.findall('.//w:tbl', ns)
    for idx, tbl in enumerate(tables):
        texts = [node.text for node in tbl.iter(f'{{{w_ns}}}t') if node.text]
        tbl_text = "".join(texts)
        if "MATRIZ DE RESPONSABILIDADE" in tbl_text and "PROJETOS" in tbl_text:
            print("Found Matriz de Responsabilidade table.")
            # Let's look at the first non-trivial cell's tcPr children
            for tc in tbl.findall('.//w:tc', ns):
                tcPr = tc.find('w:tcPr', ns)
                if tcPr is not None:
                    children = [child.tag.replace(f'{{{w_ns}}}', 'w:') for child in tcPr]
                    if len(children) > 1:
                        print("Children inside <w:tcPr>:", children)
                        break
            break
