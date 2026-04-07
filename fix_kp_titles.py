import json
import os
import re

title_fixes = {
    'kc0222': '顺序表上基本操作的实现',
    'kc0233': '有序顺序表合并算法',
    'kc0323': '队列的链式存储结构',
    'kc0324': '双端队列',
    'kc0333': '栈在递归中的应用',
    'kc0625': '图的基本操作',
    'kc0643': '有向无环图描述表达式',
    'kc0732': '折半查找判定树',
    'kc0821': '插入排序',
    'kc0842': '堆排序',
    'kc0862': '外部排序',
}

kp_file = 'data/ds_data/knowledgepoints/all_knowledgepoints.json'
with open(kp_file, 'r', encoding='utf-8') as f:
    kps = json.load(f)

fixed = 0
for kp in kps:
    kid = kp['id']
    if kid in title_fixes:
        old_title = kp['title']
        new_title = title_fixes[kid]
        if old_title != new_title:
            kp['title'] = new_title
            fixed += 1
            print(f'Fixed {kid}: {repr(old_title)} -> {new_title}')

with open(kp_file, 'w', encoding='utf-8') as f:
    json.dump(kps, f, ensure_ascii=False, indent=4)

print(f'\nFixed {fixed} knowledge point titles in all_knowledgepoints.json')

chapters_dir = 'data/ds_data/knowledgepoints'
for ch in range(1, 9):
    ch_file = os.path.join(chapters_dir, f'chapter_{ch}.json')
    if not os.path.exists(ch_file):
        continue
    with open(ch_file, 'r', encoding='utf-8') as f:
        ch_kps = json.load(f)
    ch_fixed = 0
    for kp in ch_kps:
        kid = kp['id']
        if kid in title_fixes:
            old_title = kp['title']
            new_title = title_fixes[kid]
            if old_title != new_title:
                kp['title'] = new_title
                ch_fixed += 1
    if ch_fixed > 0:
        with open(ch_file, 'w', encoding='utf-8') as f:
            json.dump(ch_kps, f, ensure_ascii=False, indent=4)
        print(f'Fixed {ch_fixed} in chapter_{ch}.json')

print('\nDone!')
