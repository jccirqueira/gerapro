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
    
    print(f"Inspecting children from 250 to 275:")
    for idx in range(250, min(275, len(children))):
        child = children[idx]
        tag = child.tag.replace(f'{{{w_ns}}}', 'w:')
        
        # Extract text content
        texts = [node.text for node in child.iter(f'{{{w_ns}}}t') if node.text]
        child_text = "".join(texts)
        
        print(f"Child {idx}: tag={tag}, text_len={len(child_text)}, text_snippet={repr(child_text[:120])}")
