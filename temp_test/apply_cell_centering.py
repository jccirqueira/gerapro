import os
import sys
import zipfile
import xml.etree.ElementTree as ET

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

def apply_cell_centering():
    backup_path = r"c:\Users\jose.cirqueira.DRIVETECH\Documents\GeraPro\TEMPLATE_TEC.docx"
    output_path = "TEMPLATE_TEC.docx"
    
    if not os.path.exists(backup_path):
        print(f"Error: Backup file not found at: {backup_path}")
        return
        
    print(f"Reading pristine backup: {backup_path}")
    
    # 1. REGISTER NAMESPACES EXPLICITLY SO PYTHON WRITES STANDARD PREFIXES (w:, r:, etc.)
    w_ns = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
    ns = {'w': w_ns}
    
    ET.register_namespace('w', w_ns)
    ET.register_namespace('r', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships')
    ET.register_namespace('wp', 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing')
    ET.register_namespace('a', 'http://schemas.openxmlformats.org/drawingml/2006/main')
    ET.register_namespace('pic', 'http://schemas.openxmlformats.org/drawingml/2006/picture')
    ET.register_namespace('w14', 'http://schemas.microsoft.com/office/word/2010/wordml')
    ET.register_namespace('wp14', 'http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing')
    ET.register_namespace('mc', 'http://schemas.openxmlformats.org/markup-compatibility/2006')
    
    # Read original zip and extract word/document.xml
    with zipfile.ZipFile(backup_path, 'r') as docx_in:
        xml_content = docx_in.read('word/document.xml')
        
        # Open output zip with standard DEFLATE compression
        with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as docx_out:
            # Copy all files EXCEPT word/document.xml
            for item in docx_in.infolist():
                if item.filename != 'word/document.xml':
                    docx_out.writestr(item, docx_in.read(item.filename))
            
            # Parse XML
            root = ET.fromstring(xml_content)
            
            # Find target table containing "MATRIZ DE RESPONSABILIDADE" and "PROJETOS"
            tables = root.findall('.//w:tbl', ns)
            target_table = None
            for tbl in tables:
                texts = [node.text for node in tbl.iter(f'{{{w_ns}}}t') if node.text]
                tbl_text = "".join(texts)
                if "MATRIZ DE RESPONSABILIDADE" in tbl_text and "PROJETOS" in tbl_text:
                    target_table = tbl
                    break
                    
            if target_table is None:
                print("Warning: Eletrocentro Responsibility Matrix table not found! Standard copy will be used.")
            else:
                rows = target_table.findall('w:tr', ns)
                print(f"Table rows found: {len(rows)}")
                
                # Apply vertical alignment centering on every cell of this table
                for r_idx, r in enumerate(rows):
                    cells = r.findall('w:tc', ns)
                    if len(cells) <= 1:
                        # Skip full-span headers/labels
                        continue
                        
                    for c_idx, cell in enumerate(cells):
                        tcPr = cell.find(f'{{{w_ns}}}tcPr')
                        if tcPr is None:
                            tcPr = ET.Element(f'{{{w_ns}}}tcPr')
                            cell.insert(0, tcPr)
                            
                        # Avoid duplicates
                        vAlign_existing = tcPr.find(f'{{{w_ns}}}vAlign')
                        if vAlign_existing is not None:
                            tcPr.remove(vAlign_existing)
                            
                        # Append w:vAlign at the end of tcPr
                        vAlign = ET.SubElement(tcPr, f'{{{w_ns}}}vAlign')
                        vAlign.set(f'{{{w_ns}}}val', 'center')
                
                print("Vertical alignment centering applied successfully to Eletrocentro Matrix table!")
            
            # Serialize XML back to string
            patched_xml = ET.tostring(root, encoding='utf-8')
            
            # Write patched XML to output ZIP
            docx_out.writestr('word/document.xml', patched_xml)
            
    print(f"Patched template saved successfully to active file: {output_path} (Compressed!)")
    print(f"New file size: {os.path.getsize(output_path)} bytes")

if __name__ == "__main__":
    apply_cell_centering()
