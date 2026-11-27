
#!/usr/bin/env python3
"""Portwise Trade Intelligence Centre: builds static pages from intel-content.json (stdlib only).
Run from the repository root:  python3 tools/build_intel.py
Creates: intelligence.html, intelligence-<topic>.html, intel-<slug>.html, intel-index.json,
         and refreshes the homepage strip and the sitemap block."""
import json, math, os, re, sys, html
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
C = json.load(open('intel-content.json', encoding='utf-8'))
BASE = C['site']['base']; DISC = C['site']['disclaimer']
CATS = {c['id']: c for c in C['categories']}
ARTS = sorted(C['articles'], key=lambda a: (a['updated'], a['title']), reverse=True)
REPORTS = C.get('reports', [])
e = html.escape

def nice(d): y, m, dd = d.split('-'); return '%d %s %s' % (int(dd), ['January','February','March','April','May','June','July','August','September','October','November','December'][int(m) - 1], y)
def inline(t):
    t = e(t, quote=False)
    t = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', t)
    return re.sub(r'\[([^\]]+)\]\((https?://[^)\s]+|[A-Za-z0-9_\-]+\.html)\)', lambda m: '<a href="%s">%s</a>' % (m.group(2), m.group(1)), t)
def words(a): return sum(len((' '.join(s.get('p', []) + s.get('ul', []))).split()) for s in a['sections'])
def mins(a): return max(1, math.ceil(words(a) / 200))
def aurl(a): return 'intel-%s.html' % a['slug']
def slugid(s): return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')

src = open('privacy.html', encoding='utf-8').read()
HEAD = src[:src.index('</header>') + 9]; FOOT = src[src.index('<footer'):]
HEAD = HEAD.replace(' cur"', '"').replace(' class="on"', '').replace('class="on" ', '').replace(' aria-current="page"', '')
FOOT = re.sub(r'<script src="intel\.js"></script>', '', FOOT)

def current(head, href):
    head = head.replace('<li class="dd"><a href="intelligence.html" data-i18n="tradeTools">', '<li class="dd cur"><a class="on" href="intelligence.html" data-i18n="tradeTools">', 1)
    return head.replace('<a href="%s"' % href, '<a aria-current="page" href="%s"' % href, 1)

def page(fn, title, desc, h1, kicker, sub, body, jsonld, nav_href, scripts=''):
    h = HEAD; url = '%s/%s' % (BASE, fn)
    h = re.sub(r'<title>.*?</title>', '<title>%s | Portwise Ventures</title>' % e(title), h, 1)
    for p in [r'(<meta name="description" content=")[^"]*', r'(<meta property="og:description" content=")[^"]*']: h = re.sub(p, lambda m: m.group(1) + e(desc, quote=True), h, 1)
    h = re.sub(r'(<meta property="og:title" content=")[^"]*', lambda m: m.group(1) + e(title, quote=True) + ' | Portwise Ventures', h, 1)
    h = re.sub(r'(<link rel="canonical" href=")[^"]*', lambda m: m.group(1) + url, h, 1); h = re.sub(r'(<meta property="og:url" content=")[^"]*', lambda m: m.group(1) + url, h, 1)
    ld = ''.join('<script type="application/ld+json">%s</script>' % json.dumps(j, ensure_ascii=False).replace('</', '<\\/') for j in jsonld)
    h = h.replace('</head>', '<link href="intel.css" rel="stylesheet"/>%s</head>' % ld, 1)
    h = current(h, nav_href)
    f = FOOT.replace('</body>', scripts + '</body>', 1) if scripts else FOOT
    open(fn, 'w', encoding='utf-8').write(h + '\n<div class="hero sm"><div class="wrap"><p class="ix-kicker">%s</p><h1>%s</h1><p>%s</p></div></div>\n%s\n' % (kicker, e(h1), e(sub), body) + f)

def crumbs(items):
    out = []; ld = []
    for i, (label, href) in enumerate(items):
        out.append('<a href="%s">%s</a>' % (href, e(label)) if href else '<span aria-current="page">%s</span>' % e(label))
        ld.append({'@type': 'ListItem', 'position': i + 1, 'name': label, 'item': '%s/%s' % (BASE, href) if href else None})
    for d in ld:
        if d['item'] is None: del d['item']
    return '<nav class="crumbs" aria-label="Breadcrumb">%s</nav>' % '<span>›</span>'.join(out), {'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': ld}

def card(a):
    return '<a class="ix-card" href="%s"><span class="ix-chip">%s</span><h3>%s</h3><p>%s</p><small>Updated %s · %d min read</small></a>' % (aurl(a), e(CATS[a['category']]['title']), e(a['title']), e(a['summary']), nice(a['updated']), mins(a))

CTA = ('<aside class="ix-cta"><h2>Need help with a shipment or a sourcing question?</h2><p>Tell us what you are importing or exporting and we will advise.</p>'
       '<p><a class="btn" href="request-a-product.html">Request a Product</a> <a class="btn ix-alt" href="business-desk.html">Request a market briefing</a> <a class="btn ix-alt" href="buyer-registration.html">Register as a Buyer</a></p></aside>')
DISC_HTML = '<p class="ix-disc">%s</p>' % e(DISC)

# ---------- article pages
for a in ARTS:
    cat = CATS[a['category']]; toc = []; secs = []
    for s in a['sections']:
        sid = slugid(s['h']); toc.append('<li><a href="#%s">%s</a></li>' % (sid, e(s['h'])))
        b = ''.join('<p>%s</p>' % inline(p) for p in s.get('p', []))
        if s.get('ul'): b += '<ul>%s</ul>' % ''.join('<li>%s</li>' % inline(x) for x in s['ul'])
        secs.append('<section id="%s"><h2>%s</h2>%s</section>' % (sid, e(s['h']), b))
    rel = [x for x in ARTS if x['slug'] != a['slug'] and (x['category'] == a['category'] or set(x['tags']) & set(a['tags']))][:3]
    cr, crld = crumbs([('Home', 'index.html'), ('Trade Intelligence Centre', 'intelligence.html'), (cat['title'], cat['slug']), (a['title'], None)])
    body = ('<section><div class="wrap ix">%s<article class="ix-article"><p class="ix-meta">Updated %s · %d min read · %s</p>'
            '<div class="ix-take"><h2>Key takeaways</h2><ul>%s</ul></div><nav class="ix-toc" aria-label="On this page"><h2>On this page</h2><ol>%s</ol></nav>%s'
            '<section class="ix-src"><h2>Sources and further reading</h2><ul>%s</ul><p class="ix-note">Links open official or reputable sources. Check publication dates and confirm requirements before you act.</p></section>'
            '<section class="ix-rel"><h2>Related Portwise tools</h2><ul>%s</ul></section>%s%s'
            '%s</article></div></section>') % (
        cr, nice(a['updated']), mins(a), ' · '.join('#' + e(t) for t in a['tags']), ''.join('<li>%s</li>' % e(t) for t in a['takeaways']), ''.join(toc), ''.join(secs),
        ''.join('<li><a href="%s" target="_blank" rel="noopener noreferrer">%s</a></li>' % (e(s['url']), e(s['label'])) for s in a['sources']),
        ''.join('<li><a href="%s">%s</a></li>' % (t['href'], e(t['label'])) for t in a['related_tools']), CTA, DISC_HTML,
        ('<section class="ix-more"><h2>More guides</h2><div class="ix-grid">%s</div></section>' % ''.join(card(x) for x in rel)) if rel else '')
    ld = {'@context': 'https://schema.org', '@type': 'Article', 'headline': a['title'], 'description': a['summary'], 'datePublished': a['published'], 'dateModified': a['updated'], 'inLanguage': 'en',
          'author': {'@type': 'Organization', 'name': 'Portwise Ventures'}, 'publisher': {'@type': 'Organization', 'name': 'Portwise Ventures', 'logo': {'@type': 'ImageObject', 'url': BASE + '/portwise-ventures-logo.jpg'}},
          'mainEntityOfPage': '%s/%s' % (BASE, aurl(a)), 'keywords': ', '.join(a['tags'])}
    page(aurl(a), a['title'], a['summary'], a['title'], 'Trade Intelligence Centre · ' + e(cat['title']), a['summary'], body, [ld, crld], 'intelligence.html')

# ---------- category pages
for c in C['categories']:
    items = [a for a in ARTS if a['category'] == c['id']]; cr, crld = crumbs([('Home', 'index.html'), ('Trade Intelligence Centre', 'intelligence.html'), (c['title'], None)])
    if c['id'] == 'industry-reports':
        lst = ''.join('<a class="ix-card" href="%s"><h3>%s</h3><p>%s</p><small>%s</small></a>' % (e(r['link']), e(r['title']), e(r.get('summary', '')), nice(r['date'])) for r in REPORTS)
        inner = ('<div class="ix-grid">%s</div>' % lst) if REPORTS else ('<div class="ix-empty"><h2>No reports have been published yet</h2><p>Original market reports and country briefings are published here once verified research is available. If you need market information for a product or destination, ask our team for a briefing.</p>'
                 '<p><a class="btn" href="business-desk.html">Request a market briefing</a> <a class="btn ix-alt" href="downloads.html">Corporate Publications</a></p></div>')
    else:
        inner = ('<div class="ix-grid">%s</div>' % ''.join(card(a) for a in items)) if items else '<div class="ix-empty"><h2>Guides in this topic are on the way</h2><p>We publish only content that we can source and check.</p></div>'
    body = '<section><div class="wrap ix">%s<p class="lead">%s</p>%s%s<p><a href="intelligence.html">← Back to the Trade Intelligence Centre</a></p></div></section>' % (cr, e(c['desc']), inner, DISC_HTML)
    ld = {'@context': 'https://schema.org', '@type': 'CollectionPage', 'name': c['title'], 'description': c['desc'], 'url': '%s/%s' % (BASE, c['slug'])}
    nav = {'market-insights': 'intelligence-market-insights.html', 'industry-reports': 'intelligence-industry-reports.html', 'regulations': 'intelligence-regulations.html'}.get(c['id'], 'intelligence.html')
    page(c['slug'], c['title'] + ' | Trade Intelligence Centre', c['desc'], c['title'], 'Trade Intelligence Centre', c['desc'], body, [ld, crld], nav)

# ---------- hub
cr, crld = crumbs([('Home', 'index.html'), ('Trade Intelligence Centre', None)])
topics = ''.join('<a class="ix-topic" href="%s"><h3>%s</h3><p>%s</p><small>%s</small></a>' % (c['slug'], e(c['title']), e(c['desc']),
        ('%d guide%s' % (n, '' if n == 1 else 's')) if (n := len([a for a in ARTS if a['category'] == c['id']])) else ('%d report%s' % (len(REPORTS), '' if len(REPORTS) == 1 else 's') if c['id'] == 'industry-reports' and REPORTS else 'Coming as verified content is ready')) for c in C['categories'])
tools = [('Global Commodity Monitor', 'commodity-monitor.html'), ('Country Import Requirements', 'import-requirements.html'), ('Trade Statistics Explorer', 'trade-statistics.html'), ('Trade Agreement Explorer', 'trade-agreements.html'), ('Global Trade Map', 'trade-map.html'), ('Landed Cost Calculator', 'landed-cost.html'), ('Materials Library', 'materials.html'), ('Newsroom', 'newsroom.html')]
body = ('<section><div class="wrap ix">%s<p class="lead">Practical guides, data sources and tools for buyers and exporters. Every guide lists its sources and the date it was last updated.</p>'
        '<form class="ix-search" role="search" onsubmit="return false"><label for="iq">Search guides</label><input id="iq" type="search" placeholder="Search Incoterms, HS codes, documents, jute…" autocomplete="off"><div id="ir" aria-live="polite"></div></form>'
        '<h2>Explore by topic</h2><div class="ix-topics">%s</div><h2>Latest guides</h2><div class="ix-grid" id="latest">%s</div>'
        '<h2>Data and tools</h2><p class="lead">Live data and calculators that sit alongside the guides.</p><ul class="ix-tools">%s</ul>'
        '<aside class="ix-cta"><h2>How we keep this section trustworthy</h2><p>Portwise publishes guides we can source to official or reputable organisations, shows when each was last updated, and does not publish unverified statistics. Market reports appear only when verified research is available.</p></aside>%s</div></section>') % (
    cr, topics, ''.join(card(a) for a in ARTS[:6]), ''.join('<li><a href="%s">%s</a></li>' % (h, e(t)) for t, h in tools), DISC_HTML)
page('intelligence.html', 'Trade Intelligence Centre', 'Practical guides on Incoterms, HS codes, export documents, market research, commodity prices and sustainable materials, with sources and update dates.', 'Trade Intelligence Centre', 'Portwise Ventures', 'Guides, data and tools for international buyers and exporters.',
     body, [{'@context': 'https://schema.org', '@type': 'CollectionPage', 'name': 'Trade Intelligence Centre', 'url': BASE + '/intelligence.html', 'description': 'Practical trade guides with sources and update dates.'}, crld], 'intelligence.html', '<script src="intel.js"></script>')

# ---------- search index
json.dump([{'title': a['title'], 'summary': a['summary'], 'url': aurl(a), 'category': CATS[a['category']]['title'], 'tags': a['tags'], 'updated': a['updated']} for a in ARTS], open('intel-index.json', 'w', encoding='utf-8'), ensure_ascii=False)

# ---------- homepage strip (between markers)
strip = ('<!--INTEL_HOME_START--><section class="ct" id="intel-home"><div class="wrap"><p class="tt">Trade Intelligence Centre</p><h2>Practical guides for international trade</h2>'
         '<p class="lead">Incoterms, HS codes, export documents, market research and sustainable materials, with sources and update dates.</p><div class="ix-grid">%s</div>'
         '<p style="text-align:center;margin-top:16px"><a class="btn" href="intelligence.html">Open the Trade Intelligence Centre</a></p></div></section><!--INTEL_HOME_END-->') % ''.join(card(a) for a in ARTS[:3])
h = open('index.html', encoding='utf-8').read()
if '<!--INTEL_HOME_START-->' in h: h = re.sub(r'<!--INTEL_HOME_START-->.*?<!--INTEL_HOME_END-->', lambda m: strip, h, flags=re.S)
else: h = h.replace('<section id="explore">', strip + '<section id="explore">', 1)
if 'intel.css' not in h: h = h.replace('</head>', '<link href="intel.css" rel="stylesheet"/></head>', 1)
open('index.html', 'w', encoding='utf-8').write(h)

# ---------- sitemap block
urls = ['intelligence.html'] + [c['slug'] for c in C['categories']] + [aurl(a) for a in ARTS]
dates = {aurl(a): a['updated'] for a in ARTS}
block = '<!--intel:start-->' + ''.join('<url><loc>%s/%s</loc>%s</url>' % (BASE, u, ('<lastmod>%s</lastmod>' % dates[u]) if u in dates else '') for u in urls) + '<!--intel:end-->'
sm = open('sitemap.xml', encoding='utf-8').read()
sm = re.sub(r'<!--intel:start-->.*?<!--intel:end-->', lambda m: block, sm, flags=re.S) if '<!--intel:start-->' in sm else sm.replace('</urlset>', block + '</urlset>', 1)
open('sitemap.xml', 'w', encoding='utf-8').write(sm)

# ---------- link check on everything generated
bad = []
for fn in ['intelligence.html', 'index.html'] + [c['slug'] for c in C['categories']] + [aurl(a) for a in ARTS]:
    for m in re.finditer(r'href="([A-Za-z0-9_\-]+\.html)(?:#[^"]*)?"', open(fn, encoding='utf-8').read()):
        if not os.path.exists(m.group(1)): bad.append('%s -> %s' % (fn, m.group(1)))
if bad: print('BROKEN LINKS:', *sorted(set(bad)), sep='\n  '); sys.exit(1)
print('built: hub + %d topic pages + %d guides; index, homepage strip and sitemap updated' % (len(C['categories']), len(ARTS)))
