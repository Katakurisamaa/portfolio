// Vercel Serverless Function: Authentification Admin
const crypto = require('crypto');

const DEFAULT_HASH = '3ca8a7088a58c4bdc1334af1e91e33a08da0b3bf8ced9a1a7344c48ad12a5ea2';

function getExpectedToken() {
  if (process.env.ADMIN_PASSWORD) {
    return crypto.createHash('sha256').update(process.env.ADMIN_PASSWORD).digest('hex');
  }
  return DEFAULT_HASH;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Editor-Token');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const auth = req.headers.authorization || req.headers['x-editor-token'] || '';
    const token = auth.replace('Bearer ', '').trim();
    const expected = getExpectedToken();
    return res.status(200).json({
      authenticated: token === expected,
      mode: 'vercel'
    });
  }

  if (req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { password } = body;
    if (!password) {
      return res.status(400).json({ error: 'Mot de passe requis.' });
    }
    const token = crypto.createHash('sha256').update(password).digest('hex');
    const expected = getExpectedToken();
    if (token === expected) {
      return res.status(200).json({ token });
    } else {
      return res.status(401).json({ error: 'Mot de passe incorrect.' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
