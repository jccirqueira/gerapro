import zipfile
import xml.etree.ElementTree as ET

path = "TEMPLATE_TEC.docx"
w_ns = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
ns = {'w': w_ns}

with zipfile.ZipFile(path, 'r') as z:
    doc_xml = z.read("word/document.xml")
    root = ET.fromstring(doc_xml)
    
    # We want to traverse children under root/body
    body = root.find('.//w:body', ns)
    children = list(body)
    print(f"Total top-level children in body: {len(children)}")
    
    # Let's find where Paragraph 546 is.
    # A top-level child can be <w:p> or <w:tbl>
    p_idx = 0
    for idx, child in enumerate(children):
        if child.tag == f'{{{w_ns}}}p':
            texts = [node.text for node in child.iter(f'{{{w_ns}}}t') if node.text]
            p_text = "".join(texts)
            if p_idx in range(540, 570) or "ELETROCENTRO" in p_text or "MATRIZ DE RESPONSABILIDADES" in p_text:
                print(f"Child {idx} (P {p_idx}): tag={child.tag.replace(f'{{{w_ns}}}', 'w:')} text={repr(p_text)}")
            p_idx += 1
        elif child.tag == f'{{{w_ns}}}tbl':
            # See if there's text inside the table
            texts = [node.text for node in child.iter(f'{{{w_ns}}}t') if node.text]
            tbl_text = "".join(texts)[:80]
            print(f"Child {idx}: tag=w:tbl text={repr(tbl_text)}")
