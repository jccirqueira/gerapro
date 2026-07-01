import zipfile

path = "TEMPLATE_TEC.docx"
with zipfile.ZipFile(path, 'r') as z:
    content = z.read("word/document.xml").decode("utf-8")
    
    # Let's count how many times each tag appears
    print("Occurrences of '{#tem_eletrocentro}':", content.count("{#tem_eletrocentro}"))
    print("Occurrences of '{/tem_eletrocentro}':", content.count("{/tem_eletrocentro}"))
    
    # Find all offsets
    pos = 0
    while True:
        pos = content.find("tem_eletrocentro", pos)
        if pos == -1:
            break
        snippet = content[pos - 50 : pos + 50]
        print(f"Match found at offset {pos}: {repr(snippet)}")
        pos += 1
