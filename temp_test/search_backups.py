import os
import glob

docs_dir = r"c:\Users\jose.cirqueira.DRIVETECH\Documents"
print(f"Searching for TEMPLATE_TEC in: {docs_dir}")

# Search recursively for *.docx files containing 'TEMPLATE_TEC'
pattern = os.path.join(docs_dir, "**", "*TEMPLATE_TEC*.docx")
matches = glob.glob(pattern, recursive=True)

for match in matches:
    print("Found match:", match, "size:", os.path.getsize(match))
