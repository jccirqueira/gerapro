import zipfile

path = "output_rev1_fixed.docx"
print(f"Verifying generated file: {path}")

try:
    with zipfile.ZipFile(path, 'r') as z:
        print("1. ZIP file is perfectly valid.")
        
        # Read XML
        doc_xml = z.read("word/document.xml").decode("utf-8")
        print("2. Successfully read word/document.xml")
        
        # Check namespaces
        print("3. Contains '<w:document':", "<w:document" in doc_xml)
        print("4. Contains '<ns0:document':", "<ns0:document" in doc_xml)
        
        # Check that templating actually happened (no raw placeholders like {cliente} or {projeto} in the text)
        print("5. Contains raw '{cliente}':", "{cliente}" in doc_xml)
        print("6. Contains raw '{projeto}':", "{projeto}" in doc_xml)
        print("7. Contains client logo tag raw '{%client_logo_img}':", "{%client_logo_img}" in doc_xml)
        
        # Check if the proposal values are indeed present in the document
        print("8. Contains 'CMAA' (actual project data):", "CMAA" in doc_xml)
        
except Exception as e:
    print("Verification Error:", e)
