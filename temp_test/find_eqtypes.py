import sys
sys.stdout.reconfigure(encoding='utf-8')

lines = open('js/propostaTecnica.js', encoding='utf-8').readlines()

# Find equipment type labels
keywords = ['equipTypes', 'QGBT', 'CCM-BT', 'ELETROCENTRO', 'typeLabel', 'type_label',
            'getEquipType', 'equipLabel', 'eq.type', 'equipment_type']
results = []
for i, l in enumerate(lines):
    if any(x in l for x in keywords):
        results.append(f'{i+1}: {l.rstrip()}')

for r in results[:40]:
    print(r)
