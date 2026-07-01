import os
import glob
import zipfile
import xml.etree.ElementTree as ET

downloads_dir = r"c:\Users\jose.cirqueira.DRIVETECH\Downloads"
pattern = os.path.join(downloads_dir, "*Proposta_Comercial*.docx")
files = glob.glob(pattern)

if not files:
    print("No Commercial Proposal files found in Downloads folder!")
else:
    files.sort(key=os.path.getmtime, reverse=True)
    latest_file = files[0]
    print(f"Most recent Commercial Proposal: {latest_file}")
    print(f"Size: {os.path.getsize(latest_file)} bytes")
    
    try:
        with zipfile.ZipFile(latest_file, 'r') as z:
            doc_xml = z.read("word/document.xml")
            try:
                root = ET.fromstring(doc_xml)
                print("XML Syntax Check: 100% VALID XML (ElementTree parsed it).")
            except Exception as pe:
                print("XML Syntax Check: FAILED!", pe)
            
            # Check prefixes
            doc_xml_str = doc_xml.decode("utf-8")
            print("Contains '<ns0:document':", "<ns0:document" in doc_xml_str)
            print("Contains '<w:t>':", "<w:t>" in doc_xml_str)
            print("Contains '<ns0:t>':", "<ns0:t>" in doc_xml_str)
            
    except Exception as e:
        print("Error:", e)
