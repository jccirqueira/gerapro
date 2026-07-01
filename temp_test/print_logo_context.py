import zipfile
import re

def print_logo_context(file_path):
    print("=" * 80)
    print(f"FILE: {file_path}")
    try:
        with zipfile.ZipFile(file_path, 'r') as z:
            doc_xml = z.read("word/document.xml").decode("utf-8")
            for match in re.finditer(r"client_logo", doc_xml):
                start = max(0, match.start() - 100)
                end = min(len(doc_xml), match.end() + 100)
                print(doc_xml[start:end])
    except Exception as e:
        print("Error:", e)

print_logo_context("output_corrupt.docx")
