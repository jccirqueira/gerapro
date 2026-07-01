import os
import glob
import zipfile
import xml.etree.ElementTree as ET

downloads_dir = r"c:\Users\jose.cirqueira.DRIVETECH\Downloads"
pattern = os.path.join(downloads_dir, "*Proposta_Tecnica*.docx")
files = glob.glob(pattern)

if not files:
    print("No generated proposal files found in Downloads folder!")
else:
    # Get the most recent file
    files.sort(key=os.path.getmtime, reverse=True)
    latest_file = files[0]
    print(f"Most recent exported file: {latest_file}")
    print(f"Size: {os.path.getsize(latest_file)} bytes")
    
    # Verify zip integrity
    try:
        with zipfile.ZipFile(latest_file, 'r') as z:
            print("Zip integrity check: OK")
            
            # Print list of files in the zip
            print("Files inside zip:")
            for item in z.infolist():
                print(f"  {item.filename} (Size: {item.file_size} bytes)")
                
            # Read word/document.xml
            doc_xml = z.read("word/document.xml").decode("utf-8")
            print("Read word/document.xml successfully.")
            
            # Search for ns0 or other weird prefixes
            print("Contains '<ns0:document':", "<ns0:document" in doc_xml)
            print("Contains '<w:t>':", "<w:t>" in doc_xml)
            print("Contains '<ns0:t>':", "<ns0:t>" in doc_xml)
            
            # Search for client_logo_img
            print("Contains 'client_logo_img' in document.xml:", "client_logo_img" in doc_xml)
            
            # Check relationships
            try:
                rels_xml = z.read("word/_rels/document.xml.rels").decode("utf-8")
                print("Read relationships successfully.")
                print("Contains null or empty targets in rels:", "Target=\"\"" in rels_xml or "Target=\"null\"" in rels_xml)
                if "Target=\"\"" in rels_xml or "Target=\"null\"" in rels_xml or "null" in rels_xml:
                    print("Found 'null' or empty references in relationship file!")
                    # Print lines containing null or empty
                    for line in rels_xml.split("\n"):
                        if "null" in line or 'Target=""' in line:
                            print("  REL LINE:", repr(line))
            except Exception as e:
                print("Rels error:", e)
                
    except Exception as e:
        print("Zip Error:", e)
