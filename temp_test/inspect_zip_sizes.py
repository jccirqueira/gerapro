import zipfile

path = "TEMPLATE_TEC.docx"
print(f"Inspecting zip files in: {path}")
with zipfile.ZipFile(path, 'r') as z:
    for item in sorted(z.infolist(), key=lambda x: x.file_size, reverse=True)[:10]:
        print(f"File: {item.filename}, size: {item.file_size} bytes, compressed: {item.compress_size} bytes")
