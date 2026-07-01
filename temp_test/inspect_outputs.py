import zipfile
import re

def inspect_docx_internals(file_path):
    print("=" * 80)
    print(f"FILE: {file_path}")
    try:
        with zipfile.ZipFile(file_path, 'r') as z:
            namelist = z.namelist()
            print("Files in archive:")
            media_files = []
            for name in sorted(namelist):
                if "media" in name or "rels" in name:
                    media_files.append(name)
                    print(f"  {name} (size: {z.getinfo(name).file_size} bytes)")
            
            # Read document.xml.rels
            rels_name = "word/_rels/document.xml.rels"
            if rels_name in namelist:
                rels_content = z.read(rels_name).decode('utf-8')
                print("\nRelationships XML image tags:")
                matches = re.findall(r'<Relationship[^>]+>', rels_content)
                for m in matches:
                    if "image" in m.lower():
                        print("  ", m)
            
            # Check document.xml
            doc_name = "word/document.xml"
            if doc_name in namelist:
                doc_content = z.read(doc_name).decode('utf-8')
                
                # Check for "client_logo" in the XML
                logo_text_matches = re.findall(r"client_logo", doc_content)
                print(f"\nOccurrences of 'client_logo' in document.xml: {len(logo_text_matches)}")
                
                drawings = re.findall(r"<[^>:]*:drawing[^>]*>", doc_content)
                print(f"Found {len(drawings)} drawing tags in document.xml.")
                
    except Exception as e:
        print("Error inspecting:", e)

inspect_docx_internals("output_rev1_corrupt.docx")
inspect_docx_internals("output_rev1_fixed.docx")
