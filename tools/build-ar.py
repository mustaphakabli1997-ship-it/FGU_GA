#!/usr/bin/env python3
"""Builds the Arabic-default variant of the Maison D'Arabie "Ivoire" theme from the source theme.

Run from anywhere:  python3 tools/build-ar.py

 - Arabic becomes the default language (locales/ar.default.json), French stays available (locales/fr.json)
 - every default text a customer sees (home page, product tabs, announcement bar, footer, settings)
   and the default texts of newly added sections are Arabic
 - editor labels / section names stay French (the Shopify admin of this merchant is in French)

Any design change is made in maison-darabie-ivoire-shopify-theme/ and this script is run again.
"""
import glob
import json
import os
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = str(ROOT / 'maison-darabie-ivoire-shopify-theme')
DST = str(ROOT / 'maison-darabie-ivoire-ar-shopify-theme')
README = str(ROOT / 'tools' / 'README.ar.md')

EXACT = {
    'Livraison & paiement': 'التوصيل والدفع',
    'Authenticité': 'الأصالة',
    '100 % Original': 'أصلي 100%',
    'Paiement à la livraison': 'الدفع عند الاستلام',
    '58 wilayas': '58 ولاية',
    "100 % Original · Parfums d'exception": 'أصلية 100% · عطور استثنائية',
    "L'art du parfum": 'فنّ العطر',
    "d'Arabie": 'العربي الأصيل',
    'Découvrir la collection': 'اكتشف التشكيلة',
    'Nos univers': 'عوالمنا',
    'Nouvelle collection': 'تشكيلة جديدة',
    '100% ORIGINAL • PARFUMS ORIGINAUX •': '100% أصلي • عطور أصلية •',
    'Des parfums authentiques, sélectionnés avec soin.': 'عطور أصلية، مختارة بعناية.',
    'Livraison partout': 'توصيل لكل مكان',
    'Dans les 58 wilayas, à domicile ou en point relais.': 'إلى 58 ولاية، حتى باب بيتك أو نقطة الاستلام.',
    'Vous réglez uniquement à la réception de votre commande.': 'لا تدفع إلا عند استلام طلبك.',
    'Emballage cadeau': 'تغليف الهدايا',
    'Un écrin élégant pour chaque occasion.': 'علبة أنيقة لكل مناسبة.',
    'Univers': 'العوالم',
    'Choisissez votre signature': 'اختر بصمتك العطرية',
    'Nouveautés': 'وصل حديثًا',
    'Nos dernières fragrances': 'أحدث عطورنا',
    'Parfum signature': 'العطر المميّز',
    'Découvrir ce parfum': 'اكتشف هذا العطر',
    'Parfums originaux': 'عطور أصلية',
    'Wilayas livrées': 'ولاية نوصل إليها',
    'La Maison': 'الدار',
    "Un parfum n'est pas un détail,": 'العطر ليس تفصيلًا،',
    "c'est une signature.": 'إنه توقيعك.',
    'Offrir': 'الهدايا',
    'Coffrets & emballage cadeau': 'علب هدايا وتغليف فاخر',
    'Voir la collection': 'شاهد التشكيلة',
    'Les parfums sont-ils originaux ?': 'هل العطور أصلية؟',
    'Comment passer commande ?': 'كيف أطلب؟',
    'Livrez-vous dans ma wilaya ?': 'هل يصل التوصيل إلى ولايتي؟',
    'Comment puis-je payer ?': 'كيف أدفع؟',
    'Aide': 'مساعدة',
    'Questions fréquentes': 'الأسئلة الشائعة',
    'La Maison vous écrit': 'الدار تكتب إليك',
    'Parfums 100 % originaux': 'عطور أصلية 100%',
    'Livraison dans les 58 wilayas': 'التوصيل إلى 58 ولاية',
    '100% Original': '100% أصلي',
    'Sélection': 'مختارات',
    'Nos marques': 'ماركاتنا',
    'Ma marque': 'ماركتي',
    'Parfums & coffrets': 'عطور وعلب هدايا',
    'Marque 1': 'ماركة 1',
    'Marque 2': 'ماركة 2',
    'Marque 3': 'ماركة 3',
    'Marque 4': 'ماركة 4',
    'Ils nous ont fait confiance': 'وثقوا بنا',
    "Remplacez ce texte par l'avis réel d'un client.": 'استبدل هذا النص برأي حقيقي من أحد زبائنك.',
    'Prénom N.': 'الاسم ن.',
    'Wilaya': 'الولاية',
    'Avis': 'آراء',
    'Annonces': 'إعلانات',
}

PREFIX = [
    ('<p>Livraison dans les 58 wilayas', '<p>التوصيل إلى 58 ولاية، إلى باب بيتك أو إلى نقطة استلام. الدفع عند الاستلام: لا تدفع إلا حين يصلك طلبك.</p>'),
    ('<p>Tous nos parfums sont 100 % originaux. Pour toute question', '<p>جميع عطورنا أصلية 100%. لأي استفسار عن منتج، راسلنا على واتساب.</p>'),
    ('Oud, ambre, musc et rose', 'عود وعنبر ومسك ووردة: تشكيلة من العطور الأصلية 100%، تصلك إلى 58 ولاية مع الدفع عند الاستلام.'),
    ('Notes de tête, de cœur et de fond', 'نفحات القمة والقلب والقاعدة: اختر العطر الذي يشبهك، أصلي 100% ويصلك حتى باب بيتك.'),
    ("Ajoutez l'emballage cadeau à votre commande", 'أضف تغليف الهدية إلى طلبك واكتب كلمة خاصة: العطر أجمل الرسائل.'),
    ('<p>Oui, tous nos parfums sont 100 % originaux.', '<p>نعم، جميع عطورنا أصلية 100%.</p>'),
    ('<p>Choisissez votre parfum, cliquez sur', '<p>اختر عطرك، واضغط على «اطلب الآن»، ثم أدخل اسمك ورقم هاتفك وعنوانك. نتصل بك لتأكيد الطلب قبل الشحن.</p>'),
    ('<p>Oui, nous livrons dans les 58 wilayas', '<p>نعم، نوصل إلى 58 ولاية. يختلف سعر التوصيل ومدته حسب ولايتك وطريقة الاستلام (المنزل أو نقطة الاستلام).</p>'),
    ('<p>Le paiement se fait à la livraison', '<p>الدفع عند الاستلام نقدًا، حين يصلك طلبك.</p>'),
    ('Inscription facultative', 'اشتراك اختياري: كن أول من يعلم بالعطور الجديدة والعروض الخاصة.'),
    ('Les plus belles signatures de la parfumerie', 'أجمل توقيعات العطور الشرقية والعالمية.'),
]

# strings that stay as they are on purpose (identifiers, brand, numbers shown as figures)
KEEP = {'COD', 'main-404', 'Avis clients', 'Applications', 'En-tête', 'Pied de page', "Barre d'annonces"}

untranslated = {}


def tr(s):
    if s in EXACT:
        return EXACT[s]
    for pre, ar in PREFIX:
        if s.startswith(pre):
            return ar
    return None


def note_unmatched(s, where):
    if s in KEEP:
        return
    if re.search(r'[A-Za-zÀ-ÿ]{4,}', s) and not s.startswith(('/', 'http', '#', 'shopify://')) and not re.fullmatch(r'[a-z0-9_\-:/.]+', s):
        untranslated.setdefault(s, set()).add(where)


def walk(o, where, skip_keys=('type',)):
    if isinstance(o, dict):
        return {k: (v if k in skip_keys else walk(v, where + '.' + k, skip_keys)) for k, v in o.items()}
    if isinstance(o, list):
        return [walk(v, where, skip_keys) for v in o]
    if isinstance(o, str):
        t = tr(o)
        if t is not None:
            return t
        note_unmatched(o, where)
    return o


def dump_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write('\n')


# ------------------------------------------------------------------ copy
if os.path.exists(DST):
    shutil.rmtree(DST)
shutil.copytree(SRC, DST, ignore=shutil.ignore_patterns('.DS_Store', 'README.md'))

# ------------------------------------------------------------------ locales: Arabic first
shutil.move(f'{DST}/locales/fr.default.json', f'{DST}/locales/fr.json')
shutil.move(f'{DST}/locales/ar.json', f'{DST}/locales/ar.default.json')

# ------------------------------------------------------------------ templates, section groups, settings data
for path in sorted(glob.glob(f'{DST}/templates/*.json') + glob.glob(f'{DST}/sections/*.json') + [f'{DST}/config/settings_data.json']):
    with open(path, encoding='utf-8') as f:
        data = json.load(f)
    dump_json(path, walk(data, os.path.basename(path)))

# ------------------------------------------------------------------ schema defaults / presets in sections, defaults in the settings schema
STR = r'"((?:[^"\\]|\\.)*)"'


def sub_default(text, where):
    def repl(m):
        raw = json.loads('"' + m.group(2) + '"')
        t = tr(raw)
        if t is None:
            note_unmatched(raw, where)
            return m.group(0)
        return m.group(1) + json.dumps(t, ensure_ascii=False)
    return re.sub(r'("default"\s*:\s*)' + STR, repl, text)


def sub_preset(text, where):
    def repl(m):
        key = m.group(2)
        if key in ('name', 'type'):
            return m.group(0)
        raw = json.loads('"' + m.group(3) + '"')
        t = tr(raw)
        if t is None:
            note_unmatched(raw, where)
            return m.group(0)
        return m.group(1) + json.dumps(t, ensure_ascii=False)
    return re.sub(r'(("([A-Za-z_]+)"\s*:\s*))' + STR, lambda m: _preset_repl(m, where), text)


def _preset_repl(m, where):
    key = m.group(3)
    if key in ('name', 'type'):
        return m.group(0)
    raw = json.loads('"' + m.group(4) + '"')
    t = tr(raw)
    if t is None:
        note_unmatched(raw, where)
        return m.group(0)
    return m.group(1) + json.dumps(t, ensure_ascii=False)


for path in sorted(glob.glob(f'{DST}/sections/*.liquid')):
    src = open(path, encoding='utf-8').read()
    m = re.search(r'(\{%\s*schema\s*%\})(.*?)(\{%\s*endschema\s*%\})', src, re.S)
    body = m.group(2)
    where = os.path.basename(path)
    cut = body.find('"presets"')
    head, tail = (body, '') if cut < 0 else (body[:cut], body[cut:])
    new_body = sub_default(head, where) + (sub_preset(tail, where) if tail else '')
    json.loads(new_body)  # still valid JSON
    open(path, 'w', encoding='utf-8').write(src[:m.start(2)] + new_body + src[m.end(2):])

path = f'{DST}/config/settings_schema.json'
text = open(path, encoding='utf-8').read()
text = sub_default(text, 'settings_schema.json')
text = re.sub(r'("theme_name"\s*:\s*)"[^"]*"', lambda m: m.group(1) + '"Maison D\'Arabie Ivoire AR"', text)
json.loads(text)
open(path, 'w', encoding='utf-8').write(text)

# ------------------------------------------------------------------ README
if os.path.exists(README):
    shutil.copy(README, f'{DST}/README.md')

print('built', DST)
if untranslated:
    print('\nNOT TRANSLATED (check that these are meant to stay):')
    for s, w in sorted(untranslated.items()):
        print(' -', repr(s)[:110], '|', sorted(w)[:2])
