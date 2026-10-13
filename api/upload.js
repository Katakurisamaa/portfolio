// Vercel Serverless Function: Upload d'images sur Supabase Storage
const crypto = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://yvrtpioalszmefypdfsy.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2cnRwaW9hbHN6bWVmeXBkZnN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4ODk3NTksImV4cCI6MjEwNzQ2NTc1OX0.WECsQoXXtIrymJanEZqhCw1mZvVnOKkNRrU-9P0SrAs';
const DEFAULT_HASH = '3ca8a7088a58c4bdc1334af1e91e33a08da0b3bf8ced9a1a7344c48ad12a5ea2'; // sha256 Richesse19

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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Editor-Token');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!verifyAuth(req)) {
    return res.status(401).json({ error: 'Session expir?e. Connecte-toi.' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const { data } = body;
  if (!data) return res.status(400).json({ error: 'Donn?es d?image manquantes.' });

  try {
    const raw = Buffer.from(data, 'base64');
    let ext = 'jpg';
    let mime = 'image/jpeg';
    if (raw[0] === 0x89 && raw[1] === 0x50 && raw[2] === 0x4E && raw[3] === 0x47) {
      ext = 'png';
      mime = 'image/png';
    } else if (raw.toString('ascii', 8, 12) === 'WEBP') {
      ext = 'webp';
      mime = 'image/webp';
    }

    const filename = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/portfolio-media/${filename}`;

    const sbRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': mime
      },
      body: raw
    });

    if (!sbRes.ok) {
      const errData = await sbRes.json().catch(() => ({}));
      throw new Error('Erreur upload Supabase : ' + (errData.message || sbRes.statusText));
    }

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/portfolio-media/${filename}`;
    return res.status(201).json({ path: publicUrl });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
