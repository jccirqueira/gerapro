import sys
sys.stdout.reconfigure(encoding='utf-8')

lines = open('js/propostaComercial.js', encoding='utf-8').readlines()
print(f'Total lines: {len(lines)}')

# Find key structural elements
keywords = ['renderModal', 'activeTab', 'switchTab', 'tab-btn', 'Dados Gerais',
            'Condi', 'Assinatura', 'Escopo', 'renderTab', 'return `']
for i, l in enumerate(lines):
    if any(x in l for x in keywords):
        print(f'{i+1}: {l.rstrip()}')
