# Script de generation statique execute lors du build Vercel
import sys
from server import publish_local, read_data, validate_projects

def main():
    try:
        data, _ = read_data()
        projects = validate_projects(data.get('projects', []))
        publish_local(projects)
        print(f'Build reussi : {len(projects)} publications compilees avec succes.')
    except Exception as e:
        print(f'Erreur critique lors du build : {e}', file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
