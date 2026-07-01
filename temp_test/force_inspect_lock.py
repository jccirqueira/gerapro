import os
import glob

path = "TEMPLATE_TEC.docx"
lock_pattern = "*TEMPLATE_TEC*"
files = glob.glob(lock_pattern)

print("Files in directory matching TEMPLATE_TEC:")
for f in files:
    print(f"  - {f} (size: {os.path.getsize(f)} bytes)")

# Try to rename the file to a temporary name to check if it's locked by another process
try:
    os.rename(path, "TEMPLATE_TEC_test_lock.docx")
    os.rename("TEMPLATE_TEC_test_lock.docx", path)
    print("\nResult: The file is NOT locked! We can successfully read/write/rename it.")
    
    # Let's see if we can delete the lock file
    for f in files:
        if f.startswith("~$"):
            try:
                os.remove(f)
                print(f"Removed lingering lock file: {f}")
            except Exception as e:
                print(f"Could not remove lock file {f}: {e}")
except PermissionError as e:
    print("\nResult: The file is STILL LOCKED by another process!")
    print("Error Details:", e)
