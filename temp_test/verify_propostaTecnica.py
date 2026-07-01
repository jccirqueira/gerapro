content = open('js/propostaTecnica.js', encoding='utf-8').read()
lines = content.split('\n')
print('Total lines:', len(lines))

checks = [
    ('cliente field in flat.push', 'cliente: item.na'),
    ('Object.keys forEach block', 'Object.keys(eqData).forEach'),
    ('syncCargas fix', '}));'),
    ('doc.render()', 'doc.render()'),
    ('PropostaTecnicaModule.init()', 'PropostaTecnicaModule.init()'),
    ('export statement', 'export { PropostaTecnicaModule }'),
    ('addEletrocentroGroup', 'addEletrocentroGroup()'),
    ('removeEletrocentroGroup', 'removeEletrocentroGroup(gi)'),
    ('migrateEletrocentroScope', 'function migrateEletrocentroScope'),
]
for label, token in checks:
    count = content.count(token)
    print(f'[{"OK" if count > 0 else "MISSING"}] {label} ({count}x)')
