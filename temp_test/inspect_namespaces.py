import zipfile

path = "TEMPLATE_TEC.docx"
with zipfile.ZipFile(path, 'r') as z:
    doc_xml = z.read("word/document.xml").decode("utf-8")
    
    # Print the root element declaration
    root_end = doc_xml.find(">")
    print("Root element declaration:")
    print(doc_xml[:root_end+1])
