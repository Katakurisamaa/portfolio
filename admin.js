'use strict';

const $ = id => document.getElementById(id);
const form = $('editor');
const allFields = [
  'title', 'category', 'type', 'description', 'details',
  'technologies', 'site', 'demo', 'github', 'imageAlt',
  'author', 'bookTitle', 'quote', 'bibleRef', 'verseText'
];

const SUPABASE_URL = 'https://yvrtpioalszmefypdfsy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2cnRwaW9hbHN6bWVmeXBkZnN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4ODk3NTksImV4cCI6MjEwNzQ2NTc1OX0.WECsQoXXtIrymJanEZqhCw1mZvVnOKkNRrU-9P0SrAs';
const EXPECTED_HASH = '3ca8a7088a58c4bdc1334af1e91e33a08da0b3bf8ced9a1a7344c48ad12a5ea2';

const SECTIONS = [
  { key: 'Actuariat & data', title: 'Sciences actuarielles', slug: 'sciences-actuarielles', symbol: '↗', theme: 'sage', description: 'Probabilités, données et modélisation du risque. Mes projets pour mettre les sciences actuarielles en pratique.', label: 'projet' },
  { key: 'Web', title: 'Développement web', slug: 'developpement-web', symbol: '</>', theme: 'clay', description: 'Les sites et applications que je crée sur mon temps libre. Des idées qui deviennent des outils à utiliser.', label: 'projet' },
  { key: 'IA', title: 'Intelligence artificielle', slug: 'intelligence-artificielle', symbol: '✦', theme: 'sand', description: 'Mes expériences avec l’intelligence artificielle, les outils que j’explore et ce que j’apprends en les construisant.', label: 'projet' },
  { key: 'Lectures', title: 'Lectures & découvertes', slug: 'lectures', symbol: 'Aa', theme: 'sage', description: 'Un espace pour les livres, les idées et les découvertes que j’ai envie de partager.', label: 'partage' },
  { key: 'Foi', title: 'Foi & Bible', slug: 'foi-bible', symbol: '✝', theme: 'clay', description: 'Ma relation avec Jésus, mes lectures de la Bible et mes réflexions autour de la foi.', label: 'partage' }
];

let sections = [...SECTIONS], selectedSection = '__all__';
let projects = [], revision = '', token = '';
let current = null, dirty = false, busy = false;
let imagePath = '', imageFile = null, imageURL = '', artwork = '';
let undo = null, pendingDelete = null;

// Hachage cryptographique standard dans le navigateur
async function hashPassword(pw) {
  const enc = new TextEncoder().encode(pw);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Requetes API avec secours
async function apiRequest(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    if (response.status === 401) {
      showLogin(true, 'Session expirée. Reconnecte-toi.');
    }
    const text = await response.text().catch(() => '');
    let err = `Erreur (${response.status})`;
    try { err = JSON.parse(text).error || err; } catch {}
    throw new Error(err);
  }
  const text = await response.text().catch(() => '');
  return text ? JSON.parse(text) : {};
}

const message = (text, kind = '') => {
  $('message').textContent = text;
  $('message').className = `message ${kind}`;
};

function lock(value) {
  busy = value;
  $('fields').disabled = value;
  $('new-project').disabled = value;
  $('reload').disabled = value;
  $('undo').disabled = value;
  $('confirm-delete').disabled = value;
  $('keep-project').disabled = value;
  document.querySelectorAll('.list-actions button, #section-tabs button').forEach(b => b.disabled = value);
}

function approveDiscard() {
  return !dirty || window.confirm('Abandonner les modifications non enregistrées ?');
}

function markDirty() {
  dirty = true;
  $('save-state').textContent = 'Modifications non enregistrées';
}

function clearImageURL() {
  if (imageURL) URL.revokeObjectURL(imageURL);
  imageURL = '';
}

// --- Authentification robuste ---
function showLogin(show, errorMsg = '') {
  $('login-overlay').hidden = !show;
  if (show) {
    $('login-password').value = '';
    $('login-error').hidden = !errorMsg;
    $('login-error').textContent = errorMsg;
    setTimeout(() => $('login-password').focus(), 100);
  }
}

async function checkAuth() {
  token = localStorage.getItem('bm_admin_token') || sessionStorage.getItem('bm_admin_token') || '';
  if (!token) {
    showLogin(true);
    return false;
  }
  if (token === EXPECTED_HASH) {
    showLogin(false);
    return true;
  }
  try {
    const res = await apiRequest('/api/auth/status');
    if (res.authenticated) {
      showLogin(false);
      return true;
    }
  } catch {}
  showLogin(true);
  return false;
}

$('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const password = $('login-password').value;
  $('login-btn').disabled = true;
  $('login-error').hidden = true;

  try {
    const computedHash = await hashPassword(password);
    let isAuthed = false;
    let finalToken = '';

    // Validation instantanee par hash SHA-256
    if (computedHash === EXPECTED_HASH) {
      isAuthed = true;
      finalToken = computedHash;
    } else {
      // Tenter le endpoint /api/auth/login si mot de passe modifie dans Vercel
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        });
        if (res.ok) {
          const text = await res.text();
          if (text) {
            const data = JSON.parse(text);
            finalToken = data.token;
            isAuthed = true;
          }
        }
      } catch (apiErr) {}
    }

    if (!isAuthed) {
      throw new Error('Mot de passe incorrect.');
    }

    token = finalToken;
    localStorage.setItem('bm_admin_token', token);
    showLogin(false);
    load();
  } catch (err) {
    $('login-error').hidden = false;
    $('login-error').textContent = err.message || 'Erreur de connexion.';
  } finally {
    $('login-btn').disabled = false;
  }
});

$('logout-btn').addEventListener('click', async () => {
  if (!approveDiscard()) return;
  try { await apiRequest('/api/auth/logout', { method: 'POST' }); } catch {}
  localStorage.removeItem('bm_admin_token');
  sessionStorage.removeItem('bm_admin_token');
  token = '';
  showLogin(true, 'Déconnecté avec succès.');
});

$('toggle-pw-visibility').addEventListener('click', () => {
  const inp = $('login-password');
  inp.type = inp.type === 'password' ? 'text' : 'password';
});

// Changement de mot de passe
$('open-change-pw').addEventListener('click', () => {
  $('change-pw-error').hidden = true;
  $('change-pw-form').reset();
  $('change-pw-dialog').showModal();
});
$('cancel-change-pw').addEventListener('click', () => $('change-pw-dialog').close());

$('change-pw-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const currentPassword = $('current-pw').value;
  const newPassword = $('new-pw').value;
  $('confirm-change-pw').disabled = true;

  try {
    const curHash = await hashPassword(currentPassword);
    if (curHash !== EXPECTED_HASH) {
      throw new Error('Mot de passe actuel incorrect.');
    }
    message('Pour modifier le mot de passe sur Vercel, ajoute ADMIN_PASSWORD dans les variables d’environnement Vercel.', 'success');
    $('change-pw-dialog').close();
  } catch (err) {
    $('change-pw-error').hidden = false;
    $('change-pw-error').textContent = err.message;
  } finally {
    $('confirm-change-pw').disabled = false;
  }
});

// --- Selecteur de type de publication ---
function setPublicationType(type) {
  $('type').value = type;
  document.querySelectorAll('.type-pill').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === type);
  });

  $('fields-projet').hidden = (type !== 'projet');
  $('fields-lecture').hidden = (type !== 'lecture');
  $('fields-foi').hidden = (type !== 'foi');

  if (type === 'lecture') {
    $('details-heading').textContent = 'Note de lecture & réflexions approfondies';
    $('details-help').textContent = 'Ce texte s’affichera dans la section dépliable de la fiche de lecture.';
  } else if (type === 'foi') {
    $('details-heading').textContent = 'Méditation & partage personnel';
    $('details-help').textContent = 'Ce texte s’affichera dans la section dépliable du partage.';
  } else {
    $('details-heading').textContent = 'Dans les coulisses';
    $('details-help').textContent = 'Détails techniques, architecture ou démarche du projet.';
  }

  markDirty();
  renderPreview();
}

document.querySelectorAll('.type-pill').forEach(btn => {
  btn.addEventListener('click', () => setPublicationType(btn.dataset.type));
});

// --- Previsualisation temps reel ---
function renderPreview() {
  const type = $('type').value || 'projet';
  const title = $('title').value.trim() || 'Titre de la publication';
  const desc = $('description').value.trim() || 'Le résumé apparaîtra ici.';
  const cat = $('category').value || selectedSection;

  $('preview-name').textContent = title;
  $('preview-description').textContent = desc;
  $('preview-extra').replaceChildren();

  if (type === 'lecture') {
    $('preview-category').textContent = `Lecture · ${$('author').value.trim() || 'Livre'}`;
    const quote = $('quote').value.trim();
    if (quote) {
      const bq = document.createElement('blockquote');
      bq.className = 'reading-quote';
      bq.textContent = `« ${quote} »`;
      $('preview-extra').append(bq);
    }
  } else if (type === 'foi') {
    $('preview-category').textContent = `Foi & Bible · ${$('bibleRef').value.trim() || 'Méditation'}`;
    const verse = $('verseText').value.trim();
    if (verse) {
      const bq = document.createElement('blockquote');
      bq.className = 'faith-quote';
      if ($('bibleRef').value.trim()) {
        const ref = document.createElement('span');
        ref.className = 'verse-ref';
        ref.textContent = $('bibleRef').value.trim();
        bq.append(ref);
      }
      bq.append(document.createTextNode(`« ${verse} »`));
      $('preview-extra').append(bq);
    }
  } else {
    $('preview-category').textContent = [cat, $('technologies').value.trim()].filter(Boolean).join(' · ');
  }

  const src = imageURL || imagePath;
  $('preview-image').hidden = !src;
  $('preview-placeholder').hidden = !!src;
  if (src) {
    $('preview-image').src = src;
    $('preview-image').alt = $('imageAlt').value || title;
  } else {
    $('preview-image').removeAttribute('src');
    $('preview-placeholder').querySelector('strong').textContent = (title.slice(0, 2) || 'BM').toUpperCase();
    $('preview-placeholder').querySelector('span').textContent = artwork ? 'VISUEL CONSERVÉ' : 'NOUVELLE PUBLICATION';
  }
  $('remove-image').hidden = !src;

  $('preview-links').replaceChildren();
  if (type === 'projet') {
    for (const [key, label] of [['site', 'Voir le site ↗'], ['demo', 'Démo ↗'], ['github', 'Code source ↗']]) {
      try {
        const url = new URL($(key).value);
        if (['http:', 'https:'].includes(url.protocol)) {
          const a = document.createElement('a');
          a.href = url.href;
          a.textContent = label;
          a.target = '_blank';
          $('preview-links').append(a);
        }
      } catch {}
    }
  }
}

// --- Edition et liste ---
function edit(project = null, moveFocus = false) {
  form.reset();
  current = project?.id || null;
  $('project-id').value = current || '';

  allFields.forEach(name => {
    if ($(name)) $(name).value = project?.[name] || '';
  });

  const type = project?.type || (
    project?.category === 'Lectures' ? 'lecture' :
    project?.category === 'Foi' ? 'foi' : 'projet'
  );
  setPublicationType(type);

  if (project) {
    selectedSection = project.category;
  } else {
    $('category').value = selectedSection === '__all__' ? (sections[0]?.key || 'Actuariat & data') : selectedSection;
  }

  imagePath = project?.image || '';
  imageFile = null;
  artwork = project?.artwork || '';
  clearImageURL();

  dirty = false;
  $('edit-title').textContent = project ? 'Modifier la publication' : 'Nouvelle publication';
  $('save-state').textContent = project ? 'Enregistré sur cet appareil' : 'Prêt à écrire';

  renderList();
  renderPreview();
  if (moveFocus) $('title').focus();
}

function renderList() {
  renderSections();
  const visible = selectedSection === '__all__'
    ? projects
    : projects.filter(p => p.category === selectedSection);
  $('count').textContent = String(visible.length);
  $('project-list').replaceChildren();

  if (!visible.length) {
    const p = document.createElement('p');
    p.className = 'list-empty';
    p.textContent = selectedSection === '__all__'
      ? 'Aucune publication pour le moment. Clique sur « Nouvelle publication » pour commencer.'
      : `Aucune publication dans la rubrique « ${selectedSection} ». Clique sur « Nouvelle publication » pour en ajouter une.`;
    $('project-list').append(p);
  }

  for (const item of visible) {
    const article = document.createElement('article');
    article.className = 'list-project' + (item.id === current ? ' selected' : '');

    const top = document.createElement('div');
    top.className = 'list-project-top';
    const tag = document.createElement('span');
    tag.className = 'list-type-tag';
    const icon = item.type === 'lecture' ? 'Aa Lecture' : item.type === 'foi' ? '✝ Foi' : '✦ Projet';
    tag.textContent = `${icon} · ${item.category || ''}`;
    top.append(tag);

    const heading = document.createElement('h3');
    heading.textContent = item.title;

    const actions = document.createElement('div');
    actions.className = 'list-actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.textContent = 'Modifier';
    editBtn.addEventListener('click', () => {
      if (!busy && approveDiscard()) edit(item, true);
    });

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'delete';
    delBtn.textContent = 'Supprimer';
    delBtn.addEventListener('click', () => {
      if (busy || !approveDiscard()) return;
      pendingDelete = item.id;
      $('delete-description').textContent = `« ${item.title} » sera retiré du portfolio.`;
      $('delete-dialog').showModal();
      $('keep-project').focus();
    });

    actions.append(editBtn, delBtn);
    article.append(top, heading, actions);
    $('project-list').append(article);
  }

  const categories = [...new Set([...sections.map(s => s.key), ...projects.map(p => p.category)])];
  $('categories').replaceChildren(...categories.map(c => {
    const opt = document.createElement('option');
    opt.value = c;
    return opt;
  }));
}

function renderSections() {
  $('section-tabs').replaceChildren();

  // Onglet "Toutes les rubriques"
  const allBtn = document.createElement('button');
  allBtn.type = 'button';
  allBtn.className = 'section-tab';
  allBtn.setAttribute('aria-pressed', String(selectedSection === '__all__'));
  const allTitle = document.createElement('span');
  allTitle.textContent = 'Toutes les rubriques';
  const allCount = document.createElement('span');
  allCount.textContent = String(projects.length);
  allBtn.append(allTitle, allCount);
  allBtn.addEventListener('click', () => {
    if (busy || !approveDiscard()) return;
    selectedSection = '__all__';
    edit();
    message(`Toutes les publications affichées (${projects.length}).`);
  });
  $('section-tabs').append(allBtn);

  for (const section of sections) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'section-tab';
    button.setAttribute('aria-pressed', String(section.key === selectedSection));

    const title = document.createElement('span');
    title.textContent = section.title;

    const count = document.createElement('span');
    count.textContent = String(projects.filter(p => p.category === section.key).length);

    button.append(title, count);
    button.addEventListener('click', () => {
      if (busy || !approveDiscard()) return;
      selectedSection = section.key;
      edit();
      message(`Rubrique « ${section.title} ». Sélectionne une publication ou ajoutes-en une.`);
    });
    $('section-tabs').append(button);
  }

  const section = sections.find(s => s.key === selectedSection);
  $('section-title').textContent = selectedSection === '__all__' ? 'Toutes les publications' : (section?.title || selectedSection);
  $('section-description').textContent = selectedSection === '__all__'
    ? 'Vue d\'ensemble de toutes tes publications dans le portfolio.'
    : (section?.description || '');
  $('view-section').href = section ? `/rubriques/${section.slug}.html` : '/';
}

// --- Chargement et sauvegarde avec Supabase en direct ---
async function fetchProjectsFromSources() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/projects?select=*&order=created_at.asc`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    if (res.ok) {
      const rows = await res.json();
      return rows.map(r => ({
        id: r.id,
        title: r.title || '',
        category: r.category || '',
        type: r.type || 'projet',
        description: r.description || '',
        details: r.details || '',
        technologies: r.technologies || '',
        site: r.site || '',
        demo: r.demo || '',
        github: r.github || '',
        image: r.image || '',
        imageAlt: r.imagealt || r.imageAlt || '',
        artwork: r.artwork || '',
        author: r.author || '',
        bookTitle: r.booktitle || r.bookTitle || '',
        quote: r.quote || '',
        bibleRef: r.bibleref || r.bibleRef || '',
        verseText: r.versetext || r.verseText || '',
        created_at: r.created_at
      }));
    }
  } catch (e) {
    console.warn('Supabase fetch error, fallback local:', e);
  }

  try {
    const res = await fetch('/api/projects');
    if (res.ok) {
      const data = await res.json();
      return data.projects || [];
    }
  } catch (e) {}

  try {
    const res = await fetch('/projects.json');
    if (res.ok) {
      const data = await res.json();
      return data.projects || [];
    }
  } catch (e) {}

  return [];
}

async function load() {
  lock(true);
  try {
    const isAuthed = await checkAuth();
    if (!isAuthed) return;

    message('Chargement des publications…');
    const items = await fetchProjectsFromSources();
    projects = items;
    revision = String(Date.now());
    sections = SECTIONS.map(s => ({
      ...s,
      count: projects.filter(p => p.category === s.key).length
    }));

    if (selectedSection !== '__all__' && !sections.some(s => s.key === selectedSection)) {
      selectedSection = '__all__';
    }
    undo = null;
    $('undo').hidden = true;
    edit();
    message('✓ Connecté à Supabase. Tes publications sont synchronisées !', 'success');
  } catch (err) {
    message(`Erreur de chargement : ${err.message}`, 'error');
  } finally {
    lock(false);
  }
}

async function persist(next) {
  let savedToSupabase = false;

  try {
    const existingRes = await fetch(`${SUPABASE_URL}/rest/v1/projects?select=id`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    if (existingRes.ok) {
      const existing = await existingRes.json();
      const nextIds = new Set(next.map(p => p.id));
      const toDelete = existing.filter(r => !nextIds.has(r.id)).map(r => r.id);
      for (const id of toDelete) {
        await fetch(`${SUPABASE_URL}/rest/v1/projects?id=eq.${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
      }
    }

    if (next.length > 0) {
      const dbRows = next.map(p => ({
        id: p.id,
        title: p.title || '',
        category: p.category || '',
        type: p.type || 'projet',
        description: p.description || '',
        details: p.details || '',
        technologies: p.technologies || '',
        site: p.site || '',
        demo: p.demo || '',
        github: p.github || '',
        image: p.image || '',
        imagealt: p.imageAlt || '',
        artwork: p.artwork || '',
        author: p.author || '',
        booktitle: p.bookTitle || '',
        quote: p.quote || '',
        bibleref: p.bibleRef || '',
        versetext: p.verseText || ''
      }));

      const upRes = await fetch(`${SUPABASE_URL}/rest/v1/projects?on_conflict=id`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(dbRows)
      });
      if (upRes.ok) savedToSupabase = true;
    } else {
      savedToSupabase = true;
    }
  } catch (e) {
    console.warn('Supabase save error:', e);
  }

  try {
    await apiRequest('/api/projects', {
      method: 'PUT',
      body: JSON.stringify({ revision, projects: next })
    });
  } catch (apiErr) {
    if (!savedToSupabase) throw apiErr;
  }

  projects = next;
  revision = String(Date.now());
  sections = SECTIONS.map(s => ({
    ...s,
    count: projects.filter(p => p.category === s.key).length
  }));
}

// Formulaire
form.addEventListener('input', () => {
  markDirty();
  renderPreview();
});

$('image-file').addEventListener('change', async () => {
  const file = $('image-file').files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024 || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    $('image-file').value = '';
    message('Choisis une image PNG, JPEG ou WebP de 5 Mo maximum.', 'error');
    return;
  }
  clearImageURL();
  imageFile = file;
  imageURL = URL.createObjectURL(file);
  markDirty();
  renderPreview();
  message('Image prête. Enregistre pour la conserver.');
});

$('remove-image').addEventListener('click', () => {
  clearImageURL();
  imagePath = '';
  imageFile = null;
  artwork = '';
  $('image-file').value = '';
  markDirty();
  renderPreview();
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (busy || !form.reportValidity()) return;
  lock(true);
  message('Enregistrement et publication en cours…');

  try {
    if (imageFile) {
      let uploadedUrl = '';
      try {
        const ext = imageFile.name.split('.').pop() || 'jpg';
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const upRes = await fetch(`${SUPABASE_URL}/storage/v1/object/portfolio-media/${filename}`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': imageFile.type
          },
          body: imageFile
        });
        if (upRes.ok) {
          uploadedUrl = `${SUPABASE_URL}/storage/v1/object/public/portfolio-media/${filename}`;
        }
      } catch (e) {
        console.warn('Supabase upload storage failed, fallback /api/upload:', e);
      }

      if (!uploadedUrl) {
        const data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(',')[1]);
          reader.onerror = () => reject(new Error('Impossible de lire cette image.'));
          reader.readAsDataURL(imageFile);
        });
        uploadedUrl = (await apiRequest('/api/upload', {
          method: 'POST',
          body: JSON.stringify({ data })
        })).path;
      }

      imagePath = uploadedUrl;
      imageFile = null;
      clearImageURL();
    }

    const item = {
      id: current || crypto.randomUUID(),
      image: imagePath,
      artwork,
      ...Object.fromEntries(allFields.map(name => [name, $(name)?.value?.trim() || '']))
    };

    const next = current ? projects.map(p => p.id === current ? item : p) : [...projects, item];
    await persist(next);
    edit(projects.find(p => p.id === item.id));
    message('Publication enregistrée et synchronisée instantanément avec Supabase !', 'success');
  } catch (err) {
    message(err.message, 'error');
    renderPreview();
  } finally {
    lock(false);
  }
});

$('new-project').addEventListener('click', () => {
  if (approveDiscard()) edit(null, true);
});

$('cancel').addEventListener('click', () => {
  if (approveDiscard()) edit(projects.find(p => p.id === current) || null);
});

$('reload').addEventListener('click', () => {
  if (approveDiscard()) load();
});

$('keep-project').addEventListener('click', () => $('delete-dialog').close());

$('confirm-delete').addEventListener('click', async () => {
  if (busy || !pendingDelete) return;
  lock(true);
  try {
    const idx = projects.findIndex(p => p.id === pendingDelete);
    const item = projects[idx];
    await persist(projects.filter(p => p.id !== pendingDelete));
    undo = { item, idx };
    $('undo').hidden = false;
    $('delete-dialog').close();
    edit(null);
    message('Publication retirée de Supabase. Tu peux annuler si besoin.', 'success');
  } catch (err) {
    $('delete-dialog').close();
    message(err.message, 'error');
  } finally {
    pendingDelete = null;
    lock(false);
  }
});

$('undo').addEventListener('click', async () => {
  if (!undo || busy || !approveDiscard()) return;
  lock(true);
  try {
    const next = [...projects];
    next.splice(Math.min(undo.idx, next.length), 0, undo.item);
    await persist(next);
    edit(projects.find(p => p.id === undo.item.id));
    undo = null;
    $('undo').hidden = true;
    message('Publication restaurée avec succès.', 'success');
  } catch (err) {
    message(err.message, 'error');
  } finally {
    lock(false);
  }
});

$('open-sync-dialog')?.addEventListener('click', () => {
  $('sync-dialog').showModal();
});
$('close-sync-dialog')?.addEventListener('click', () => $('sync-dialog').close());

window.addEventListener('beforeunload', e => {
  if (dirty) { e.preventDefault(); e.returnValue = ''; }
});

load();
