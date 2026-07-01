import sys
sys.stdout.reconfigure(encoding='utf-8')

path = 'js/propostaTecnica.js'
lines = open(path, encoding='utf-8').readlines()
print(f'Total lines: {len(lines)}')

# Find where the file duplicates - look for 'PropostaTecnicaModule.init()' 
# and 'export { PropostaTecnicaModule }' occurrences
init_lines = [i+1 for i, l in enumerate(lines) if 'PropostaTecnicaModule.init()' in l]
export_lines = [i+1 for i, l in enumerate(lines) if 'export { PropostaTecnicaModule }' in l]
print(f'PropostaTecnicaModule.init() at lines: {init_lines}')
print(f'export statement at lines: {export_lines}')

# The file should end after the FIRST export statement
# Cut at first export line
if len(export_lines) > 1:
    cut_at = export_lines[0]  # Keep up to and including this line
    print(f'Cutting file at line {cut_at} (first export statement)')
    lines = lines[:cut_at]
    open(path, 'w', encoding='utf-8').writelines(lines)
    print(f'File truncated to {len(lines)} lines')
else:
    print('No duplication detected')
