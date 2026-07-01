import sys
import os
import zipfile
import xml.etree.ElementTree as ET

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

w_ns = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
ns = {'w': w_ns}

def wrap_eletrocentro():
    path = "TEMPLATE_TEC.docx"
    print(f"Reading template: {path}")
    
    # Register namespaces to write clean XML
    ET.register_namespace('w', w_ns)
    ET.register_namespace('r', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships')
    ET.register_namespace('wp', 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing')
    ET.register_namespace('a', 'http://schemas.openxmlformats.org/drawingml/2006/main')
    ET.register_namespace('pic', 'http://schemas.openxmlformats.org/drawingml/2006/picture')
    ET.register_namespace('w14', 'http://schemas.microsoft.com/office/word/2010/wordml')
    ET.register_namespace('wp14', 'http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing')
    ET.register_namespace('mc', 'http://schemas.openxmlformats.org/markup-compatibility/2006')
    
    try:
        with zipfile.ZipFile(path, 'r') as docx_in:
            xml_content = docx_in.read('word/document.xml')
            root = ET.fromstring(xml_content)
    except PermissionError:
        print("\n[ERRO] O arquivo TEMPLATE_TEC.docx está aberto no Microsoft Word.")
        print("[AÇÃO] Por favor, FECHE o arquivo no Microsoft Word e execute novamente!\n")
        return
        
    body = root.find('.//w:body', ns)
    children = list(body)
    
    # 1. Find start paragraph
    start_idx = -1
    for idx, child in enumerate(children):
        if child.tag == f'{{{w_ns}}}p':
            texts = [node.text for node in child.iter(f'{{{w_ns}}}t') if node.text]
            child_text = "".join(texts).strip()
            if child_text == "ELETROCENTRO":
                start_idx = idx
                break
                
    # 2. Find end paragraph
    end_idx = -1
    if start_idx != -1:
        for idx in range(start_idx, len(children)):
            child = children[idx]
            if child.tag == f'{{{w_ns}}}p':
                texts = [node.text for node in child.iter(f'{{{w_ns}}}t') if node.text]
                child_text = "".join(texts).strip()
                if child_text == "PAINÉIS DE MÉDIA TENSÃO":
                    end_idx = idx
                    break
                    
    print(f"Start paragraph index: {start_idx}")
    print(f"End paragraph index: {end_idx}")
    
    if start_idx == -1 or end_idx == -1:
        print("Error: Could not locate Eletrocentro or Painéis de Média Tensão sections!")
        return
        
    # 3. Create w:p elements for the tags
    p_start = ET.Element(f'{{{w_ns}}}p')
    r_start = ET.SubElement(p_start, f'{{{w_ns}}}r')
    t_start = ET.SubElement(r_start, f'{{{w_ns}}}t')
    t_start.text = "{#tem_eletrocentro}"
    
    p_end = ET.Element(f'{{{w_ns}}}p')
    r_end = ET.SubElement(p_end, f'{{{w_ns}}}r')
    t_end = ET.SubElement(r_end, f'{{{w_ns}}}t')
    t_end.text = "{/tem_eletrocentro}"
    
    # 4. Insert into the body in reverse order
    body.insert(end_idx, p_end)
    body.insert(start_idx, p_start)
    
    print("Successfully wrapped Eletrocentro section inside conditional tags!")
    
    # 5. Save back to template
    temp_out = "temp_out.docx"
    try:
        with zipfile.ZipFile(path, 'r') as z_in:
            with zipfile.ZipFile(temp_out, 'w', zipfile.ZIP_DEFLATED) as z_out:
                for item in z_in.infolist():
                    if item.filename != 'word/document.xml':
                        z_out.writestr(item, z_in.read(item.filename))
                
                patched_xml = ET.tostring(root, encoding='utf-8')
                z_out.writestr('word/document.xml', patched_xml)
    except PermissionError:
        print("\n[ERRO] O arquivo TEMPLATE_TEC.docx está aberto no Microsoft Word.")
        print("[AÇÃO] Por favor, FECHE o arquivo no Microsoft Word e execute novamente!\n")
        return

    try:
        if os.path.exists(path):
            os.remove(path)
        os.rename(temp_out, path)
        print("Template file overwritten successfully!")
    except PermissionError:
        print("\n[ERRO] O arquivo TEMPLATE_TEC.docx está aberto no Microsoft Word.")
        print("[AÇÃO] Por favor, FECHE o arquivo no Microsoft Word e execute novamente!\n")
        if os.path.exists(temp_out):
            try:
                os.remove(temp_out)
            except:
                pass
        return

if __name__ == "__main__":
    wrap_eletrocentro()
