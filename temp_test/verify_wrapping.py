import zipfile

path = "TEMPLATE_TEC.docx"
try:
    with zipfile.ZipFile(path, 'r') as z:
        content = z.read("word/document.xml").decode("utf-8")
        print("Template contains '{#tem_eletrocentro}':", "{#tem_eletrocentro}" in content)
        print("Template contains '{/tem_eletrocentro}':", "{/tem_eletrocentro}" in content)
        
        # Also print context around the tags
        if "{#tem_eletrocentro}" in content:
            pos = content.find("{#tem_eletrocentro}")
            print("\nStart tag context:", repr(content[pos-100:pos+100]))
            
        if "{/tem_eletrocentro}" in content:
            pos = content.find("{/tem_eletrocentro}")
            print("\nEnd tag context:", repr(content[pos-100:pos+100]))
            
except Exception as e:
    print("Error:", e)
