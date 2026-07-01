import zipfile

def inspect_prefix(path):
    print("=" * 60)
    print(f"File: {path}")
    try:
        with zipfile.ZipFile(path, 'r') as z:
            doc_xml = z.read("word/document.xml").decode("utf-8")
            print("Successfully read word/document.xml")
            print("Contains '<w:document':", "<w:document" in doc_xml)
            print("Contains '<ns0:document':", "<ns0:document" in doc_xml)
            print("Contains '<w:t>':", "<w:t>" in doc_xml)
            print("Contains '<ns0:t>':", "<ns0:t>" in doc_xml)
    except Exception as e:
        print("Error:", e)

inspect_prefix("TEMPLATE_TEC.docx")
inspect_prefix("TEMPLATE_TEC-old.docx")
inspect_prefix("TEMPLATE_COM.docx")
