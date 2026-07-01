import os
import glob
import zipfile
import xml.etree.ElementTree as ET

downloads_dir = r"c:\Users\jose.cirqueira.DRIVETECH\Downloads"
pattern = os.path.join(downloads_dir, "*Proposta_Tecnica*.docx")
files = glob.glob(pattern)

if not files:
    print("No proposal files found!")
else:
    files.sort(key=os.path.getmtime, reverse=True)
    latest_file = files[0]
    print(f"Checking XML syntax for: {latest_file}")
    
    try:
        with zipfile.ZipFile(latest_file, 'r') as z:
            doc_xml = z.read("word/document.xml")
            
            # Try to parse using ElementTree
            try:
                root = ET.fromstring(doc_xml)
                print("XML Syntax Check: 100% VALID XML (ElementTree parsed it without errors).")
            except ET.ParseError as pe:
                print("XML Syntax Check: FAILED with ParseError!")
                print("Error Details:", pe)
                
                # Show context around the parse error
                lineno, offset = pe.position
                lines = doc_xml.decode("utf-8").split("\n")
                if lineno <= len(lines):
                    err_line = lines[lineno - 1]
                    start = max(0, offset - 100)
                    end = min(len(err_line), offset + 100)
                    print(f"Error context at line {lineno}, offset {offset}:")
                    print(repr(err_line[start:end]))
                    
    except Exception as e:
        print("Error:", e)
