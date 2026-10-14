# Script de generation statique execute lors du build Vercel (avec sync Supabase)
import sys, json, urllib.request
from server import publish_local, read_data, validate_projects, ROOT

def sync_from_supabase():
    url = 'https://yvrtpioalszmefypdfsy.supabase.co/rest/v1/projects?select=*&order=created_at.asc'
    anon = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2cnRwaW9hbHN6bWVmeXBkZnN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4ODk3NTksImV4cCI6MjEwNzQ2NTc1OX0.WECsQoXXtIrymJanEZqhCw1mZvVnOKkNRrU-9P0SrAs'
    try:
        req = urllib.request.Request(url, headers={'apikey': anon, 'Authorization': f'Bearer {anon}'})
        with urllib.request.urlopen(req, timeout=5) as r:
            if r.status == 200:
                rows = json.loads(r.read().decode('utf-8'))
                if rows:
                    (ROOT / 'projects.json').write_text(json.dumps({'projects': rows}, indent=2, ensure_ascii=False), encoding='utf-8')
                    print(f"Supabase synchronise : {len(rows)} publications recuperees.")
    except Exception as e:
        print(f"Note : fallback sur projects.json local ({e})")

from datetime import datetime, timezone
from rubriques import catalog

def generate_sitemap(projects):
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    base = 'https://benjaminminko.com'
    urls = [
        f"""  <url>
    <loc>{base}/</loc>
    <lastmod>{today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>""",
        f"""  <url>
    <loc>{base}/planificateur.html</loc>
    <lastmod>{today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>""",
        f"""  <url>
    <loc>{base}/lectio.html</loc>
    <lastmod>{today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>""",
        f"""  <url>
    <loc>{base}/rubriques/tous-les-projets.html</loc>
    <lastmod>{today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>"""
    ]
    for s in catalog(projects):
        urls.append(f"""  <url>
    <loc>{base}/rubriques/{s['slug']}.html</loc>
    <lastmod>{today}</lastmod>
    <changefreq>{'monthly' if s['label'] == 'partage' else 'weekly'}</changefreq>
    <priority>{'0.7' if s['label'] == 'partage' else '0.8'}</priority>
  </url>""")
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + '\n'.join(urls) + '\n</urlset>\n'
    (ROOT / 'sitemap.xml').write_text(xml, encoding='utf-8')
    print("Sitemap XML actualise.")

def main():
    try:
        sync_from_supabase()
        data, _ = read_data()
        projects = validate_projects(data.get('projects', []))
        publish_local(projects)
        generate_sitemap(projects)
        print(f'Build reussi : {len(projects)} publications compilees avec succes.')
    except Exception as e:
        print(f'Erreur critique lors du build : {e}', file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
