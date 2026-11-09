#!/usr/bin/env python3
"""
Tutor-For-All website languages.

The English pages in the repo root are the source. This tool:
  extract  writes i18n/en.json: every piece of visible text, keyed by a short hash.
  build    fills i18n/<lang>.json into /<lang>/<page>/index.html, adds the language
           menu and hreflang links to every page (English too), and writes sitemap.xml.

Change English text, run `extract`, translate the new keys into i18n/<lang>.json, run `build`.
A key with no translation falls back to English, so a page never breaks.

Form values (the value="..." on options, radios and checkboxes) are never translated:
the Apps Script backend reads them in English.

Needs: pip install beautifulsoup4
"""
import copy
import hashlib
import json
import os
import re
import sys
from bs4 import BeautifulSoup, Comment, NavigableString, Tag

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SITE = 'https://tutorforall.org/'
TODAY = '2026-11-08'

LANGS = {
    'es': {'name': 'Español', 'og': 'es_ES'},
    'fr': {'name': 'Français', 'og': 'fr_FR'},
    'pt': {'name': 'Português', 'og': 'pt_BR'},
    'ar': {'name': 'العربية', 'og': 'ar_AR', 'dir': 'rtl',
           'fonts': 'family=Noto+Naskh+Arabic:wght@400..700&family=Noto+Sans+Arabic:wght@400..700',
           'serif': '"Noto Naskh Arabic", serif', 'sans': '"Noto Sans Arabic", sans-serif'},
    'hi': {'name': 'हिन्दी', 'og': 'hi_IN',
           'fonts': 'family=Noto+Sans+Devanagari:wght@400..700&family=Noto+Serif+Devanagari:wght@400..700',
           'serif': '"Noto Serif Devanagari", serif', 'sans': '"Noto Sans Devanagari", sans-serif'},
    'id': {'name': 'Bahasa Indonesia', 'og': 'id_ID'},
    'vi': {'name': 'Tiếng Việt', 'og': 'vi_VN',
           'fonts': 'family=Be+Vietnam+Pro:wght@400;500;600;700',
           'sans': '"Be Vietnam Pro", sans-serif'},
    'sw': {'name': 'Kiswahili', 'og': 'sw_KE'},
}

# Pages that exist in every language. noindex pages stay out of the sitemap and hreflang.
PAGES = ['', 'requesttutoring/', 'becomeatutor/', 'about/', 'faq/', 'donate/', 'volunteerlog/', 'safety/', 'privacy/',
         'free-online-tutoring/', 'free-reading-tutor/', 'free-math-tutor/', 'volunteer-hours-online/', 'onboarding/', 'families/']
NOINDEX = {'onboarding/'}
PRIORITY = {'': '1.0', 'requesttutoring/': '0.9', 'becomeatutor/': '0.9', 'free-online-tutoring/': '0.8', 'volunteer-hours-online/': '0.8',
            'faq/': '0.7', 'about/': '0.7', 'donate/': '0.6', 'free-reading-tutor/': '0.7', 'free-math-tutor/': '0.7',
            'safety/': '0.6', 'privacy/': '0.3', 'volunteerlog/': '0.4', 'families/': '0.7'}

# Extra text that only translated pages show.
UI = {
    'note': 'This page was translated by computer. If anything is unclear, the English page is the official one.',
    'noteLink': 'Read it in English',
    'language': 'Language',
}

INLINE = {'a', 'strong', 'em', 'b', 'i', 'span', 'br', 'abbr', 'cite', 'small', 'u', 'sup', 'sub', 'code', 'time'}
SKIP = {'script', 'style', 'svg', 'noscript', 'datalist', 'iframe'}
ATTRS = ['placeholder', 'title', 'aria-label', 'alt', 'label']
LD_KEYS = {'description', 'slogan', 'title', 'name', 'serviceType', 'industry'}
LD_KEEP = {'Tutor-For-All', 'TutorForAll', 'Home'}

LINK_RE = re.compile(r'^/(' + '|'.join(p.rstrip('/') for p in PAGES if p) + r')/(#.*)?$')
HAS_WORD = re.compile(r'[^\W\d_]{2,}', re.UNICODE)


def key_of(text):
    return hashlib.sha1(text.encode('utf8')).hexdigest()[:10]


def worth(text):
    t = text.strip()
    if not t or not HAS_WORD.search(t):
        return False
    if re.fullmatch(r'[\w.+-]+@[\w.-]+', t) or t.startswith('http') or t in ('Tutor-For-All', 'K–5'):
        return False
    if TIME_RE.match(t):
        return False
    return True


def squash(s):
    return re.sub(r'\s+', ' ', s).strip()


def is_inline_unit(el):
    """True when everything inside el is text or inline tags, so it can be translated as one sentence."""
    for c in el.descendants:
        if isinstance(c, Tag) and (c.name not in INLINE or c.has_attr('data-no-i18n')):
            return False
    return True


def to_unit(el):
    """<p>Hi <a href="/x">there</a></p> -> ("Hi <1>there</1>", {1: <a> tag copy})."""
    tags = {}
    counter = [0]

    def ser(node):
        out = ''
        for c in node.children:
            if isinstance(c, Comment):
                continue
            if isinstance(c, NavigableString):
                out += str(c)
            elif c.name == 'br':
                out += '<br/>'
            else:
                counter[0] += 1
                n = counter[0]
                tags[n] = c
                out += '<%d>%s</%d>' % (n, ser(c), n)
        return out

    return squash(ser(el)), tags


def open_tag(tag):
    bare = copy.copy(tag)
    bare.clear()
    s = str(bare)
    return s[:s.rindex('</')]


def from_unit(text, tags, lang):
    def op(m):
        t = tags.get(int(m.group(1)))
        return open_tag(t) if t else ''

    def cl(m):
        t = tags.get(int(m.group(1)))
        return '</%s>' % t.name if t else ''

    html = re.sub(r'<(\d+)>', op, text)
    html = re.sub(r'</(\d+)>', cl, html)
    return html.replace('<br/>', '<br>')


class Walker:
    """Calls fn(text) -> translation for every unit in a page, replacing it in place when lang is set."""

    def __init__(self, soup, fn, lang=None):
        self.soup, self.fn, self.lang = soup, fn, lang

    def unit(self, el):
        text, tags = to_unit(el)
        if not worth(re.sub(r'</?\d+>|<br/>', ' ', text)):
            return
        new = self.fn(text)
        if self.lang and new != text:
            el.clear()
            el.append(BeautifulSoup(from_unit(new, tags, self.lang), 'html.parser'))

    def text_node(self, node):
        text = squash(str(node))
        if not worth(text):
            return
        new = self.fn(text)
        if self.lang and new != text:
            lead = ' ' if str(node)[:1].isspace() else ''
            tail = ' ' if str(node)[-1:].isspace() else ''
            node.replace_with(NavigableString(lead + new + tail))

    def attrs(self, el):
        for a in ATTRS:
            v = el.get(a)
            if v and worth(v) and not (a == 'title' and el.name == 'iframe'):
                new = self.fn(squash(v))
                if self.lang:
                    el[a] = new

    def walk(self, el):
        for c in list(el.children):
            if isinstance(c, Comment):
                continue
            if isinstance(c, NavigableString):
                if c.parent.name not in SKIP and str(c).strip():
                    self.text_node(c)
                continue
            if c.name in SKIP or c.has_attr('data-no-i18n'):
                continue
            self.attrs(c)
            if c.name == 'option' and c.parent.get('name') == 'country' and c.get('value') not in ('', 'Other'):
                continue     # world.js replaces the country list with every country, named in the page's language
            if is_inline_unit(c):
                if c.get_text(strip=True):
                    self.unit(c)
                continue
            self.walk(c)


def ld_walk(obj, fn, translate):
    """Translates the human text in a JSON-LD block. Returns the new object."""
    if isinstance(obj, list):
        return [ld_walk(x, fn, translate) for x in obj]
    if isinstance(obj, dict):
        kind = obj.get('@type')
        out = {}
        for k, v in obj.items():
            if k in LD_KEYS and isinstance(v, str) and v not in LD_KEEP and kind not in ('Country', 'Place', 'Organization', 'NGO', 'WebSite') or (
                    k in ('description', 'slogan') and isinstance(v, str)):
                out[k] = fn(v) if translate else (fn(v) and v)
            elif k in ('applicantLocationRequirements', 'areaServed', 'sameAs', 'url', 'logo', 'item', 'inLanguage'):
                out[k] = v
            else:
                out[k] = ld_walk(v, fn, translate)
        return out
    return obj


def read(page):
    path = os.path.join(ROOT, page, 'index.html')
    with open(path, encoding='utf8') as f:
        return f.read()


def walk_page(soup, fn, lang=None):
    """Visits everything translatable on a parsed page."""
    head = soup.head
    t = head.find('title')
    if t:
        new = fn(squash(t.get_text()))
        if lang:
            t.string = new
    for m in head.find_all('meta'):
        n = m.get('name') or m.get('property')
        if n in ('description', 'og:title', 'og:description') and m.get('content'):
            new = fn(squash(m['content']))
            if lang:
                m['content'] = new
    Walker(soup, fn, lang).walk(soup.body)
    s = soup.find('script', id='tfa-strings')
    if s:
        data = json.loads(s.string)
        for k in data:
            data[k] = fn(data[k])
        if lang:
            s.string = json.dumps(data, ensure_ascii=False, indent=2)
    for s in head.find_all('script', type='application/ld+json'):
        data = json.loads(s.string)
        if data.get('@type') == 'FAQPage':
            continue
        new = ld_walk(data, fn, True)
        if lang:
            s.string = json.dumps(new, ensure_ascii=False)


def faq_ld(soup):
    """FAQPage data built from the page itself, so it always matches what people see."""
    items = []
    for d in soup.select('.faq-groups details'):
        q = d.find('summary').get_text(' ', strip=True)
        a = squash(d.find('div', class_='answer').get_text(' ', strip=True))
        items.append({'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': a}})
    return {'@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': items}


TIME_RE = re.compile(r'^(\d{1,2})(?::\d\d)?\s*(am|pm)?\s*[–-]\s*(\d{1,2})(?::\d\d)?\s*(am|pm)$', re.I)


def clock24(s):
    """'11am–12pm' -> '11:00–12:00'. Most of the world reads a 24-hour clock."""
    m = TIME_RE.match(s.strip())
    if not m:
        return None
    h1, ap1, h2, ap2 = int(m.group(1)), (m.group(2) or '').lower(), int(m.group(3)), m.group(4).lower()
    def h24(h, ap):
        h = h % 12
        return h + 12 if ap == 'pm' else h
    if not ap1:
        ap1 = 'am' if (ap2 == 'pm' and h2 == 12 and h1 == 11) else ap2
        if ap2 == 'pm' and h1 == 12:
            ap1 = 'pm'
    return '%02d:00–%02d:00' % (h24(h1, ap1), h24(h2, ap2))


def lang_url(page, lang):
    return SITE + (lang + '/' if lang != 'en' else '') + page


def lang_href(page, lang):
    return '/' + (lang + '/' if lang != 'en' else '') + page


def hreflang(page):
    if page in NOINDEX:
        return ''
    links = ['<link rel="alternate" hreflang="en" href="%s">' % lang_url(page, 'en')]
    links += ['<link rel="alternate" hreflang="%s" href="%s">' % (l, lang_url(page, l)) for l in LANGS]
    links.append('<link rel="alternate" hreflang="x-default" href="%s">' % lang_url(page, 'en'))
    return '\n    '.join(links)


GLOBE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9.2"/><path d="M2.8 12h18.4M12 2.8c2.6 2.6 3.9 5.6 3.9 9.2s-1.3 6.6-3.9 9.2c-2.6-2.6-3.9-5.6-3.9-9.2s1.3-6.6 3.9-9.2z"/></svg>'


def switcher(page, lang, label):
    names = {'en': 'English'}
    names.update({k: v['name'] for k, v in LANGS.items()})
    rows = ''.join('<li><a href="%s" lang="%s" hreflang="%s"%s>%s</a></li>' % (
        lang_href(page, l), l, l, ' aria-current="true"' if l == lang else '', n) for l, n in names.items())
    return '<details class="lang-menu"><summary aria-label="%s">%s<span>%s</span></summary><ul>%s</ul></details>' % (label, GLOBE, names[lang], rows)


def footer_langs(page, lang):
    names = {'en': 'English'}
    names.update({k: v['name'] for k, v in LANGS.items()})
    return '<nav class="footer-langs" aria-label="Languages">' + ''.join(
        '<a href="%s" lang="%s" hreflang="%s">%s</a>' % (lang_href(page, l), l, l, n) for l, n in names.items()) + '</nav>'


def fill_markers(html, page, lang, label):
    head = hreflang(page)
    html = re.sub(r'<!--i18n:head-->.*?<!--/i18n:head-->', lambda m: '<!--i18n:head-->' + (('\n    ' + head + '\n    ') if head else '') + '<!--/i18n:head-->', html, flags=re.S)
    html = re.sub(r'<!--i18n:switch-->.*?<!--/i18n:switch-->', lambda m: '<!--i18n:switch-->' + switcher(page, lang, label) + '<!--/i18n:switch-->', html, flags=re.S)
    html = re.sub(r'<!--i18n:footer-->.*?<!--/i18n:footer-->', lambda m: '<!--i18n:footer-->' + footer_langs(page, lang) + '<!--/i18n:footer-->', html, flags=re.S)
    return html


def extract():
    found = {}
    pages_of = {}

    def fn(text):
        k = key_of(text)
        found[k] = text
        return text

    def visit(page):
        current[0] = page
        soup = BeautifulSoup(read(page), 'html.parser')

        def rec(text):
            k = key_of(text)
            found[k] = text
            pages_of.setdefault(k, set()).add(page or 'home')
            return text

        walk_page(soup, rec)

    current = [None]
    for page in PAGES:
        visit(page)
    for k, v in UI.items():
        kk = key_of(v)
        found[kk] = v
        pages_of.setdefault(kk, set()).add('all')
    out = {k: {'en': found[k], 'pages': sorted(pages_of[k])} for k in sorted(found)}
    with open(os.path.join(ROOT, 'i18n', 'en.json'), 'w', encoding='utf8') as f:
        json.dump(out, f, ensure_ascii=False, indent=0)
    chars = sum(len(v) for v in found.values())
    print('%d strings, %d characters' % (len(found), chars))


def translator(lang):
    path = os.path.join(ROOT, 'i18n', lang + '.json')
    table = {}
    if os.path.exists(path):
        with open(path, encoding='utf8') as f:
            table = json.load(f)
    missing = set()

    def fn(text):
        k = key_of(text)
        t = table.get(k)
        if not t:
            missing.add(text)
            return text
        # Every numbered tag must survive translation, or the English is safer than broken markup.
        src = sorted(re.findall(r'</?\d+>', text))
        if sorted(re.findall(r'</?\d+>', t)) != src:
            missing.add(text)
            return text
        return t

    return fn, missing


def build_lang(page, lang, fn):
    soup = BeautifulSoup(read(page), 'html.parser')
    info = LANGS[lang]
    html_el = soup.html
    html_el['lang'] = lang
    html_el['dir'] = info.get('dir', 'ltr')

    # 24-hour clock on the availability grids
    for td in soup.select('.avail-time-lbl, .avail-grid tbody tr td:first-child'):
        t = td.get_text(strip=True)
        v = clock24(t)
        if v:
            td.string = v
            td['data-no-i18n'] = ''

    walk_page(soup, fn, lang)

    # links
    for a in soup.find_all('a', href=True):
        h = a['href']
        if h == '/':
            a['href'] = '/%s/' % lang
        elif LINK_RE.match(h):
            a['href'] = '/' + lang + h
    # head
    canon = soup.head.find('link', rel='canonical')
    if canon:
        canon['href'] = lang_url(page, lang)
    og = soup.head.find('meta', property='og:url')
    if og:
        og['content'] = lang_url(page, lang)
    loc = soup.new_tag('meta', property='og:locale', content=info['og'])
    soup.head.find('meta', attrs={'name': 'theme-color'}).insert_before(loc)
    # fonts and the machine-translation note
    style = ''
    if info.get('fonts'):
        link = soup.new_tag('link', rel='stylesheet', href='https://fonts.googleapis.com/css2?%s&display=swap' % info['fonts'])
        soup.head.append(link)
    if info.get('serif') or info.get('sans'):
        style = ':root{' + ''.join('--%s:%s;' % (k, info[k]) for k in ('serif', 'sans') if info.get(k)) + '}'
        st = soup.new_tag('style')
        st.string = style
        soup.head.append(st)
    note = BeautifulSoup('<div class="machine-note">%s <a href="%s" lang="en">%s</a></div>' % (
        fn(UI['note']), lang_href(page, 'en'), fn(UI['noteLink'])), 'html.parser')
    skip = soup.find('a', class_='skip-link')
    skip.insert_after(note)
    if page == 'faq/':
        s = [x for x in soup.head.find_all('script', type='application/ld+json') if '"FAQPage"' in (x.string or '')]
        if s:
            s[0].string = json.dumps(faq_ld(soup), ensure_ascii=False)
    html = str(soup)
    html = fill_markers(html, page, lang, fn(UI['language']))
    out = os.path.join(ROOT, lang, page)
    os.makedirs(out, exist_ok=True)
    with open(os.path.join(out, 'index.html'), 'w', encoding='utf8') as f:
        f.write(html)


def build_english():
    for page in PAGES + ['404']:
        path = os.path.join(ROOT, '404.html') if page == '404' else os.path.join(ROOT, page, 'index.html')
        with open(path, encoding='utf8') as f:
            html = f.read()
        p = '' if page == '404' else page
        if page == '404':
            html = re.sub(r'<!--i18n:head-->.*?<!--/i18n:head-->', '', html, flags=re.S)
            html = re.sub(r'<!--i18n:switch-->.*?<!--/i18n:switch-->', lambda m: '<!--i18n:switch-->' + switcher('', 'en', 'Language') + '<!--/i18n:switch-->', html, flags=re.S)
            html = re.sub(r'<!--i18n:footer-->.*?<!--/i18n:footer-->', lambda m: '<!--i18n:footer-->' + footer_langs('', 'en') + '<!--/i18n:footer-->', html, flags=re.S)
        else:
            html = fill_markers(html, p, 'en', 'Language')
        if page == 'faq/':
            soup = BeautifulSoup(html, 'html.parser')
            data = json.dumps(faq_ld(soup), ensure_ascii=False, indent=1)
            html = re.sub(r'(<script type="application/ld\+json">\s*)\{\s*"@context": "https://schema.org",\s*"@type": "FAQPage".*?\}\s*(</script>)',
                          lambda m: m.group(1) + data + '\n    ' + m.group(2), html, count=1, flags=re.S)
        with open(path, 'w', encoding='utf8') as f:
            f.write(html)


def sitemap():
    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">']
    codes = ['en'] + list(LANGS)
    for page in PAGES:
        if page in NOINDEX:
            continue
        alts = ''.join('\n    <xhtml:link rel="alternate" hreflang="%s" href="%s"/>' % (l, lang_url(page, l)) for l in codes)
        alts += '\n    <xhtml:link rel="alternate" hreflang="x-default" href="%s"/>' % lang_url(page, 'en')
        for l in codes:
            lines.append('  <url>\n    <loc>%s</loc>\n    <lastmod>%s</lastmod>%s\n    <priority>%s</priority>\n  </url>' % (
                lang_url(page, l), TODAY, alts, PRIORITY.get(page, '0.5')))
    lines.append('</urlset>\n')
    with open(os.path.join(ROOT, 'sitemap.xml'), 'w', encoding='utf8') as f:
        f.write('\n'.join(lines))


def build():
    build_english()
    for lang in LANGS:
        fn, missing = translator(lang)
        for page in PAGES:
            build_lang(page, lang, fn)
        print(lang, 'missing', len(missing))
        if missing and '-v' in sys.argv:
            for m in sorted(missing)[:40]:
                print('   ', m[:100])
    sitemap()


if __name__ == '__main__':
    {'extract': extract, 'build': build}[sys.argv[1] if len(sys.argv) > 1 else 'build']()
