import sys
sys.stdout.reconfigure(encoding='utf-8')

lines = open('js/propostaComercial.js', encoding='utf-8').readlines()
print(f'Total before: {len(lines)}')

# Find the bad section: starts with '    updateContactDropdown' (our injected line)
# then continues with old 'const html = `...' old block
# ending with the REAL updateContactDropdown definition

# Find all occurrences of 'updateContactDropdown'
ucd_lines = [i for i, l in enumerate(lines) if 'updateContactDropdown(clientName' in l]
print(f'updateContactDropdown(clientName at lines: {[i+1 for i in ucd_lines]}')

# Find 'const html' occurrences after line 480
html_lines = [i for i, l in enumerate(lines) if i > 480 and "const html = " in l]
print(f'const html at lines: {[i+1 for i in html_lines]}')

# Find second 'CRITICAL ERROR' 
crit_lines = [i for i, l in enumerate(lines) if 'CRITICAL ERROR IN renderModal' in l]
print(f'CRITICAL ERROR at lines: {[i+1 for i in crit_lines]}')
