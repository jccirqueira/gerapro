import sys
import zipfile
import xml.etree.ElementTree as ET

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

path = "TEMPLATE_TEC.docx"
w_ns = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
ns = {'w': w_ns}

with zipfile.ZipFile(path, 'r') as z:
    doc_xml = z.read("word/document.xml")
    root = ET.fromstring(doc_xml)
    
    body = root.find('.//w:body', ns)
    children = list(body)
    
    print(f"Printing non-empty elements from 275 to 400:")
    for idx in range(275, min(400, len(children))):
        child = children[idx]
        tag = child.tag.replace(f'{{{w_ns}}}', 'w:')
        
        texts = [node.text for node in child.iter(f'{{{w_ns}}}t') if node.text]
        child_text = "".join(texts).strip()
        
        if child_text:
            print(f"Child {idx}: tag={tag}, text={repr(child_text[:120])}")
