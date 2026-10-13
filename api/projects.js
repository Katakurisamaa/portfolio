// Vercel Serverless Function: Gestion des projets et publications via Supabase
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://yvrtpioalszmefypdfsy.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2cnRwaW9hbHN6bWVmeXBkZnN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4ODk3NTksImV4cCI6MjEwNzQ2NTc1OX0.WECsQoXXtIrymJanEZqhCw1mZvVnOKkNRrU-9P0SrAs';
const DEFAULT_HASH = '3ca8a7088a58c4bdc1334af1e91e33a08da0b3bf8ced9a1a7344c48ad12a5ea2'; 

const SECTIONS = [
  { key: 'Actuariat & data', title: 'Sciences actuarielles', slug: 'sciences-actuarielles', symbol: '?', theme: 'sage', description: 'Probabilit?s, donn?es et mod?lisation du risque. Mes projets pour mettre les sciences actuarielles en pratique.', label: 'projet' },
  { key: 'Web', title: 'Programmation', slug: 'developpement-web', symbol: '</>', theme: 'clay', description: 'Les sites et applications que je cr?e sur mon temps libre. Des id?es qui deviennent des outils ? utiliser.', label: 'projet' },
  { key: 'IA', title: 'Intelligence artificielle', slug: 'intelligence-artificielle', symbol: '?', theme: 'sand', description: 'Mes exp?riences avec l?intelligence artificielle, les outils que j?explore et ce que j?apprends en les construisant.', label: 'projet' },
  { key: 'Lectures', title: 'Lectures & d?couvertes', slug: 'lectures', symbol: 'Aa', theme: 'sage', description: 'Un espace pour les livres, les id?es et les d?couvertes que j?ai envie de partager.', label: 'partage' },
  { key: 'Foi', title: 'Foi & Bible', slug: 'foi-bible', symbol: '?', theme: 'clay', description: 'Ma relation avec J?sus, mes lectures de la Bible et mes r?flexions autour de la foi.', label: 'partage' }
];

function catalog(items) {
  return SECTIONS.map(s => ({
    ...s,
    count: items.filter(p => p.category === s.key).length
  }));
}

function verifyAuth(req) {
  const auth = req.headers.authorization || req.headers['x-editor-token'] || '';
  const token = auth.replace('Bearer ', '').trim();
  if (process.env.ADMIN_PASSWORD) {
    const expected = crypto.createHash('sha256').update(process.env.ADMIN_PASSWORD).digest('hex');
    if (token === expected) return true;
  }
  return token === DEFAULT_HASH;
}

function normalizeFromDb(row) {
  let doc = row.document || '';
  let det = row.details || '';
  const match = det.match(/\[DOC:([^\]]+)\]/);
  if (match) {
    if (!doc) doc = match[1].trim();
    det = det.replace(/\[DOC:[^\]]+\]/g, '').trim();
  }
  return {
    id: row.id,
    title: row.title || '',
    category: row.category || '',
    type: row.type || 'projet',
    description: row.description || '',
    details: det,
    technologies: row.technologies || '',
    site: row.site || '',
    demo: row.demo || '',
    github: row.github || '',
    document: doc,
    image: row.image || '',
    imageAlt: row.imagealt || row.imageAlt || '',
    artwork: row.artwork || '',
    author: row.author || '',
    bookTitle: row.booktitle || row.bookTitle || '',
    quote: row.quote || '',
    bibleRef: row.bibleref || row.bibleRef || '',
    verseText: row.versetext || row.verseText || '',
    created_at: row.created_at
  };
}

function normalizeToDb(item) {
  let det = item.details || '';
  const doc = item.document ? item.document.trim() : '';
  if (doc) {
    det = det.replace(/\[DOC:[^\]]+\]/g, '').trim();
    det = det ? `${det}\n\n[DOC:${doc}]` : `[DOC:${doc}]`;
  } else {
    det = det.replace(/\[DOC:[^\]]+\]/g, '').trim();
  }
  return {
    id: item.id,
    title: item.title || '',
    category: item.category || '',
    type: item.type || 'projet',
    description: item.description || '',
    details: det,
    technologies: item.technologies || '',
    site: item.site || '',
    demo: item.demo || '',
    github: item.github || '',
    image: item.image || '',
    imagealt: item.imageAlt || item.imagealt || '',
    artwork: item.artwork || '',
    author: item.author || '',
    booktitle: item.bookTitle || item.booktitle || '',
    quote: item.quote || '',
    bibleref: item.bibleRef || item.bibleref || '',
    versetext: item.verseText || item.versetext || ''
  };
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Editor-Token');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET /api/projects
  if (req.method === 'GET') {
    try {
      let items = null;
      try {
        const sbRes = await fetch(`${SUPABASE_URL}/rest/v1/projects?select=*&order=created_at.asc`, {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Accept': 'application/json'
          }
        });
        if (sbRes.ok) {
          const rows = await sbRes.json();
          items = rows.map(normalizeFromDb);
        }
      } catch (e) {
        console.warn('Supabase fetch fallback:', e.message);
      }

      if (!items) {
        const localPath = path.join(process.cwd(), 'projects.json');
        if (fs.existsSync(localPath)) {
          const content = fs.readFileSync(localPath, 'utf-8');
          items = JSON.parse(content).projects || [];
        } else {
          items = [];
        }
      }

      const rev = crypto.createHash('sha256').update(JSON.stringify(items)).digest('hex');
      return res.status(200).json({
        projects: items,
        revision: rev,
        sections: catalog(items),
        source: 'supabase'
      });
    } catch (err) {
      return res.status(500).json({ error: 'Impossible de charger les publications : ' + err.message });
    }
  }

  // PUT /api/projects
  if (req.method === 'PUT') {
    if (!verifyAuth(req)) {
      return res.status(401).json({ error: 'Session expir?e. Connecte-toi.' });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { projects } = body;
    if (!Array.isArray(projects)) {
      return res.status(400).json({ error: 'Liste de publications invalide.' });
    }

    try {
      const existingRes = await fetch(`${SUPABASE_URL}/rest/v1/projects?select=id`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Accept': 'application/json'
        }
      });
      const existingRows = existingRes.ok ? await existingRes.json() : [];
      const newIds = new Set(projects.map(p => p.id));
      const toDelete = existingRows.filter(r => !newIds.has(r.id)).map(r => r.id);

      if (toDelete.length > 0) {
        for (const id of toDelete) {
          await fetch(`${SUPABASE_URL}/rest/v1/projects?id=eq.${encodeURIComponent(id)}`, {
            method: 'DELETE',
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
          });
        }
      }

      if (projects.length > 0) {
        const dbItems = projects.map(normalizeToDb);
        const upsertRes = await fetch(`${SUPABASE_URL}/rest/v1/projects?on_conflict=id`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify(dbItems)
        });
        if (!upsertRes.ok) {
          const errData = await upsertRes.json().catch(() => ({}));
          throw new Error('Erreur Supabase : ' + (errData.message || upsertRes.statusText));
        }
      }

      const rev = crypto.createHash('sha256').update(JSON.stringify(projects)).digest('hex');
      return res.status(200).json({
        success: true,
        projects,
        revision: rev,
        sections: catalog(projects),
        message: 'Synchronis? instantan?ment avec Supabase !'
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
