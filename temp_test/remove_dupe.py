import sys
sys.stdout.reconfigure(encoding='utf-8')

lines = open('js/propostaComercial.js', encoding='utf-8').readlines()
print(f'Before: {len(lines)} lines')

# Remove lines 486 to 823 (0-indexed: 485 to 822) — the duplicate old renderModal block
# Line 486 (0-idx 485): '    updateContactDropdown(clientName...' (injected by mistake)
# through
# Line 823 (0-idx 822): '    },'  (closing of the old renderModal)
# Line 824 (0-idx 823): actual updateContactDropdown start

# Keep everything up to line 485 (1-indexed 485 = 0-indexed 484)
# Skip lines 485 to 822 (0-indexed)
# Keep from line 823 onwards (0-indexed)

keep = lines[:485] + lines[823:]
print(f'After: {len(keep)} lines')

# Verify the junction looks right
print('Last of kept-before block:')
for l in keep[482:487]:
    print(f'  {repr(l.rstrip())}')
print('First of real updateContactDropdown:')
for l in keep[485:490]:
    print(f'  {repr(l.rstrip())}')

open('js/propostaComercial.js', 'w', encoding='utf-8').writelines(keep)
print('Done!')
