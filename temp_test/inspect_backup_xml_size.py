import zipfile

path = r"c:\Users\jose.cirqueira.DRIVETECH\Documents\GeraPro\TEMPLATE_TEC.docx"
with zipfile.ZipFile(path, 'r') as z:
    info = z.getinfo("word/document.xml")
    print(f"Backup file: {path}")
    print(f"word/document.xml size: {info.file_size} bytes")
