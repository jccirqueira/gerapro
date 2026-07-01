import os
import sys
import shutil
import zipfile
import time
import xml.etree.ElementTree as ET

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

w_ns = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
ns = {'w': w_ns}

def run_master_patch():
    backup_path = r"c:\Users\jose.cirqueira.DRIVETECH\Documents\GeraPro\TEMPLATE_TEC.docx"
    output_path = "TEMPLATE_TEC.docx"
    
    print(f"1. Restoring pristine copy from: {backup_path}")
    if os.path.exists(output_path):
        try:
            os.remove(output_path)
        except Exception:
            pass
    shutil.copy(backup_path, output_path)
    print("Pristine copy restored in workspace.")
    
    # Register namespaces explicitly
    ET.register_namespace('w', w_ns)
    ET.register_namespace('r', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships')
    ET.register_namespace('wp', 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing')
    ET.register_namespace('a', 'http://schemas.openxmlformats.org/drawingml/2006/main')
    ET.register_namespace('pic', 'http://schemas.openxmlformats.org/drawingml/2006/picture')
    ET.register_namespace('w14', 'http://schemas.microsoft.com/office/word/2010/wordml')
    ET.register_namespace('wp14', 'http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing')
    ET.register_namespace('mc', 'http://schemas.openxmlformats.org/markup-compatibility/2006')
    
    # Read original zip
    with zipfile.ZipFile(output_path, 'r') as docx_in:
        xml_content = docx_in.read('word/document.xml')
        root = ET.fromstring(xml_content)
        
        # A. Apply Eletrocentro wrapping tags
        body = root.find('.//w:body', ns)
        children = list(body)
        
        start_idx = -1
        for idx, child in enumerate(children):
            if child.tag == f'{{{w_ns}}}p':
                texts = [node.text for node in child.iter(f'{{{w_ns}}}t') if node.text]
                child_text = "".join(texts).strip()
                if child_text == "ELETROCENTRO":
                    start_idx = idx
                    break
                    
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
                        
        print(f"Eletrocentro section start index: {start_idx}, end index: {end_idx}")
        if start_idx == -1 or end_idx == -1:
            print("Error: Could not locate Eletrocentro or Painéis de Média Tensão sections!")
            return
            
        p_start = ET.Element(f'{{{w_ns}}}p')
        r_start = ET.SubElement(p_start, f'{{{w_ns}}}r')
        t_start = ET.SubElement(r_start, f'{{{w_ns}}}t')
        t_start.text = "{#tem_eletrocentro}"
        
        p_end = ET.Element(f'{{{w_ns}}}p')
        r_end = ET.SubElement(p_end, f'{{{w_ns}}}r')
        t_end = ET.SubElement(r_end, f'{{{w_ns}}}t')
        t_end.text = "{/tem_eletrocentro}"
        
        body.insert(end_idx, p_end)
        body.insert(start_idx, p_start)
        print("Conditional wrapping tags injected successfully!")
        
        # B. Apply cell alignment centering to Responsibility Matrix table
        tables = root.findall('.//w:tbl', ns)
        target_table = None
        for tbl in tables:
            texts = [node.text for node in tbl.iter(f'{{{w_ns}}}t') if node.text]
            tbl_text = "".join(texts)
            if "MATRIZ DE RESPONSABILIDADE" in tbl_text and "PROJETOS" in tbl_text:
                target_table = tbl
                break
                
        if target_table is None:
            print("Warning: Matriz de Responsabilidade table not found!")
        else:
            rows = target_table.findall('w:tr', ns)
            centered_cells = 0
            for r in rows:
                cells = r.findall('w:tc', ns)
                if len(cells) <= 1:
                    continue
                for cell in cells:
                    tcPr = cell.find(f'{{{w_ns}}}tcPr')
                    if tcPr is None:
                        tcPr = ET.Element(f'{{{w_ns}}}tcPr')
                        cell.insert(0, tcPr)
                        
                    vAlign_existing = tcPr.find(f'{{{w_ns}}}vAlign')
                    if vAlign_existing is not None:
                        tcPr.remove(vAlign_existing)
                        
                    vAlign = ET.SubElement(tcPr, f'{{{w_ns}}}vAlign')
                    vAlign.set(f'{{{w_ns}}}val', 'center')
                    centered_cells += 1
            print(f"Applied vertical cell centering to {centered_cells} cells!")
            
        # Write back XML
        patched_xml = ET.tostring(root, encoding='utf-8')
        
        # Save to temp_out.docx
        temp_out = "temp_out.docx"
        if os.path.exists(temp_out):
            try:
                os.remove(temp_out)
            except Exception:
                pass
                
        with zipfile.ZipFile(output_path, 'r') as z_in:
            with zipfile.ZipFile(temp_out, 'w', zipfile.ZIP_DEFLATED) as z_out:
                for item in z_in.infolist():
                    if item.filename != 'word/document.xml':
                        z_out.writestr(item, z_in.read(item.filename))
                z_out.writestr('word/document.xml', patched_xml)
                
    # Copy temp_out to TEMPLATE_TEC.docx with retry loop
    success = False
    for attempt in range(1, 6):
        try:
            if os.path.exists(output_path):
                os.remove(output_path)
            shutil.copy(temp_out, output_path)
            if os.path.exists(temp_out):
                os.remove(temp_out)
            print(f"Master patch applied and template written successfully (Attempt {attempt})!")
            success = True
            break
        except PermissionError:
            print(f"Attempt {attempt} failed: File locked by Windows. Retrying in 200ms...")
            time.sleep(0.200)
            
    if not success:
        print("\n[ERRO] O arquivo TEMPLATE_TEC.docx está travado pelo Windows ou Word.")
        print("[AÇÃO] Por favor, certifique-se de fechar o Word e execute novamente.\n")

if __name__ == "__main__":
    run_master_patch()
