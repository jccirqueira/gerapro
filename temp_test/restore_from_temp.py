import os
import shutil

# Let's check if temp_out.docx exists and restore it to TEMPLATE_TEC.docx
if os.path.exists("temp_out.docx"):
    print("Found temp_out.docx! Restoring it to TEMPLATE_TEC.docx...")
    try:
        if os.path.exists("TEMPLATE_TEC.docx"):
            os.remove("TEMPLATE_TEC.docx")
        shutil.copy("temp_out.docx", "TEMPLATE_TEC.docx")
        os.remove("temp_out.docx")
        print("Restored successfully!")
    except Exception as e:
        print("Error during restore:", e)
else:
    print("temp_out.docx not found. Re-copying pristine template...")
    src = r"c:\Users\jose.cirqueira.DRIVETECH\Documents\GeraPro\TEMPLATE_TEC.docx"
    dst = "TEMPLATE_TEC.docx"
    shutil.copy(src, dst)
    print("Pristine copy restored!")
