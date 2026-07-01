import zipfile
import re

def inspect_docx(path):
    print("=" * 60)
    print(f"INSPECTING: {path}")
    try:
        with zipfile.ZipFile(path, 'r') as z:
            doc_xml = z.read("word/document.xml").decode("utf-8")
            print("Successfully read word/document.xml")
            
            # Find elements containing curlies
            # Let's look for tags that start with { and end with } in the XML text
            # A common way to check for split placeholders is to search for raw curly braces
            braces = re.findall(r"\{[^{}]*\}", doc_xml)
            split_braces = [b for b in braces if "<" in b or ">" in b]
            
            print(f"Total placeholders found: {len(braces)}")
            print(f"Split/corrupted placeholders: {len(split_braces)}")
            
            if split_braces:
                print("Examples of split placeholders:")
                for b in split_braces[:10]:
                    print("  ", repr(b))
            else:
                print("No split placeholders detected in XML text!")
                
    except Exception as e:
        print("Error:", e)

inspect_docx(r"c:\Users\jose.cirqueira.DRIVETECH\Documents\Workspace_A\GeraPro\TEMPLATE_TEC.docx")
inspect_docx(r"c:\Users\jose.cirqueira.DRIVETECH\Documents\Workspace_A\GeraPro\TEMPLATE_TEC_patched.docx")
