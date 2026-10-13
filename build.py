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

def main():
    try:
        sync_from_supabase()
        data, _ = read_data()
        projects = validate_projects(data.get('projects', []))
        publish_local(projects)
        print(f'Build reussi : {len(projects)} publications compilees avec succes.')
    except Exception as e:
        print(f'Erreur critique lors du build : {e}', file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
