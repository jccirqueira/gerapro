import zipfile

path = "TEMPLATE_TEC.docx"
with zipfile.ZipFile(path, 'r') as z:
    content = z.read("word/document.xml").decode("utf-8")
    
    pos_start = content.find("{#tem_eletrocentro}")
    if pos_start != -1:
        print("--- OPENING TAG REGION ---")
        print(repr(content[pos_start - 300 : pos_start + 300]))
        
    pos_end = content.find("{/tem_eletrocentro}")
    if pos_end != -1:
        print("\n--- CLOSING TAG REGION ---")
        print(repr(content[pos_end - 300 : pos_end + 300]))
