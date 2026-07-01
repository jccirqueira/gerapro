import sys
sys.stdout.reconfigure(encoding='utf-8')

content = open('js/propostaTecnica.js', encoding='utf-8').read()

mat_marker = content.find('groupName: "MATERIAIS"')
proj_marker = content.find('groupName: "PROJETOS"')

print("PROJETOS group found:", proj_marker != -1)
print("MATERIAIS group found:", mat_marker != -1)

# Count items in each group
def count_items_in_group(content, marker):
    section = content[marker:]
    end = section.find(']')
    return section[:end].count('{ desc:')

print("Items in PROJETOS:", count_items_in_group(content, proj_marker))
print("Items in MATERIAIS:", count_items_in_group(content, mat_marker))
print("Total groupName occurrences:", content.count('groupName:'))
print("Total lines:", content.count('\n'))
