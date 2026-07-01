import zipfile

path = "TEMPLATE_TEC.docx"
with zipfile.ZipFile(path, 'r') as z:
    content = z.read("word/document.xml").decode("utf-8")
    
    pos = 744080
    print("--- MYSTERIOUS SECOND TAG REGION ---")
    print(repr(content[pos - 200 : pos + 200]))
