import shutil

src = r"c:\Users\jose.cirqueira.DRIVETECH\Documents\GeraPro\TEMPLATE_TEC.docx"
dst = "TEMPLATE_TEC.docx"

print(f"Copying clean backup template from: {src}")
shutil.copy(src, dst)
print("Pristine copy created in workspace!")
