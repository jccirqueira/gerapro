import zipfile
import xml.etree.ElementTree as ET

path = "TEMPLATE_TEC.docx"
w_ns = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
ns = {'w': w_ns}

try:
    with zipfile.ZipFile(path, 'r') as z:
        doc_xml = z.read("word/document.xml")
        root = ET.fromstring(doc_xml)
        
        # Check wrapping tags
        doc_xml_str = doc_xml.decode("utf-8")
        has_start = "{#tem_eletrocentro}" in doc_xml_str
        has_end = "{/tem_eletrocentro}" in doc_xml_str
        print("1. Contains '{#tem_eletrocentro}':", has_start)
        print("2. Contains '{/tem_eletrocentro}':", has_end)
        
        # Check cell centering in Matriz de Responsabilidade
        tables = root.findall('.//w:tbl', ns)
        centered_cells_count = 0
        for tbl in tables:
            texts = [node.text for node in tbl.iter(f'{{{w_ns}}}t') if node.text]
            tbl_text = "".join(texts)
            if "MATRIZ DE RESPONSABILIDADE" in tbl_text and "PROJETOS" in tbl_text:
                for cell in tbl.findall('.//w:tc', ns):
                    vAlign = cell.find('.//w:vAlign', ns)
                    if vAlign is not None and vAlign.get(f'{{{w_ns}}}val') == 'center':
                        centered_cells_count += 1
                        
        print("3. Number of cells with vertical centering:", centered_cells_count)
        
except Exception as e:
    print("Error:", e)
