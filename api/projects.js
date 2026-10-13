// Vercel Serverless Function: Gestion des projets et publications via GitHub API
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const REPO_OWNER = 'Katakurisamaa';
const REPO_NAME = 'portfolio';


const SECTIONS = [
  { key: 'Actuariat & data', title: 'Sciences actuarielles', slug: 'sciences-actuarielles', symbol: '↗', theme: 'sage', description: 'Probabilités, données et modélisation du risque. Mes projets pour mettre les sciences actuarielles en pratique.', label: 'projet' },
  { key: 'Web', title: 'Développement web', slug: 'developpement-web', symbol: '</>', theme: 'clay', description: 'Les sites et applications que je crée sur mon temps libre. Des idées qui deviennent des outils à utiliser.', label: 'projet' },
  { key: 'IA', title: 'Intelligence artificielle', slug: 'intelligence-artificielle', symbol: '✦', theme: 'sand', description: 'Mes expériences avec l’intelligence artificielle, les outils que j’explore et ce que j’apprends en les construisant.', label: 'projet' },
  { key: 'Lectures', title: 'Lectures & découvertes', slug: 'lectures', symbol: 'Aa', theme: 'sage', description: 'Un espace pour les livres, les idées et les découvertes que j’ai envie de partager.', label: 'partage' },
  { key: 'Foi', title: 'Foi & Bible', slug: 'foi-bible', symbol: '✝', theme: 'clay', description: 'Ma relation avec Jésus, mes lectures de la Bible et mes réflexions autour de la foi.', label: 'partage' }
];

function catalog(items) {
  return SECTIONS.map(s => ({
    ...s,
    count: items.filter(p => p.category === s.key).length
  }));
}

const DEFAULT_HASH = '3ca8a7088a58c4bdc1334af1e91e33a08da0b3bf8ced9a1a7344c48ad12a5ea2';

function verifyAuth(req) {
  const auth = req.headers.authorization || req.headers['x-editor-token'] || '';
  const token = auth.replace('Bearer ', '').trim();
  if (process.env.ADMIN_PASSWORD) {
    const expected = crypto.createHash('sha256').update(process.env.ADMIN_PASSWORD).digest('hex');
    if (token === expected) return true;
  }
  return token === DEFAULT_HASH;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Editor-Token, X-GitHub-Token');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const githubToken = req.headers['x-github-token'] || process.env.GITHUB_TOKEN;

  // GET /api/projects
  if (req.method === 'GET') {
    try {
      let content = null;
      if (githubToken) {
        try {
          const ghRes = await fetch(https://api.github.com/repos///contents/projects.json, {
            headers: {
              'Authorization': Bearer ,
              'Accept': 'application/vnd.github.v3+json',
              'User-Agent': 'Portfolio-Vercel'
            }
          });
          if (ghRes.ok) {
            const ghData = await ghRes.json();
            content = Buffer.from(ghData.content, 'base64').toString('utf-8');
          }
        } catch (e) {
          console.warn('GitHub fetch fallback:', e.message);
        }
      }

      if (!content) {
        const localPath = path.join(process.cwd(), 'projects.json');
        if (fs.existsSync(localPath)) {
          content = fs.readFileSync(localPath, 'utf-8');
        } else {
          content = JSON.stringify({ projects: [] });
        }
      }

      const data = JSON.parse(content);
      const items = data.projects || [];
      return res.status(200).json({
        projects: items,
        revision: crypto.createHash('sha256').update(content).digest('hex'),
        sections: catalog(items)
      });
    } catch (err) {
      return res.status(500).json({ error: 'Impossible de charger les publications : ' + err.message });
    }
  }

  // PUT /api/projects : Enregistrement, Modification ou Suppression
  if (req.method === 'PUT') {
    if (!verifyAuth(req)) {
      return res.status(401).json({ error: 'Session expirée. Connecte-toi.' });
    }

    if (!githubToken) {
      return res.status(400).json({
        error: 'GITHUB_TOKEN manquant. Configure-le dans Vercel (Environment Variables) ou clique sur « Sync en ligne » en haut pour le renseigner.'
      });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { projects } = body;
    if (!Array.isArray(projects)) {
      return res.status(400).json({ error: 'Liste de publications invalide.' });
    }

    try {
      const getRes = await fetch(https://api.github.com/repos///contents/projects.json, {
        headers: {
          'Authorization': Bearer ,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Portfolio-Vercel'
        }
      });
      if (!getRes.ok) {
        throw new Error('Impossible de récupérer projects.json sur GitHub (' + getRes.status + '). Vérifie les permissions du token.');
      }
      const currentFile = await getRes.json();
      const currentSha = currentFile.sha;

      const newContent = JSON.stringify({ projects }, null, 2);
      const encoded = Buffer.from(newContent, 'utf-8').toString('base64');

      const putRes = await fetch(https://api.github.com/repos///contents/projects.json, {
        method: 'PUT',
        headers: {
          'Authorization': Bearer ,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Portfolio-Vercel'
        },
        body: JSON.stringify({
          message: 'Mise à jour des publications [Atelier Mobile / Web]',
          content: encoded,
          sha: currentSha
        })
      });

      if (!putRes.ok) {
        const putError = await putRes.json().catch(() => ({}));
        throw new Error(putError.message || 'Erreur lors du commit GitHub (' + putRes.status + ')');
      }

      return res.status(200).json({
        success: true,
        projects,
        revision: crypto.createHash('sha256').update(newContent).digest('hex'),
        sections: catalog(projects),
        message: 'Publications enregistrées ! Vercel redéploie le site automatiquement.'
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
