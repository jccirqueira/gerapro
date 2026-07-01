path = 'js/propostaTecnica.js'

with open(path, 'r', encoding='utf-8', errors='replace') as f:
    content = f.read()

# The replacement character U+FFFD followed by ? and then continuation bytes
# means the original multi-byte UTF-8 chars were partially corrupted.
# We need to replace the known garbled patterns with the correct strings.

# Strategy: replace known broken sequences by their correct Portuguese text
# Pattern: U+FFFD + '?' + continuation_byte + rest_of_word

import re

# Map of corrupted patterns -> correct text
# The pattern is: \ufffd?\xc2\xa9 -> é, \ufffd?\xc2\xa1 -> á, etc.
# But since these are already in the string, let's do direct string replacements
# of the broken words we can identify from context.

replacements = {
    # Common corrupted patterns found in the file
    'T\ufffd?\xc2\xa9cnica': 'Técnica',
    'T\ufffd\xef\xbf\xbd\xc2\xa9cnica': 'Técnica',
    'c\ufffd?\xc2\xa1lculos': 'cálculos',
    'Revis\ufffd?\xc3\xb5es': 'Revisões',
    'Defini\ufffd?\xc3\xa7\xc3\xa3o': 'Definição',
    'caracter\ufffd?\xc3\xadsticas': 'características',
    'Caracter\ufffd?\xc3\xadsticas': 'Características',
    'Frequ\ufffd?\xc3\xaancia': 'Frequência',
    'execu\ufffd?\xc3\xa7\xc3\xa3o': 'execução',
    'Execu\ufffd?\xc3\xa7\xc3\xa3o': 'Execução',
    'configura\ufffd?\xc3\xa7\xc3\xa3o': 'configuração',
}

# Actually let's use a regex approach to find the corruption pattern
# \ufffd (replacement char) followed by optional ? and then a valid UTF-8 continuation byte
# The corruption produces: [FFFD][3F][C2/C3][xx] where C2/C3 are UTF-8 lead bytes

print(f"Original file size: {len(content)} chars")
print(f"Replacement chars (FFFD) found: {content.count(chr(0xFFFD))}")
print(f"? after FFFD pattern found: {content.count(chr(0xFFFD)+'?')}")

# Show sample of corruption
idx = content.find(chr(0xFFFD))
if idx != -1:
    sample = content[idx-5:idx+15]
    print(f"Sample corruption at {idx}: {repr(sample)}")

# The simplest fix: the content.encode('latin-1', errors='ignore') approach won't work
# because FFFD can't be encoded as latin-1.
# Instead, let's rebuild from a known-good source.

# Check if there's a backup
import os
backups = [f for f in os.listdir('.') if 'propostaTecnica' in f and f.endswith('.bak')]
print(f"\nBackup files: {backups}")

vsbackup = 'js/.propostaTecnica.js.bak'
if os.path.exists(vsbackup):
    print(f"Found VS Code backup: {vsbackup}")
