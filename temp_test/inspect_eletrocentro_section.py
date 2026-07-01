import zipfile
import xml.etree.ElementTree as ET

path = "TEMPLATE_TEC.docx"
w_ns = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
ns = {'w': w_ns}

with zipfile.ZipFile(path, 'r') as z:
    doc_xml = z.read("word/document.xml")
    root = ET.fromstring(doc_xml)
    
    # Let's find all paragraphs <w:p> and see their text
    paragraphs = root.findall('.//w:p', ns)
    print(f"Total paragraphs: {len(paragraphs)}")
    
    for idx, p in enumerate(paragraphs):
        texts = [node.text for node in p.iter(f'{{{w_ns}}}t') if node.text]
        p_text = "".join(texts)
        if "ELETROCENTRO" in p_text or "MATRIZ DE RESPONSABILIDADE" in p_text:
            print(f"P {idx}: {repr(p_text)}")
