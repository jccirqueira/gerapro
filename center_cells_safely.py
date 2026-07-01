import os
import sys
import zipfile
import xml.etree.ElementTree as ET

try:
    sys.stdout.reconfigure(encoding='utf-8')
except Exception:
    pass

def center_cells_safely():
    path = "TEMPLATE_TEC.docx"
    temp_path = "TEMPLATE_TEC_centered_safe.docx"
    
    if not os.path.exists(path):
        print("File TEMPLATE_TEC.docx not found!")
        return
        
    w_ns = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
    ns = {'w': w_ns}
    
    # Read the original zip and extract word/document.xml
    with zipfile.ZipFile(path, 'r') as docx_in:
        xml_content = docx_in.read('word/document.xml')
        # Copy all other files to the new zip
        with zipfile.ZipFile(temp_path, 'w') as docx_out:
            for item in docx_in.infolist():
                if item.filename != 'word/document.xml':
                    docx_out.writestr(item, docx_in.read(item.filename))
            
            # Parse XML
            root = ET.fromstring(xml_content)
            
            # Find target table
            tables = root.findall('.//w:tbl', ns)
            target_table = None
            for tbl in tables:
                texts = [node.text for node in tbl.iter(f'{{{w_ns}}}t') if node.text]
                tbl_text = "".join(texts)
                if "PROJETOS" in tbl_text and "escopo_eletrocentro" in tbl_text:
                    target_table = tbl
                    break
                    
            if target_table is None:
                print("Eletrocentro Responsibility Matrix table not found!")
                return
                
            rows = target_table.findall('w:tr', ns)
            print(f"Table rows found: {len(rows)}")
            
            # Modify every cell in every row of the table
            for r_idx, r in enumerate(rows):
                # Skip the first header rows and single-cell section spanned rows
                cells = r.findall('w:tc', ns)
                if len(cells) <= 1:
                    continue
                    
                for c_idx, cell in enumerate(cells):
                    tcPr = cell.find(f'{{{w_ns}}}tcPr')
                    if tcPr is None:
                        tcPr = ET.Element(f'{{{w_ns}}}tcPr')
                        cell.insert(0, tcPr)
                        
                    # Remove any existing vAlign element to avoid duplicates
                    vAlign_existing = tcPr.find(f'{{{w_ns}}}vAlign')
                    if vAlign_existing is not None:
                        tcPr.remove(vAlign_existing)
                        
                    # Append w:vAlign at the very end of tcPr (correct XSD position)
                    vAlign = ET.SubElement(tcPr, f'{{{w_ns}}}vAlign')
                    vAlign.set(f'{{{w_ns}}}val', 'center')
                        
            # Write patched XML back
            patched_xml = ET.tostring(root, encoding='utf-8')
            docx_out.writestr('word/document.xml', patched_xml)
            
    # Overwrite original file with patched file
    os.remove(path)
    os.rename(temp_path, path)
    print("TEMPLATE_TEC.docx successfully updated with safe vertical-centered cell properties!")

if __name__ == "__main__":
    center_cells_safely()
