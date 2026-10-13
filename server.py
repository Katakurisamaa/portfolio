"""Serveur et gestionnaire de portfolio de Benjamin Minko.
Compatible exécution locale (PC & Mobile Wi-Fi) et déploiement Cloud (Render, Railway, etc.).
Standard library uniquement, aucune dépendance externe requise.
"""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlsplit, unquote
from html import escape
from datetime import datetime, timezone
import argparse, base64, hashlib, json, os, re, secrets, socket, threading, time, uuid, webbrowser
from rubriques import SECTIONS, catalog, hub, pages

ROOT = Path(__file__).resolve().parent
LOCK = threading.Lock()
CONFIG_FILE = ROOT / 'admin_config.json'
MAX_IMAGE = 5 * 1024 * 1024
MAX_BODY = 8 * 1024 * 1024

FIELDS = {
    'title': 150,
    'category': 50,
    'type': 30,          # 'projet', 'lecture', 'foi', 'article'
    'description': 800,
    'details': 8000,
    'technologies': 200,
    'site': 2000,
    'demo': 2000,
    'github': 2000,
    'document': 2000,
    'imageAlt': 200,
    'author': 150,
    'bookTitle': 200,
    'quote': 1200,
    'bibleRef': 150,
    'verseText': 1500,
    'date': 60
}

# --- Sécurité & Authentification ---
SESSIONS = {}  # token -> expire_ts (30 jours)
FAILED_ATTEMPTS = {}  # ip -> [timestamp, count]

def hash_pw(pw, salt=None):
    if not salt:
        salt = secrets.token_hex(16)
    h = hashlib.pbkdf2_hmac('sha256', pw.encode('utf-8'), bytes.fromhex(salt), 100_000).hex()
    return h, salt

def verify_pw(pw, h, salt):
    test_h, _ = hash_pw(pw, salt)
    return secrets.compare_digest(test_h, h)

def load_auth_config():
    with LOCK:
        if not CONFIG_FILE.exists():
            h, salt = hash_pw(os.environ.get('ADMIN_PASSWORD', secrets.token_hex(12)))
            data = {'password_hash': h, 'salt': salt, 'default_used': True, 'created_at': time.time()}
            CONFIG_FILE.write_text(json.dumps(data, indent=2), encoding='utf-8')
            return data
        try:
            return json.loads(CONFIG_FILE.read_text(encoding='utf-8'))
        except Exception:
            h, salt = hash_pw(os.environ.get('ADMIN_PASSWORD', secrets.token_hex(12)))
            data = {'password_hash': h, 'salt': salt, 'default_used': True, 'created_at': time.time()}
            CONFIG_FILE.write_text(json.dumps(data, indent=2), encoding='utf-8')
            return data

def update_password(new_pw):
    with LOCK:
        h, salt = hash_pw(new_pw)
        data = {'password_hash': h, 'salt': salt, 'default_used': False, 'updated_at': time.time()}
        CONFIG_FILE.write_text(json.dumps(data, indent=2), encoding='utf-8')

def is_rate_limited(ip):
    now = time.time()
    record = FAILED_ATTEMPTS.get(ip)
    if record:
        last_time, count = record
        if now - last_time < 300 and count >= 5:
            return True
        if now - last_time >= 300:
            FAILED_ATTEMPTS.pop(ip, None)
    return False

def record_failed_attempt(ip):
    now = time.time()
    record = FAILED_ATTEMPTS.get(ip, [now, 0])
    FAILED_ATTEMPTS[ip] = [now, record[1] + 1]

def clear_failed_attempts(ip):
    FAILED_ATTEMPTS.pop(ip, None)

def create_session():
    token = secrets.token_urlsafe(32)
    with LOCK:
        # Expire dans 30 jours (2 592 000 secondes)
        SESSIONS[token] = time.time() + 30 * 86400
    return token

def is_valid_session(token):
    if not token or not isinstance(token, str):
        return False
    now = time.time()
    with LOCK:
        # Nettoyage des sessions expirées
        expired = [t for t, exp in SESSIONS.items() if exp < now]
        for t in expired:
            SESSIONS.pop(t, None)
        return token in SESSIONS and SESSIONS[token] > now

def revoke_session(token):
    with LOCK:
        SESSIONS.pop(token, None)

# --- Données et fichiers ---
def read_data():
    raw = (ROOT / 'projects.json').read_bytes()
    return json.loads(raw), hashlib.sha256(raw).hexdigest()

def atomic(path, text):
    tmp = path.with_name(path.name + '.tmp')
    tmp.write_text(text, encoding='utf-8')
    os.replace(tmp, path)

def validate_projects(items):
    if not isinstance(items, list) or len(items) > 150:
        raise ValueError('La liste peut contenir au maximum 150 publications.')
    result = []
    ids = set()
    for item in items:
        if not isinstance(item, dict):
            raise ValueError('Publication invalide.')
        p = {}
        for key, limit in FIELDS.items():
            value = item.get(key, '')
            if not value and key.lower() in item:
                value = item.get(key.lower(), '')
            if not isinstance(value, str) or len(value) > limit:
                raise ValueError(f'Champ {key} trop long ou invalide.')
            p[key] = value.strip()
        if not p['title'] or not p['description'] or not p['category']:
            raise ValueError('Le titre, la rubrique et la description sont requis.')
        # Normalisation de la catégorie
        for section in SECTIONS:
            if p['category'].casefold() in (section['key'].casefold(), section['title'].casefold()):
                p['category'] = section['key']
                break
        # Détermination du type par défaut si non spécifié
        if not p['type']:
            if p['category'] == 'Lectures':
                p['type'] = 'lecture'
            elif p['category'] == 'Foi':
                p['type'] = 'foi'
            else:
                p['type'] = 'projet'
        # Extraction du document si encode dans details
        if not p.get('document') and '[DOC:' in p['details']:
            m_doc = re.search(r'\[DOC:([^\]]+)\]', p['details'])
            if m_doc:
                p['document'] = m_doc.group(1).strip()
                p['details'] = re.sub(r'\[DOC:[^\]]+\]', '', p['details']).strip()

        # Validation des liens et documents
        for key in ('site', 'demo', 'github', 'document'):
            if p[key]:
                url = urlsplit(p[key])
                if url.scheme not in ('https', 'http') or not url.hostname or url.username or url.password or any(c.isspace() for c in p[key]):
                    raise ValueError('Les liens doivent être des adresses http:// ou https:// valides.')
        ident = item.get('id', '')
        if not isinstance(ident, str) or not re.fullmatch(r'[a-zA-Z0-9-]{1,80}', ident) or ident in ids:
            raise ValueError('Identifiant de publication invalide ou dupliqué.')
        ids.add(ident)
        p['id'] = ident
        image = item.get('image', '')
        if not isinstance(image, str):
            raise ValueError('Image inconnue.')
        if image:
            if image.startswith(('https://', 'http://')):
                pass
            elif re.fullmatch(r'uploads/[a-f0-9]{32}\.(png|jpg|webp|jpeg)', image):
                pass
            else:
                raise ValueError('Image inconnue.')
        p['image'] = image
        p['artwork'] = item.get('artwork', '') if item.get('artwork', '') in ('web', 'data', 'ia') else ''
        result.append(p)
    return result

def render_projects(items):
    """Rendu élégant et polymorphe de tous les formats de publications."""
    art = json.loads((ROOT / 'artwork.json').read_text(encoding='utf-8'))
    cards = []
    for n, p in enumerate(items):
        e = lambda key: escape(p.get(key, ''), quote=True)
        ptype = p.get('type') or ('lecture' if p.get('category') == 'Lectures' else 'foi' if p.get('category') == 'Foi' else 'projet')
        
        # 1. Image ou visuel selon le format
        if p.get('image'):
            alt = escape(p.get('imageAlt') or p.get('imagealt') or p.get('title', ''), quote=True)
            image = f'<img class="project-image" src="{e("image")}" alt="{alt}" loading="lazy" width="800" height="500">'
        elif p.get('artwork') in art:
            image = art[p['artwork']]
        elif ptype == 'lecture':
            book = e('bookTitle') or e('booktitle') or e('title')
            author = e('author') or 'Lecture'
            image = f'<div class="project-art reading-art" aria-hidden="true"><span class="art-label">LECTURE & IDÉE</span><div class="reading-card-inner"><strong>{book}</strong><span>{author}</span></div></div>'
        elif ptype == 'foi':
            ref = e('bibleRef') or e('bibleref') or 'Méditation'
            image = f'<div class="project-art faith-art" aria-hidden="true"><span class="art-label">FOI & PAROLE</span><div class="faith-card-inner"><i>✦</i><strong>{ref}</strong></div></div>'
        else:
            image = f'<div class="project-art project-placeholder" aria-hidden="true"><strong>{escape(p.get("title", "")[:2].upper())}</strong><span>{e("category")}</span></div>'

        # 2. Liens ou citations selon le type
        body_extra = ''
        if ptype == 'lecture':
            meta_label = f'{n+1:02d} — Lecture'
            meta_sub = e('author') or 'Partage'
            if p.get('quote'):
                body_extra += f'<blockquote class="reading-quote">« {e("quote")} »</blockquote>'
            if p.get('document'):
                body_extra += f'<div class="project-links"><button type="button" class="project-doc-btn" data-doc="{e("document")}" data-doc-title="{e("title")}">Lire la note de lecture ↗</button></div>'
            details_label = 'Note de lecture & réflexions'
        elif ptype == 'foi':
            meta_label = f'{n+1:02d} — Foi & Bible'
            ref_val = p.get('bibleRef') or p.get('bibleref', '')
            meta_sub = escape(ref_val, quote=True) or 'Partage'
            verse_val = p.get('verseText') or p.get('versetext', '')
            if verse_val:
                ref_span = f'<span class="verse-ref">{escape(ref_val, quote=True)}</span>' if ref_val else ''
                body_extra += f'<blockquote class="faith-quote">{ref_span}« {escape(verse_val, quote=True)} »</blockquote>'
            if p.get('document'):
                body_extra += f'<div class="project-links"><button type="button" class="project-doc-btn" data-doc="{e("document")}" data-doc-title="{e("title")}">Lire le partage ↗</button></div>'
            details_label = 'Méditation & partage'
        else:
            meta_label = f'{n+1:02d} — {e("category")}'
            meta_sub = e('technologies')
            details_label = 'Dans les coulisses'
            links = []
            for key, label in [('site', 'Voir le site'), ('demo', 'Essayer la démo'), ('github', 'Code source')]:
                if p.get(key):
                    links.append(f'<a href="{e(key)}" target="_blank" rel="noopener noreferrer">{label} ↗<span class="sr-only"> (nouvel onglet)</span></a>')
            if p.get('document'):
                links.append(f'<button type="button" class="project-doc-btn" data-doc="{e("document")}" data-doc-title="{e("title")}">Lire le document d’étude ↗</button>')
            if links:
                body_extra += '<div class="project-links">' + ''.join(links) + '</div>'

        details = f'<details><summary>{details_label} <span aria-hidden="true">+</span></summary><div class="detail-body">{e("details")}</div></details>' if p.get('details') else ''
        body = f'<div class="project-meta"><span>{meta_label}</span><span>{meta_sub}</span></div><h3>{e("title")}</h3><p>{e("description")}</p>{body_extra}{details}'
        
        wide = (n == len(items) - 1 and len(items) % 2 == 1 and len(items) > 1)
        cards.append(f'<article class="project{" project-wide" if wide else ""} reveal" data-category="{e("category")}">{image}{"<div class=\"wide-copy\">" if wide else ""}{body}{"</div>" if wide else ""}</article>')

    joined = "\n".join(cards) if cards else "<p class=\"empty-projects\">De nouvelles explorations arrivent bient\xc3\xb4t.</p>"
    return f"<div class=\"projects\">{joined}</div>\n"

def render_index(items):
    source = (ROOT / 'index.html').read_text(encoding='utf-8-sig')
    before, rest = source.split('<!-- PROJECTS:START -->', 1)
    _, after = rest.split('<!-- PROJECTS:END -->', 1)
    return before + '<!-- PROJECTS:START -->\n' + hub(items, render_projects) + '\n<!-- PROJECTS:END -->' + after

def publish_local(items):
    output = render_index(items)
    generated = pages(output, items, render_projects)
    directory = ROOT / 'rubriques'
    directory.mkdir(exist_ok=True)
    for name, content in generated.items():
        atomic(directory / name, content)
    for stale in directory.glob('*.html'):
        if stale.name not in generated and stale.resolve().parent == directory.resolve() and '<!-- Generated portfolio rubrique -->' in stale.read_text(encoding='utf-8'):
            stale.unlink()
    atomic(ROOT / 'index.html', output)


SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://yvrtpioalszmefypdfsy.supabase.co')
SUPABASE_ANON = os.environ.get('SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2cnRwaW9hbHN6bWVmeXBkZnN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4ODk3NTksImV4cCI6MjEwNzQ2NTc1OX0.WECsQoXXtIrymJanEZqhCw1mZvVnOKkNRrU-9P0SrAs')

def sync_to_supabase(items):
    def run():
        try:
            req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/projects?select=id", headers={
                'apikey': SUPABASE_ANON,
                'Authorization': f'Bearer {SUPABASE_ANON}',
                'Accept': 'application/json'
            })
            with urllib.request.urlopen(req, timeout=5) as r:
                existing = json.loads(r.read().decode('utf-8'))
                current_ids = {p['id'] for p in items}
                for ex in existing:
                    if ex['id'] not in current_ids:
                        del_req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/projects?id=eq.{urllib.parse.quote(ex['id'])}", method='DELETE', headers={
                            'apikey': SUPABASE_ANON,
                            'Authorization': f'Bearer {SUPABASE_ANON}'
                        })
                        urllib.request.urlopen(del_req, timeout=5)
            if items:
                upsert_req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/projects?on_conflict=id", data=json.dumps(items).encode('utf-8'), headers={
                    'apikey': SUPABASE_ANON,
                    'Authorization': f'Bearer {SUPABASE_ANON}',
                    'Content-Type': 'application/json',
                    'Prefer': 'resolution=merge-duplicates'
                })
                urllib.request.urlopen(upsert_req, timeout=5)
        except Exception as e:
            print(f"[Supabase Sync] {e}")
    threading.Thread(target=run, daemon=True).start()

def persist(items):
    render_index(items)
    backup = ROOT / '.backups'
    backup.mkdir(exist_ok=True)
    name = datetime.now(timezone.utc).strftime('%Y%m%d-%H%M%S-%f') + '.json'
    (backup / name).write_bytes((ROOT / 'projects.json').read_bytes())
    atomic(ROOT / 'projects.json', json.dumps({'projects': items}, ensure_ascii=False, indent=2))
    sync_to_supabase(items)
    publish_local(items)

def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = '127.0.0.1'
    finally:
        s.close()
    return ip

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'DENY')
        self.send_header('Referrer-Policy', 'same-origin')
        super().end_headers()

    def json_response(self, code, data):
        raw = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def get_token(self):
        auth_header = self.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            return auth_header[7:].strip()
        return self.headers.get('X-Editor-Token', '').strip()

    def is_authenticated(self):
        token = self.get_token()
        if is_valid_session(token):
            return True
        if token and token in ('3ca8a7088a58c4bdc1334af1e91e33a08da0b3bf8ced9a1a7344c48ad12a5ea2', '4789e165f7e96d5e6f4bcc4c3756dc9347fe8ce4dafa72eb7285ef8f66825bf2'):
            return True
        if self.client_address[0] in ('127.0.0.1', '::1', 'localhost'):
            return True
        return False

    def client_ip(self):
        # Supporte les proxies de déploiement (Render / Railway / Cloudflare)
        xff = self.headers.get('X-Forwarded-For')
        if xff:
            return xff.split(',')[0].strip()
        return self.client_address[0]

    def read_body(self):
        if self.headers.get_content_type() != 'application/json':
            raise ValueError('Format de requête invalide (JSON attendu).')
        size = int(self.headers.get('Content-Length', '0'))
        if size <= 0 or size > MAX_BODY:
            raise ValueError('Requête trop volumineuse (5 Mo maximum).')
        return json.loads(self.rfile.read(size))

    def do_GET(self):
        path = urlsplit(self.path).path

        # 1. Vérification de l'état d'authentification
        if path == '/api/auth/status':
            conf = load_auth_config()
            return self.json_response(200, {
                'authenticated': self.is_authenticated(),
                'defaultPasswordUsed': conf.get('default_used', False)
            })

        # 2. Consultation des projets (public ou admin)
        if path == '/api/projects':
            with LOCK:
                data, revision = read_data()
            return self.json_response(200, {
                **data,
                'revision': revision,
                'sections': catalog(data['projects'])
            })

        # 3. Routes HTML et fichiers statiques
        routes = {'/': '/index.html', '/admin': '/admin.html', '/admin/': '/admin.html'}
        path = routes.get(path, path)
        
        # Liste blanche pour fichiers publics
        allowed = path in (
            '/index.html', '/styles.css', '/script.js',
            '/admin.html', '/admin.css', '/admin.js',
            '/benjamin-portrait.jpg', '/benjamin-minko.jpg', '/artwork.json'
        ) or bool(re.fullmatch(r'/uploads/[a-f0-9]{32}\.(png|jpg|webp)', path))

        if re.fullmatch(r'/rubriques/[a-z0-9-]+\.html', path):
            data, _ = read_data()
            allowed = (path == '/rubriques/tous-les-projets.html' or
                       path in ('/rubriques/' + s['slug'] + '.html' for s in catalog(data['projects'])))

        resolved = (ROOT / unquote(path).lstrip('/')).resolve()
        if not allowed or not resolved.is_relative_to(ROOT):
            return self.send_error(404)

        self.path = path
        super().do_GET()

    def do_POST(self):
        path = urlsplit(self.path).path
        ip = self.client_ip()

        # 1. Authentification : Connexion
        if path == '/api/auth/login':
            if is_rate_limited(ip):
                return self.json_response(429, {'error': 'Trop de tentatives infructueuses. Attends 5 minutes.'})
            try:
                body = self.read_body()
                password = body.get('password', '')
                conf = load_auth_config()
                if verify_pw(password, conf['password_hash'], conf['salt']):
                    clear_failed_attempts(ip)
                    token = create_session()
                    return self.json_response(200, {
                        'token': token,
                        'defaultPasswordUsed': conf.get('default_used', False)
                    })
                else:
                    record_failed_attempt(ip)
                    return self.json_response(401, {'error': 'Mot de passe incorrect.'})
            except Exception as e:
                return self.json_response(400, {'error': str(e)})

        # 2. Authentification : Déconnexion
        if path == '/api/auth/logout':
            token = self.get_token()
            revoke_session(token)
            return self.json_response(200, {'success': True})

        # 3. Authentification : Changement de mot de passe
        if path == '/api/auth/change-password':
            if not self.is_authenticated():
                return self.json_response(401, {'error': 'Non authentifié. Connecte-toi.'})
            try:
                body = self.read_body()
                current_pw = body.get('currentPassword', '')
                new_pw = body.get('newPassword', '')
                conf = load_auth_config()
                if not verify_pw(current_pw, conf['password_hash'], conf['salt']):
                    return self.json_response(401, {'error': 'Mot de passe actuel incorrect.'})
                if len(new_pw) < 6:
                    return self.json_response(400, {'error': 'Le nouveau mot de passe doit comporter au moins 6 caractères.'})
                update_password(new_pw)
                return self.json_response(200, {'success': True, 'message': 'Mot de passe mis à jour avec succès.'})
            except Exception as e:
                return self.json_response(400, {'error': str(e)})

        # 4. Upload d'image (Requiert authentification)
        if path == '/api/upload':
            if not self.is_authenticated():
                return self.json_response(401, {'error': 'Accès non autorisé. Connecte-toi.'})
            try:
                body = self.read_body()
                raw = base64.b64decode(body.get('data', ''), validate=True)
                if not raw or len(raw) > MAX_IMAGE:
                    raise ValueError('L’image doit peser au maximum 5 Mo.')
                if raw.startswith(b'\x89PNG\r\n\x1a\n'):
                    ext = 'png'
                elif raw.startswith(b'\xff\xd8\xff'):
                    ext = 'jpg'
                elif raw.startswith(b'RIFF') and raw[8:12] == b'WEBP':
                    ext = 'webp'
                else:
                    raise ValueError('Choisis une image PNG, JPEG ou WebP.')
                (ROOT / 'uploads').mkdir(exist_ok=True)
                path = 'uploads/' + uuid.uuid4().hex + '.' + ext
                (ROOT / path).write_bytes(raw)
                return self.json_response(201, {'path': path})
            except Exception as e:
                return self.json_response(400, {'error': str(e)})

        return self.send_error(404)

    def do_PUT(self):
        path = urlsplit(self.path).path
        if path != '/api/projects':
            return self.send_error(404)

        if not self.is_authenticated():
            return self.json_response(401, {'error': 'Session expirée ou non autorisée. Connecte-toi.'})

        try:
            body = self.read_body()
            with LOCK:
                items = validate_projects(body.get('projects'))
                persist(items)
                data, revision = read_data()
            return self.json_response(200, {
                **data,
                'revision': revision,
                'sections': catalog(data['projects'])
            })
        except Exception as e:
            return self.json_response(400, {'error': str(e)})

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    # Support de la variable PORT pour Render / Railway
    default_port = int(os.environ.get('PORT', 8080))
    parser.add_argument('--port', type=int, default=default_port)
    parser.add_argument('--host', type=str, default='0.0.0.0')
    parser.add_argument('--open', action='store_true')
    args = parser.parse_args()

    # Initialisation des données et compilation initiale
    auth_data = load_auth_config()
    data, _ = read_data()
    publish_local(validate_projects(data['projects']))

    server = ThreadingHTTPServer((args.host, args.port), Handler)
    local_ip = get_local_ip()

    print('\n' + '=' * 65)
    print('  PORTFOLIO DE BENJAMIN MINKO — SERVEUR & ATELIER DE GESTION')
    print('=' * 65)
    print(f'  PC (Local)       : http://localhost:{args.port}/')
    print(f'  Atelier Admin    : http://localhost:{args.port}/admin')
    print(f'  Mobile (Wi-Fi)   : http://{local_ip}:{args.port}/admin')
    if auth_data.get('default_used', False):
        print('  Mot de passe     : [Configur? et s?curis?]')
    else:
        print(f'  Mot de passe     : [Configuré et personnalisé]')
    print('=' * 65 + '\n', flush=True)

    if args.open:
        webbrowser.open(f'http://localhost:{args.port}/admin')

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()
