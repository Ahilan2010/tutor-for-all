#!/usr/bin/env python3
"""python3 tools/i18n/check.py es   Checks i18n/es.json against i18n/en.json."""
import json, os, re, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
lang = sys.argv[1]
en = json.load(open(os.path.join(ROOT, 'i18n', 'en.json'), encoding='utf8'))
tr = json.load(open(os.path.join(ROOT, 'i18n', lang + '.json'), encoding='utf8'))
missing = [k for k in en if not str(tr.get(k, '')).strip()]
extra = [k for k in tr if k not in en]
tags = [k for k in en if k in tr and sorted(re.findall(r'</?\d+>|<br/>', en[k]['en'])) != sorted(re.findall(r'</?\d+>|<br/>', tr[k]))]
same = [k for k in en if tr.get(k) == en[k]['en'] and len(en[k]['en']) > 25 and re.search('[a-z]{4} [a-z]{3}', en[k]['en'])]
dash = [k for k in tr if '—' in tr[k] and '—' not in en.get(k, {}).get('en', '')]
print(lang, 'keys', len(tr), 'of', len(en), '| missing', len(missing), '| extra', len(extra), '| tag problems', len(tags), '| still English', len(same), '| new em dashes', len(dash))
for k in (missing + tags + same)[:12]:
    print('  ', k, en[k]['en'][:90])
