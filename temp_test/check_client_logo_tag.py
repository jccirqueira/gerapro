import zipfile

path = r"c:\Users\jose.cirqueira.DRIVETECH\Documents\Workspace_A\GeraPro\TEMPLATE_TEC.docx"
with zipfile.ZipFile(path, 'r') as z:
    doc_xml = z.read("word/document.xml").decode("utf-8")
    
    # Search for client_logo_img
    pos = doc_xml.find("client_logo_img")
    if pos != -1:
        print("FOUND client_logo_img at position:", pos)
        start = max(0, pos - 150)
        end = min(len(doc_xml), pos + 150)
        print("SURROUNDING XML:")
        print(doc_xml[start:end])
        
        # Print char codes of the tag
        tag_start = doc_xml.rfind("{", 0, pos)
        tag_end = doc_xml.find("}", pos)
        if tag_start != -1 and tag_end != -1:
            tag_str = doc_xml[tag_start:tag_end+1]
            print("EXACT TAG STRING:", repr(tag_str))
            print("CHAR CODES:")
            for char in tag_str:
                print(f"  {char!r}: U+{ord(char):04X}")
    else:
        print("client_logo_img NOT FOUND in word/document.xml!")
