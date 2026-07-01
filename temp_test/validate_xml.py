import zipfile
import xml.etree.ElementTree as ET

def validate_xml(file_path):
    print("=" * 80)
    print(f"VALIDATING XML FOR: {file_path}")
    try:
        with zipfile.ZipFile(file_path, 'r') as z:
            doc_xml_bytes = z.read("word/document.xml")
            
            # Parse XML
            root = ET.fromstring(doc_xml_bytes)
            print("SUCCESS: The XML is well-formed and valid!")
            
    except ET.ParseError as pe:
        print("XML PARSE ERROR:", pe)
        # Print a snippet around the error if possible
        try:
            offset = pe.offset
            print("Error at line:", pe.position)
        except:
            pass
    except Exception as e:
        print("ERROR:", e)

validate_xml("TEMPLATE_TEC.docx")
validate_xml("output_corrupt.docx")
validate_xml("output_fixed.docx")
