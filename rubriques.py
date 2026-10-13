"""Public sections, generated alongside the static portfolio."""
from html import escape
import hashlib, re, unicodedata

SECTIONS = [
    dict(key='Actuariat & data', title='Sciences actuarielles', slug='sciences-actuarielles', symbol='Σ', theme='sage', description='Probabilités, données et modélisation du risque. Mes projets pour mettre les sciences actuarielles en pratique.', label='projet'),
    dict(key='Web', title='Développement web', slug='developpement-web', symbol='</>', theme='clay', description='Les sites et applications que je crée sur mon temps libre. Des idées qui deviennent des outils à utiliser.', label='projet'),
    dict(key='IA', title='Intelligence artificielle', slug='intelligence-artificielle', symbol='✳', theme='sand', description='Mes expériences avec l’intelligence artificielle, les outils que j’explore et ce que j’apprends en les construisant.', label='projet'),
    dict(key='Lectures', title='Lectures & découvertes', slug='lectures', symbol='Aa', theme='sage', description='Un espace pour les livres, les idées et les découvertes que j’ai envie de partager.', label='partage'),
    dict(key='Foi', title='Foi & Bible', slug='foi-bible', symbol='✝', theme='clay', description='Ma relation avec Jésus, mes lectures de la Bible et mes réflexions autour de la foi.', label='partage'),
]

def catalog(items):
    sections=[dict(section) for section in SECTIONS]
    keys={s['key'] for s in sections}
    for p in items:
        key=p['category']
        if key not in keys:
            stem=re.sub('[^a-z0-9]+','-',unicodedata.normalize('NFKD',key).encode('ascii','ignore').decode().lower()).strip('-')[:45] or 'rubrique'
            sections.append(dict(key=key,title=key,slug=stem+'-'+hashlib.sha256(key.encode()).hexdigest()[:8],symbol='↗',theme='sand',description='Mes projets, découvertes et partages autour de '+key+'.',label='projet'))
            keys.add(key)
    for s in sections: s['count']=sum(p['category']==s['key'] for p in items)
    return sections

def count_label(s):
    return f'{s["count"]} {s["label"]}{"s" if s["count"] != 1 else ""}'

def hub(items, render_projects=None):
    cards=[]
    for n,s in enumerate(catalog(items),1):
        action='Voir les projets' if s['label']=='projet' else 'Lire les partages'
        cards.append(f'''<a class="section-card tone-{s['theme']}" href="rubriques/{s['slug']}.html">
  <div class="section-card-top">
    <span class="card-step">{n:02d} / RUBRIQUE</span>
    <span class="card-arrow" aria-hidden="true">↗</span>
  </div>
  <div class="card-symbol-badge" aria-hidden="true">{escape(s['symbol'])}</div>
  <h3 class="card-title">{escape(s['title'])}</h3>
  <p class="card-desc">{escape(s['description'])}</p>
  <div class="section-card-bottom">
    <span class="card-count-pill">{count_label(s)}</span>
    <span class="card-btn">{action} <span aria-hidden="true">→</span></span>
  </div>
</a>''')
    projects_part = render_projects(items) if render_projects else ''
    rubrics_part = f'''<div class="hub-rubrics-block">
  <div class="browse-header">
    <h3 class="browse-label">Explorer par univers & partages</h3>
    <p class="browse-desc">Choisis une rubrique pour approfondir un domaine ou lire mes partages de foi et de lectures.</p>
  </div>
  <div class="rubric-grid">{''.join(cards)}</div>
</div>'''
    return projects_part + rubrics_part

def pages(source,items,render_projects):
    header=source.split('<main id="contenu">',1)[0]
    contact=source[source.index('<section class="contact-section"'):]
    header=re.sub(r'href="styles\.css(\?v=[^"]*)?"', r'href="../styles.css\1"', header).replace('src="script.js"','src="../script.js"')
    header=header.replace('href="rubriques/tous-les-projets.html"','href="tous-les-projets.html"')
    header=re.sub(r'href="#(?!contenu)([^\"]+)"',r'href="../index.html#\1"',header)
    contact=re.sub(r'href="#([^\"]+)"',r'href="../index.html#\1"',contact)
    contact=contact.replace('href="admin.html"','href="../admin.html"')
    output={}
    individual=catalog(items)
    sections=[dict(key='__all__',title='Tous mes projets',slug='tous-les-projets',symbol='↗',theme='sage',description='Tous mes projets réunis ici : sciences actuarielles, développement web et intelligence artificielle. Choisis ensuite une rubrique pour approfondir.',label='projet',count=sum(s['count'] for s in individual if s['label']=='projet'))]+individual
    for s in sections:
        head=re.sub(r'<title>.*?</title>',lambda _: '<title>'+escape(s['title'])+' — Benjamin Minko</title>',header)
        head=re.sub(r'<meta name="description"[^>]*>',lambda _: '<meta name="description" content="'+escape(s['description'],quote=True)+'">',head)
        head=head.replace('<body>','<body data-rubrique="'+escape(s['key'],quote=True)+'">')
        navigation='<nav class="rubric-navigation" aria-label="Changer de rubrique">'+''.join(f'<a href="{x["slug"]}.html"'+(' aria-current="page"' if x['key']==s['key'] else '')+'>'+escape(x['title'])+'</a>' for x in sections)+'</nav>'
        selected=[p for p in items if (p['category'] not in ('Lectures','Foi') if s['key']=='__all__' else p['category']==s['key'])]
        content=render_projects(selected).replace('src="uploads/','src="../uploads/')
        if not selected:
            content='<div class="rubric-empty"><span aria-hidden="true">'+escape(s['symbol'])+'</span><h2>Les premières pages<br><em>restent à écrire.</em></h2><p>Cette rubrique accueillera bientôt mes '+('lectures et découvertes.' if s['key']=='Lectures' else 'partages autour de la Bible et de ma foi.' if s['key']=='Foi' else 'projets et explorations.')+'</p><a class="text-link" href="../index.html#projets">Explorer les autres rubriques ↗</a></div>'
        body=f'''<main id="contenu"><section class="wrap rubric-page"><a class="breadcrumb" href="../index.html#projets">← Toutes les rubriques</a>{navigation}<header class="rubric-heading tone-{s['theme']}"><div><p class="eyebrow">MON UNIVERS / {count_label(s).upper()}</p><h1>{escape(s['title'])}</h1><p>{escape(s['description'])}</p></div><span class="section-symbol" aria-hidden="true">{escape(s['symbol'])}</span></header><div class="rubric-content"><h2>{'Mes partages' if s['label']=='partage' else 'Mes projets'} <span>{s['count']:02d}</span></h2><div class="filters" hidden></div><p class="sr-only" id="filter-status" role="status"></p>{content}</div></section>'''
        output[s['slug']+'.html']=head.replace('<html lang="fr">','<html lang="fr"><!-- Generated portfolio rubrique -->')+body+contact
    return output
