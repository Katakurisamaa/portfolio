// Vercel Serverless Function: Upload d'images sur GitHub
const crypto = require('crypto');

const REPO_OWNER = 'Katakurisamaa';
const REPO_NAME = 'portfolio';


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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!verifyAuth(req)) {
    return res.status(401).json({ error: 'Session expirée. Connecte-toi.' });
  }

  const githubToken = req.headers['x-github-token'] || process.env.GITHUB_TOKEN;
  if (!githubToken) {
    return res.status(400).json({ error: 'GITHUB_TOKEN manquant dans Vercel ou dans « Sync en ligne ».' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const { data } = body;
  if (!data) return res.status(400).json({ error: 'Données d’image manquantes.' });

  try {
    const raw = Buffer.from(data, 'base64');
    let ext = 'jpg';
    if (raw[0] === 0x89 && raw[1] === 0x50 && raw[2] === 0x4E && raw[3] === 0x47) ext = 'png';
    else if (raw[0] === 0xFF && raw[1] === 0xD8 && raw[2] === 0xFF) ext = 'jpg';
    else if (raw.toString('ascii', 8, 12) === 'WEBP') ext = 'webp';

    const filename = Date.now() + '-' + crypto.randomBytes(6).toString('hex') + '.' + ext;
    const path = 'uploads/' + filename;

    const ghRes = await fetch(https://api.github.com/repos///contents/, {
      method: 'PUT',
      headers: {
        'Authorization': Bearer ,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Portfolio-Vercel'
      },
      body: JSON.stringify({
        message: Ajout image  [via Atelier Mobile],
        content: data
      })
    });

    if (!ghRes.ok) {
      const errData = await ghRes.json().catch(() => ({}));
      throw new Error(errData.message || 'Erreur GitHub upload (' + ghRes.status + ')');
    }

    return res.status(201).json({ path });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
