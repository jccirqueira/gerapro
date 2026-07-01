import sys
sys.stdout.reconfigure(encoding='utf-8')

lines = open('js/propostaTecnica.js', encoding='utf-8').readlines()
keywords = ['renderScopeTab', 'renderEscopoTab', 'scopeItems', 'Itens de Escopo',
            'addScopeItem', 'scope-body', 'scope_desc', 'ESCOPO', 'escopo']
results = []
for i, l in enumerate(lines):
    if any(x in l for x in keywords):
        results.append(f'{i+1}: {l.rstrip()}')

for r in results[:60]:
    print(r)
