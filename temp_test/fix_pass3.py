import sys, re
sys.stdout.reconfigure(encoding='utf-8')

path = 'js/propostaTecnica.js'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

print(f"FFFD before: {content.count(chr(0xFFFD))}")

# Direct word-level fixes for known UI strings
# These replace the exact broken patterns we can see in the screenshot
word_fixes = [
    # PAINÉIS ELÉTRICOS (from screenshot: PAIN?IS EL?TRICOS)
    ('PAIN\ufffd?©IS', 'PAINÉIS'),
    ('PAIN\ufffd?©is', 'PAINÉis'),
    ('EL\ufffd?\ufffd?TRIC', 'ELÉTRIC'),
    ('El\ufffd?\ufffd?tric', 'Elétric'),
    ('el\ufffd?\ufffd?tric', 'elétric'),
    # função, configuração, execução, etc. - ção suffix
    ('fun\ufffd?\xa7\ufffd?\xa3o', 'função'),
    ('Fun\ufffd?\xa7\ufffd?\xa3o', 'Função'),
    ('configura\ufffd?\xa7\ufffd?\xa3o', 'configuração'),
    ('Configura\ufffd?\xa7\ufffd?\xa3o', 'Configuração'),
    ('execu\ufffd?\xa7\ufffd?\xa3o', 'execução'),
    ('Execu\ufffd?\xa7\ufffd?\xa3o', 'Execução'),
    ('defini\ufffd?\xa7\ufffd?\xa3o', 'definição'),
    ('Defini\ufffd?\xa7\ufffd?\xa3o', 'Definição'),
    ('instala\ufffd?\xa7\ufffd?\xa3o', 'instalação'),
    ('Instala\ufffd?\xa7\ufffd?\xa3o', 'Instalação'),
    ('liga\ufffd?\xa7\ufffd?\xa3o', 'ligação'),
    ('Liga\ufffd?\xa7\ufffd?\xa3o', 'Ligação'),
    ('migra\ufffd?\xa7\ufffd?\xa3o', 'migração'),
    ('Migra\ufffd?\xa7\ufffd?\xa3o', 'Migração'),
    ('atualiza\ufffd?\xa7\ufffd?\xa3o', 'atualização'),
    ('opera\ufffd?\xa7\ufffd?\xa3o', 'operação'),
    ('aplica\ufffd?\xa7\ufffd?\xa3o', 'aplicação'),
    ('informa\ufffd?\xa7\ufffd?\xa3o', 'informação'),
    ('integra\ufffd?\xa7\ufffd?\xa3o', 'integração'),
    ('documenta\ufffd?\xa7\ufffd?\xa3o', 'documentação'),
    ('representa\ufffd?\xa7\ufffd?\xa3o', 'representação'),
    ('fixa\ufffd?\xa7\ufffd?\xa3o', 'fixação'),
    ('inser\ufffd?\xa7\ufffd?\xa3o', 'inserção'),
    ('gera\ufffd?\xa7\ufffd?\xa3o', 'geração'),
    ('verifica\ufffd?\xa7\ufffd?\xa3o', 'verificação'),
    ('comunica\ufffd?\xa7\ufffd?\xa3o', 'comunicação'),
    ('prote\ufffd?\xa7\ufffd?\xa3o', 'proteção'),
    ('Prote\ufffd?\xa7\ufffd?\xa3o', 'Proteção'),
    ('PROTE\ufffd?\xa7\ufffd?\xa3O', 'PROTEÇÃO'),
    ('posi\ufffd?\xa7\ufffd?\xa3o', 'posição'),
    ('Posi\ufffd?\xa7\ufffd?\xa3o', 'Posição'),
    ('adi\ufffd?\xa7\ufffd?\xa3o', 'adição'),
    ('tradu\ufffd?\xa7\ufffd?\xa3o', 'tradução'),
    ('descri\ufffd?\xa7\ufffd?\xa3o', 'descrição'),
    ('Descri\ufffd?\xa7\ufffd?\xa3o', 'Descrição'),
    # General cleanup of remaining double-FFFD patterns
    # É in capital: PAINÉIS, ELÉTRICO
    ('\ufffd?â\ufffd?°', 'É'),
    ('\ufffd?â\ufffd?±', 'Á'),
    ('\ufffd?â\ufffd?²', 'Â'),
    ('\ufffd?â\ufffd?³', 'Ã'),
    ('\ufffd?â\ufffd?·', 'Ç'),
    ('\ufffd?â\ufffd?¸', 'È'),
    ('\ufffd?â\ufffd?¹', 'É'),
    ('\ufffd?â\ufffd?\xba', 'Ê'),
    ('\ufffd?â\ufffd?\xbb', 'Ë'),
    ('\ufffd?â\ufffd?\xbc', 'Ì'),
    ('\ufffd?â\ufffd?\xbd', 'Í'),
    ('\ufffd?â\ufffd?\xbe', 'Î'),
    ('\ufffd?â\ufffd?\xbf', 'Ï'),
]

fixed = content
total_replaced = 0
for old, new in word_fixes:
    c = fixed.count(old)
    if c > 0:
        fixed = fixed.replace(old, new)
        total_replaced += c
        print(f"  '{new}' x{c}")

print(f"\nTotal replacements: {total_replaced}")
print(f"FFFD after: {fixed.count(chr(0xFFFD))}")

with open(path, 'w', encoding='utf-8') as f:
    f.write(fixed)
print("Saved!")

# Final comprehensive check
for s in ['Técnica', 'Características', 'ELÉTRICO', 'ELÉTRIC',
          'PAINEL', 'PAINÉIS', 'função', 'Revisões', 'POTÊNCIA',
          'cálculos', 'Frequência', 'Mão de Obra', 'Específicações',
          'Gerenciamento', 'Especificações', 'proteção']:
    found = s in fixed or s.lower() in fixed.lower()
    print(f"  [{'OK' if found else 'CHECK'}] {s}")
