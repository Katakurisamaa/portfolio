'use strict';

const $ = id => document.getElementById(id);
const form = $('editor');
const allFields = [
  'title', 'category', 'type', 'description', 'details',
  'technologies', 'site', 'demo', 'github', 'imageAlt',
  'author', 'bookTitle', 'quote', 'bibleRef', 'verseText',
  'document'
];

const SUPABASE_URL = 'https://yvrtpioalszmefypdfsy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2cnRwaW9hbHN6bWVmeXBkZnN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4ODk3NTksImV4cCI6MjEwNzQ2NTc1OX0.WECsQoXXtIrymJanEZqhCw1mZvVnOKkNRrU-9P0SrAs';
const EXPECTED_HASH = '3ca8a7088a58c4bdc1334af1e91e33a08da0b3bf8ced9a1a7344c48ad12a5ea2';

const SECTIONS = [
  { key: 'Actuariat & data', title: 'Sciences actuarielles', slug: 'sciences-actuarielles', symbol: '↗', theme: 'sage', description: 'Probabilités, données et modélisation du risque. Mes projets pour mettre les sciences actuarielles en pratique.', label: 'projet' },
  { key: 'Web', title: 'Programmation', slug: 'developpement-web', symbol: '</>', theme: 'clay', description: 'Les sites et applications que je crée sur mon temps libre. Des idées qui deviennent des outils à utiliser.', label: 'projet' },
  { key: 'IA', title: 'Intelligence artificielle', slug: 'intelligence-artificielle', symbol: '✦', theme: 'sand', description: 'Mes expériences avec l’intelligence artificielle, les outils que j’explore et ce que j’apprends en les construisant.', label: 'projet' },
  { key: 'Lectures', title: 'Lectures & découvertes', slug: 'lectures', symbol: 'Aa', theme: 'sage', description: 'Un espace pour les livres, les idées et les découvertes que j’ai envie de partager.', label: 'partage' },
  { key: 'Foi', title: 'Foi & Bible', slug: 'foi-bible', symbol: '✝', theme: 'clay', description: 'Ma relation avec Jésus, mes lectures de la Bible et mes réflexions autour de la foi.', label: 'partage' }
];

let sections = [...SECTIONS], selectedSection = '__all__';
let projects = [], revision = '', token = '';
let current = null, dirty = false, busy = false;
let imagePath = '', imageFile = null, imageURL = '', artwork = '';
let undo = null, pendingDelete = null;
let searchQuery = '';

// Hachage cryptographique standard dans le navigateur
async function hashPassword(pw) {
  const enc = new TextEncoder().encode(pw);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Requêtes API de secours
async function apiRequest(url, options = {}) {
  const currentToken = token || sessionStorage.getItem('bm_client_auth') || localStorage.getItem('bm_admin_token') || EXPECTED_HASH;
  const headers = {
    'Content-Type': 'application/json',
    ...(currentToken ? { 'Authorization': `Bearer ${currentToken}` } : {}),
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

let messageTimer = null;
const message = (text, kind = '') => {
  const el = $('message');
  el.textContent = text;
  el.className = `message ${kind}`;
  if (messageTimer) clearTimeout(messageTimer);
  if (kind === 'success') {
    messageTimer = setTimeout(() => {
      el.className = 'message';
      el.textContent = 'Prêt pour de nouvelles créations.';
    }, 6000);
  }
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
  const saveBtn = $('save');
  if (value) {
    saveBtn.innerHTML = '<span class="live-dot" style="display:inline-block; margin-right:6px;"></span> Publication en cours...';
  } else {
    saveBtn.innerHTML = 'Enregistrer et publier <span aria-hidden="true">↗</span>';
  }
}

function approveDiscard() {
  return !dirty || window.confirm('Abandonner les modifications non enregistrées ?');
}

function markDirty() {
  dirty = true;
  $('save-state').textContent = '● Modifications non enregistrées';
  $('save-state').style.color = 'var(--admin-accent)';
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
  const pw = $('login-password').value.trim();
  if (!pw) return;

  const hashed = await hashPassword(pw);
  if (hashed === EXPECTED_HASH) {
    token = hashed;
    localStorage.setItem('bm_admin_token', token);
    showLogin(false);
    message('✓ Bienvenue dans ton Atelier de création !', 'success');
    await fetchProjectsFromSources();
    return;
  }

  try {
    const res = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password: pw })
    });
    if (res.token) {
      token = res.token;
      localStorage.setItem('bm_admin_token', token);
      showLogin(false);
      message('✓ Bienvenue dans ton Atelier de création !', 'success');
      await fetchProjectsFromSources();
      return;
    }
  } catch (err) {
    $('login-error').hidden = false;
    $('login-error').textContent = 'Mot de passe incorrect. Réessaie.';
    $('login-password').focus();
  }
});

$('toggle-password').addEventListener('click', () => {
  const input = $('login-password');
  const show = input.type === 'password';
  input.type = show ? 'text' : 'password';
  $('toggle-password').textContent = show ? '🙈' : '👁';
});

$('logout-btn').addEventListener('click', async () => {
  if (!approveDiscard()) return;
  try { await apiRequest('/api/auth/logout', { method: 'POST' }); } catch {}
  localStorage.removeItem('bm_admin_token');
  sessionStorage.removeItem('bm_admin_token');
  token = '';
  showLogin(true, 'Tu as été déconnecté.');
});

// Changement de mot de passe
$('open-change-pw').addEventListener('click', () => {
  $('current-pw').value = '';
  $('new-pw').value = '';
  $('change-pw-error').hidden = true;
  $('change-pw-dialog').showModal();
  $('current-pw').focus();
});

$('cancel-change-pw').addEventListener('click', () => {
  $('change-pw-dialog').close();
});

$('change-pw-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const cur = $('current-pw').value;
  const nw = $('new-pw').value;
  const errEl = $('change-pw-error');
  errEl.hidden = true;

  try {
    await apiRequest('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword: cur, newPassword: nw })
    });
    $('change-pw-dialog').close();
    message('✓ Mot de passe mis à jour avec succès.', 'success');
  } catch (err) {
    errEl.hidden = false;
    errEl.textContent = err.message || 'Impossible de mettre à jour le mot de passe.';
  }
});

// Dialogue Supabase
$('open-sync-dialog').addEventListener('click', () => {
  $('sync-dialog').showModal();
});
$('close-sync-dialog').addEventListener('click', () => {
  $('sync-dialog').close();
});

// Bascule de format de publication
function setPublicationType(type) {
  $('type').value = type;

  document.querySelectorAll('.type-pill').forEach(btn => {
    const active = btn.dataset.type === type;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
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

// --- Prévisualisation temps réel ---
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
        const val = ($(key)?.value || '').trim();
        if (val) {
          const url = new URL(val, window.location.origin);
          if (['http:', 'https:'].includes(url.protocol)) {
            const a = document.createElement('a');
            a.href = val.startsWith('/') || val.startsWith('http') ? val : url.href;
            a.textContent = label;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            $('preview-links').append(a);
          }
        }
      } catch {}
    }
  }
  const docVal = $('document')?.value?.trim();
  if (docVal) {
    const docBtn = document.createElement('button');
    docBtn.type = 'button';
    docBtn.className = 'project-doc-btn';
    docBtn.textContent = '📄 Lire le document d’étude ↗';
    $('preview-links').append(docBtn);
  }
}

// --- Édition et liste des publications ---

// ==========================================================================
// Mode Mobile : Gestion fluide entre Liste des publications et Rédacteur
// ==========================================================================
function setMobileView(mode) {
  const isEditor = mode === 'editor';
  document.body.classList.toggle('mobile-mode-editor', isEditor);
  document.body.classList.toggle('mobile-mode-list', !isEditor);

  const tabList = $('tab-btn-list');
  const tabEditor = $('tab-btn-editor');
  if (tabList) {
    tabList.classList.toggle('active', !isEditor);
    tabList.setAttribute('aria-selected', String(!isEditor));
  }
  if (tabEditor) {
    tabEditor.classList.toggle('active', isEditor);
    tabEditor.setAttribute('aria-selected', String(isEditor));
  }

  const stickyBar = $('mobile-sticky-bar');
  if (stickyBar) {
    stickyBar.style.display = isEditor ? 'flex' : 'none';
  }

  if (isEditor) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// Clics sur onglets de navigation mobile
const tabBtnList = $('tab-btn-list');
const tabBtnEditor = $('tab-btn-editor');
const mobileBackBtn = $('mobile-back-to-list');
const mobileSaveTrigger = $('mobile-save-trigger');
const mobileCancelTrigger = $('mobile-cancel-trigger');

if (tabBtnList) {
  tabBtnList.addEventListener('click', () => setMobileView('list'));
}

if (tabBtnEditor) {
  tabBtnEditor.addEventListener('click', () => {
    setMobileView('editor');
    if (!current) {
      edit(null, true);
    }
  });
}

if (mobileBackBtn) {
  mobileBackBtn.addEventListener('click', () => setMobileView('list'));
}

if (mobileSaveTrigger) {
  mobileSaveTrigger.addEventListener('click', () => {
    if (typeof form.requestSubmit === 'function') {
      form.requestSubmit();
    } else {
      $('save').click();
    }
  });
}

if (mobileCancelTrigger) {
  mobileCancelTrigger.addEventListener('click', () => {
    $('cancel').click();
    setMobileView('list');
  });
}

// Menu déroulant mobile dans l'en-tête
const mobileMenuToggle = $('mobile-menu-toggle');
const mobileDropdown = $('mobile-dropdown-menu');

if (mobileMenuToggle && mobileDropdown) {
  mobileMenuToggle.addEventListener('click', (e) => {
    e.stopPropagation();
    mobileDropdown.hidden = !mobileDropdown.hidden;
  });

  document.addEventListener('click', (e) => {
    if (!mobileDropdown.hidden && !mobileDropdown.contains(e.target) && e.target !== mobileMenuToggle) {
      mobileDropdown.hidden = true;
    }
  });
}

if ($('mobile-open-sync')) {
  $('mobile-open-sync').addEventListener('click', () => {
    if (mobileDropdown) mobileDropdown.hidden = true;
    $('sync-dialog').showModal();
  });
}

if ($('mobile-open-pw')) {
  $('mobile-open-pw').addEventListener('click', () => {
    if (mobileDropdown) mobileDropdown.hidden = true;
    $('change-pw-dialog').showModal();
  });
}

if ($('mobile-logout')) {
  $('mobile-logout').addEventListener('click', () => {
    if (mobileDropdown) mobileDropdown.hidden = true;
    $('logout-btn').click();
  });
}

function edit(project = null, moveFocus = false) {
  form.reset();
  current = project?.id || null;
  $('project-id').value = current || '';

  allFields.forEach(name => {
    if ($(name)) $(name).value = project?.[name] || '';
  });

  if (project) {
    selectedSection = project.category;
    $('category').value = project.category;
  } else {
    $('category').value = selectedSection === '__all__' ? (sections[0]?.key || 'Actuariat & data') : selectedSection;
  }

  const currentCat = $('category').value;
  const type = project?.type || (
    currentCat === 'Lectures' ? 'lecture' :
    currentCat === 'Foi' ? 'foi' : 'projet'
  );
  setPublicationType(type);

  imagePath = project?.image || '';
  imageFile = null;
  artwork = project?.artwork || '';
  clearImageURL();

  const docStatus = $('doc-upload-status');
  const docText = $('doc-upload-text');
  if (docText) docText.textContent = 'Téléverser PDF';
  if ($('document-file')) $('document-file').value = '';
  if (docStatus) {
    if (project?.document) {
      docStatus.className = 'doc-upload-status ready';
      docStatus.textContent = '✓ Document PDF associé (Lecture seule)';
      docStatus.hidden = false;
    } else {
      docStatus.hidden = true;
    }
  }

  dirty = false;
  $('edit-title').textContent = project ? 'Modifier la publication' : 'Nouvelle publication';
  $('save-state').textContent = project ? '✓ Enregistré sur Supabase' : 'Prêt à écrire';
  $('save-state').style.color = 'var(--admin-muted)';

  renderList();
  renderPreview();
  if (moveFocus) $('title').focus();
  if (window.innerWidth <= 850 && (project || moveFocus)) setMobileView('editor');
}

function renderList() {
  renderSections();
  let visible = selectedSection === '__all__'
    ? projects
    : projects.filter(p => p.category === selectedSection);

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    visible = visible.filter(p =>
      (p.title || '').toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q) ||
      (p.category || '').toLowerCase().includes(q)
    );
  }

  $('count').textContent = String(visible.length);
  if ($('mobile-list-count')) $('mobile-list-count').textContent = String(visible.length);
  $('project-list').replaceChildren();

  if (!visible.length) {
    const p = document.createElement('p');
    p.className = 'list-empty';
    p.textContent = searchQuery
      ? `Aucun résultat pour « ${searchQuery} ».`
      : (selectedSection === '__all__'
        ? 'Aucune publication pour le moment. Clique sur « ＋ Nouvelle publication » pour commencer.'
        : `Aucune publication dans la rubrique « ${selectedSection} ». Clique sur « ＋ Nouvelle publication » pour en ajouter une.`);
    $('project-list').append(p);
  }

  for (const item of visible) {
    const article = document.createElement('article');
    article.className = 'list-project' + (item.id === current ? ' selected' : '');

    // Haut de carte : tag type + rubrique
    const top = document.createElement('div');
    top.className = 'list-project-top';

    const tag = document.createElement('span');
    tag.className = 'list-type-tag';
    const icon = item.type === 'lecture' ? '📖' : item.type === 'foi' ? '✝' : '💻';
    tag.textContent = `${icon} ${item.type || 'projet'} · ${item.category || ''}`;
    top.append(tag);

    // Corps de carte : miniature + titre
    const body = document.createElement('div');
    body.className = 'list-project-body';

    if (item.image) {
      const img = document.createElement('img');
      img.className = 'list-thumbnail';
      img.src = item.image;
      img.alt = item.title;
      img.loading = 'lazy';
      body.append(img);
    } else {
      const ph = document.createElement('div');
      ph.className = 'list-thumbnail-placeholder';
      ph.textContent = icon;
      body.append(ph);
    }

    const info = document.createElement('div');
    info.className = 'list-info';

    const heading = document.createElement('h3');
    heading.textContent = item.title;

    const sub = document.createElement('div');
    sub.className = 'list-meta-sub';
    sub.textContent = item.bibleref || item.bibleRef || item.technologies || item.author || item.description || '';

    info.append(heading, sub);
    body.append(info);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'list-actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'btn-card-action';
    editBtn.innerHTML = '✏️ Modifier';
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!busy && approveDiscard()) edit(item, true);
    });

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'btn-card-action delete';
    delBtn.innerHTML = '🗑️ Supprimer';
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (busy || !approveDiscard()) return;
      pendingDelete = item.id;
      $('delete-description').textContent = `« ${item.title} » sera retiré du portfolio.`;
      $('delete-dialog').showModal();
      $('keep-project').focus();
    });

    actions.append(editBtn, delBtn);

    article.append(top, body, actions);
    article.addEventListener('click', () => {
      if (!busy && approveDiscard() && item.id !== current) {
        edit(item, false);
      }
    });

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
    ? 'Vue d’ensemble de toutes tes publications dans le portfolio.'
    : (section?.description || '');
  $('view-section').href = section ? `/rubriques/${section.slug}.html` : '/';
}

// Filtre recherche temps réel
const searchInput = $('project-search');
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim();
    renderList();
  });
}

// --- Chargement et sauvegarde avec Supabase en direct ---
async function fetchProjectsFromSources() {
  try {
    try {
      const local = await apiRequest('/api/projects');
      if (local?.revision) revision = local.revision;
    } catch {}

    const res = await fetch(`${SUPABASE_URL}/rest/v1/projects?select=*&order=created_at.asc`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        projects = data.map(row => {
          let doc = row.document || '';
          let det = row.details || '';
          const match = det.match(/\[DOC:([^\]]+)\]/);
          if (match) {
            if (!doc) doc = match[1].trim();
            det = det.replace(/\[DOC:[^\]]+\]/g, '').trim();
          }
          return {
            ...row,
            details: det,
            document: doc,
            imageAlt: row.imagealt || row.imageAlt || '',
            bookTitle: row.booktitle || row.bookTitle || '',
            bibleRef: row.bibleref || row.bibleRef || '',
            verseText: row.versetext || row.verseText || ''
          };
        });
      }
    } else {
      const local = await apiRequest('/api/projects');
      revision = local.revision || '';
      projects = local.projects || [];
    }

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
    message(`✓ Connecté à Supabase. ${projects.length} publications synchronisées !`, 'success');
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
      const dbRows = next.map(p => {
        let det = p.details || '';
        const doc = (p.document || '').trim();
        if (doc) {
          det = det.replace(/\[DOC:[^\]]+\]/g, '').trim();
          det = det ? `${det}\n\n[DOC:${doc}]` : `[DOC:${doc}]`;
        } else {
          det = det.replace(/\[DOC:[^\]]+\]/g, '').trim();
        }
        return {
          id: p.id,
          title: p.title || '',
          category: p.category || '',
          type: p.type || 'projet',
          description: p.description || '',
          details: det,
          technologies: p.technologies || '',
          site: p.site || '',
          demo: p.demo || '',
          github: p.github || '',
          image: p.image || '',
          imagealt: p.imageAlt || p.imagealt || '',
          artwork: p.artwork || '',
          author: p.author || '',
          booktitle: p.bookTitle || p.booktitle || '',
          quote: p.quote || '',
          bibleref: p.bibleRef || p.bibleref || '',
          versetext: p.verseText || p.versetext || ''
        };
      });

      const upRes = await fetch(`${SUPABASE_URL}/rest/v1/projects`, {
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
    console.warn('Supabase save warning:', e);
  }

  try {
    const apiRes = await apiRequest('/api/projects', {
      method: 'PUT',
      body: JSON.stringify({ revision, projects: next })
    });
    if (apiRes?.revision) revision = apiRes.revision;
  } catch (apiErr) {
    console.warn('Sync /api/projects warning:', apiErr);
    if (!savedToSupabase) throw apiErr;
  }

  projects = next;
  revision = String(Date.now());
  sections = SECTIONS.map(s => ({
    ...s,
    count: projects.filter(p => p.category === s.key).length
  }));
}

// Événements formulaire
form.addEventListener('input', () => {
  markDirty();
  renderPreview();
});

// Dropzone et sélection d'image
function handleFile(file) {
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
}

$('image-file').addEventListener('change', () => {
  handleFile($('image-file').files[0]);
});

const dropzone = $('dropzone');
if (dropzone) {
  ['dragenter', 'dragover'].forEach(name => {
    dropzone.addEventListener(name, (e) => {
      e.preventDefault();
      dropzone.classList.add('is-dragover');
    });
  });
  ['dragleave', 'drop'].forEach(name => {
    dropzone.addEventListener(name, (e) => {
      e.preventDefault();
      dropzone.classList.remove('is-dragover');
    });
  });
  dropzone.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  });
}

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
  message('⚡ Enregistrement et synchronisation en cours...');

  try {
    const docInput = $('document-file');
    const docFile = docInput?.files?.[0];
    if (docFile) {
      if (docFile.size > 25 * 1024 * 1024) {
        throw new Error('Le document PDF ne doit pas dépasser 25 Mo.');
      }
      message('⚡ Téléversement du document PDF sur Supabase Storage...');
      const cleanName = docFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `doc-${Date.now()}-${cleanName}`;
      const upRes = await fetch(`${SUPABASE_URL}/storage/v1/object/portfolio-media/${filename}`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/pdf'
        },
        body: docFile
      });
      if (upRes.ok) {
        $('document').value = `${SUPABASE_URL}/storage/v1/object/public/portfolio-media/${filename}`;
        docInput.value = '';
      } else {
        const errText = await upRes.text().catch(() => '');
        throw new Error(`Échec de téléversement du PDF : ${errText || upRes.statusText}`);
      }
    }

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
        console.warn('Supabase storage upload failed:', e);
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
    if (window.innerWidth <= 850) setMobileView('list');
    message('✓ Publication enregistrée et synchronisée avec Supabase !', 'success');
  } catch (err) {
    message(`Erreur : ${err.message}`, 'error');
    renderPreview();
  } finally {
    lock(false);
  }
});

$('new-project').addEventListener('click', () => {
  if (approveDiscard()) {
    edit(null, true);
    setMobileView('editor');
  }
});

$('cancel').addEventListener('click', () => {
  if (approveDiscard()) edit(projects.find(p => p.id === current));
});

$('reload').addEventListener('click', () => {
  if (approveDiscard()) fetchProjectsFromSources();
});

// Suppression et annulation
$('confirm-delete').addEventListener('click', async () => {
  if (!pendingDelete) return;
  const targetId = pendingDelete;
  $('delete-dialog').close();
  lock(true);
  message('Suppression en cours...');

  try {
    const prev = projects;
    const removed = projects.find(p => p.id === targetId);
    const next = projects.filter(p => p.id !== targetId);

    await persist(next);
    undo = { project: removed, previous: prev };
    $('undo').hidden = false;
    edit(null);
    message(`« ${removed?.title} » a été supprimé.`, 'success');
  } catch (err) {
    message(`Erreur de suppression : ${err.message}`, 'error');
  } finally {
    pendingDelete = null;
    lock(false);
  }
});

$('keep-project').addEventListener('click', () => {
  $('delete-dialog').close();
  pendingDelete = null;
});

$('undo').addEventListener('click', async () => {
  if (!undo || busy || !approveDiscard()) return;
  lock(true);
  message('Restauration en cours...');
  try {
    const toRestore = undo.project;
    const next = [...projects, toRestore];
    await persist(next);
    undo = null;
    $('undo').hidden = true;
    edit(toRestore);
    message('✓ Publication restaurée avec succès !', 'success');
  } catch (err) {
    message(`Erreur de restauration : ${err.message}`, 'error');
  } finally {
    lock(false);
  }
});

// Initialisation
window.addEventListener('beforeunload', (e) => {
  if (dirty) {
    e.preventDefault();
    e.returnValue = '';
  }
});

checkAuth().then(ok => {
  if (ok) fetchProjectsFromSources();
});

const docFileInput = $('document-file');
if (docFileInput) {
  docFileInput.addEventListener('change', () => {
    const file = docFileInput.files[0];
    const status = $('doc-upload-status');
    const labelText = $('doc-upload-text');
    if (file) {
      if (file.type !== 'application/pdf') {
        docFileInput.value = '';
        if (status) {
          status.className = 'doc-upload-status';
          status.textContent = 'Veuillez sélectionner un fichier PDF valide.';
          status.hidden = false;
        }
        return;
      }
      if (labelText) labelText.textContent = file.name.length > 20 ? file.name.slice(0, 17) + '...' : file.name;
      if (status) {
        status.className = 'doc-upload-status ready';
        status.textContent = `✓ « ${file.name} » prêt à être téléversé (${(file.size / 1024 / 1024).toFixed(1)} Mo)`;
        status.hidden = false;
      }
      markDirty();
    } else {
      if (labelText) labelText.textContent = 'Téléverser PDF';
      if (status) status.hidden = true;
    }
  });
}

function syncTypeFromCategory() {
  const cat = ($('category')?.value || '').trim().toLowerCase();
  if (cat === 'lectures' || cat.startsWith('lecture') || cat.startsWith('livre')) {
    setPublicationType('lecture');
  } else if (cat === 'foi' || cat.startsWith('foi') || cat.includes('bible')) {
    setPublicationType('foi');
  } else if (cat === 'article') {
    setPublicationType('article');
  } else if (['actuariat & data', 'web', 'programmation', 'ia', 'intelligence artificielle', 'sciences actuarielles'].includes(cat)) {
    setPublicationType('projet');
  }
}

if ($('category')) {
  $('category').addEventListener('input', syncTypeFromCategory);
  $('category').addEventListener('change', syncTypeFromCategory);
}

// ==========================================================================
// Assistant Biblique Intégré (Louis Segond 1910 & Parole de Vie 2017)
// ==========================================================================

const BIBLE_BOOKS = {
  'genese': 1, 'gen': 1, 'gn': 1,
  'exode': 2, 'ex': 2,
  'levitique': 3, 'lev': 3, 'lv': 3,
  'nombres': 4, 'nb': 4,
  'deuteronome': 5, 'dt': 5, 'deut': 5,
  'josue': 6, 'jos': 6,
  'juges': 7, 'jug': 7, 'jg': 7,
  'ruth': 8, 'rt': 8,
  '1 samuel': 9, '1samuel': 9, '1s': 9, '1sam': 9,
  '2 samuel': 10, '2samuel': 10, '2s': 10, '2sam': 10,
  '1 rois': 11, '1rois': 11, '1r': 11,
  '2 rois': 12, '2rois': 12, '2r': 12,
  '1 chroniques': 13, '1ch': 13, '1chr': 13,
  '2 chroniques': 14, '2ch': 14, '2chr': 14,
  'esdras': 15, 'esd': 15,
  'nehemie': 16, 'neh': 16,
  'esther': 17, 'est': 17,
  'job': 18, 'jb': 18,
  'psaumes': 19, 'psaume': 19, 'ps': 19, 'psm': 19,
  'proverbes': 20, 'prov': 20, 'pr': 20,
  'ecclesiaste': 21, 'eccl': 21, 'ecc': 21,
  'cantique': 22, 'cantique des cantiques': 22, 'ct': 22,
  'esaie': 23, 'es': 23, 'is': 23,
  'jeremie': 24, 'jer': 24,
  'lamentations': 25, 'lam': 25,
  'ezekiel': 26, 'ez': 26,
  'daniel': 27, 'dan': 27, 'dn': 27,
  'osee': 28, 'os': 28,
  'joel': 29, 'jl': 29,
  'amos': 30, 'am': 30,
  'abdias': 31, 'ab': 31,
  'jonas': 32, 'jon': 32,
  'michee': 33, 'mic': 33,
  'nahum': 34, 'nah': 34,
  'habacuc': 35, 'hab': 35,
  'sophonie': 36, 'so': 36,
  'aggee': 37, 'ag': 37,
  'zacharie': 38, 'zac': 38,
  'malachie': 39, 'mal': 39,
  'matthieu': 40, 'mat': 40, 'mt': 40,
  'marc': 41, 'mc': 41,
  'luc': 42, 'lc': 42,
  'jean': 43, 'jn': 43,
  'actes': 44, 'act': 44, 'ac': 44,
  'romains': 45, 'rom': 45, 'rm': 45,
  '1 corinthiens': 46, '1cor': 46, '1co': 46,
  '2 corinthiens': 47, '2cor': 47, '2co': 47,
  'galates': 48, 'gal': 48, 'ga': 48,
  'ephesiens': 49, 'eph': 49,
  'philippiens': 50, 'phil': 50, 'ph': 50,
  'colossiens': 51, 'col': 51,
  '1 thessaloniciens': 52, '1th': 52, '1thess': 52,
  '2 thessaloniciens': 53, '2th': 53, '2thess': 53,
  '1 timothee': 54, '1tim': 54, '1tm': 54,
  '2 timothee': 55, '2tim': 55, '2tm': 55,
  'tite': 56, 'tt': 56,
  'philemon': 57, 'phm': 57,
  'hebreux': 58, 'heb': 58,
  'jacques': 59, 'jac': 59, 'jc': 59,
  '1 pierre': 60, '1pi': 60, '1p': 60,
  '2 pierre': 61, '2pi': 61, '2p': 61,
  '1 jean': 62, '1jn': 62, '1j': 62,
  '2 jean': 63, '2jn': 63, '2j': 63,
  '3 jean': 64, '3jn': 64, '3j': 64,
  'jude': 65, 'jud': 65,
  'apocalypse': 66, 'apoc': 66, 'ap': 66
};

let activeBibleVersion = 'FRLSG'; // FRLSG ou FRPDV17

function parseBibleRef(raw) {
  if (!raw) return null;
  const clean = raw.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  // Match format: 1 jean 3:16, psaumes 23:1-4, romains 8:28, jean 3 16
  const regex = /^([1-3]?\s*[a-z]+)\s*(\d+)[\s:;,.]+(\d+)(?:\s*[-–]\s*(\d+))?$/;
  const match = clean.match(regex);
  if (match) {
    const bookStr = match[1].trim();
    const bookId = BIBLE_BOOKS[bookStr];
    if (!bookId) return null;
    const chapter = parseInt(match[2], 10);
    const startVerse = parseInt(match[3], 10);
    const endVerse = match[4] ? parseInt(match[4], 10) : startVerse;
    return { bookId, chapter, startVerse, endVerse };
  }
  // Chapter only (ex: psaume 23)
  const regexCh = /^([1-3]?\s*[a-z]+)\s*(\d+)$/;
  const matchCh = clean.match(regexCh);
  if (matchCh) {
    const bookId = BIBLE_BOOKS[matchCh[1].trim()];
    if (!bookId) return null;
    return { bookId, chapter: parseInt(matchCh[2], 10), startVerse: 1, endVerse: 999 };
  }
  return null;
}

async function fetchBibleVerses(translation, bookId, chapter, startVerse, endVerse) {
  const url = `https://bolls.life/get-chapter/${translation}/${bookId}/${chapter}/`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Impossible de contacter l'API Biblique (${res.status})`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error('Format de réponse invalide');

  const selected = data.filter(v => v.verse >= startVerse && v.verse <= endVerse);
  if (!selected.length) throw new Error(`Verset introuvable dans le chapitre ${chapter}.`);

  return selected.map(v => v.text.replace(/<[^>]+>/g, '').trim()).join(' ');
}

// Gestion des boutons de version
document.querySelectorAll('.bible-ver-pill').forEach(btn => {
  btn.addEventListener('click', () => {
    activeBibleVersion = btn.dataset.ver;
    document.querySelectorAll('.bible-ver-pill').forEach(b => {
      const active = b === btn;
      b.classList.toggle('active', active);
      b.setAttribute('aria-pressed', String(active));
    });
  });
});

// Bouton Insérer le verset
const bibleFetchBtn = $('bible-fetch-btn');
if (bibleFetchBtn) {
  bibleFetchBtn.addEventListener('click', async () => {
    const refInput = $('bibleRef');
    const status = $('bible-status');
    const ref = refInput?.value?.trim();
    if (!ref) {
      if (status) {
        status.className = 'bible-status error';
        status.textContent = 'Indique d’abord une référence (ex. Jean 3:16 ou Psaumes 23:1-3).';
        status.hidden = false;
      }
      return;
    }

    const parsed = parseBibleRef(ref);
    if (!parsed) {
      if (status) {
        status.className = 'bible-status error';
        status.textContent = `Référence non reconnue. Exemple valide : « Jean 3:16 » ou « Psaumes 23:1-3 ».`;
        status.hidden = false;
      }
      return;
    }

    if (status) {
      status.className = 'bible-status loading';
      status.textContent = `⚡ Recherche du verset dans ${activeBibleVersion === 'FRLSG' ? 'Louis Segond 1910' : 'Parole de Vie 2017'}...`;
      status.hidden = false;
    }

    try {
      const text = await fetchBibleVerses(activeBibleVersion, parsed.bookId, parsed.chapter, parsed.startVerse, parsed.endVerse);
      $('verseText').value = text;
      markDirty();
      renderPreview();
      if (status) {
        const verLabel = activeBibleVersion === 'FRLSG' ? 'Segond 1910' : 'Parole de Vie 2017';
        status.className = 'bible-status success';
        status.textContent = `✓ Verset inséré avec succès (${verLabel}) !`;
        status.hidden = false;
      }
    } catch (err) {
      if (status) {
        status.className = 'bible-status error';
        status.textContent = `Erreur : ${err.message}`;
        status.hidden = false;
      }
    }
  });
}

// Bouton Comparer LSG & PDV
const bibleCompareBtn = $('bible-compare-btn');
const compareDrawer = $('bible-compare-drawer');
if (bibleCompareBtn && compareDrawer) {
  bibleCompareBtn.addEventListener('click', async () => {
    const ref = $('bibleRef')?.value?.trim();
    const status = $('bible-status');
    if (!ref) {
      if (status) {
        status.className = 'bible-status error';
        status.textContent = 'Indique une référence biblique à comparer.';
        status.hidden = false;
      }
      return;
    }

    const parsed = parseBibleRef(ref);
    if (!parsed) {
      if (status) {
        status.className = 'bible-status error';
        status.textContent = 'Référence invalide pour la comparaison.';
        status.hidden = false;
      }
      return;
    }

    compareDrawer.hidden = false;
    $('compare-text-lsg').textContent = 'Chargement de Louis Segond...';
    $('compare-text-pdv').textContent = 'Chargement de Parole de Vie...';

    try {
      const [lsg, pdv] = await Promise.all([
        fetchBibleVerses('FRLSG', parsed.bookId, parsed.chapter, parsed.startVerse, parsed.endVerse),
        fetchBibleVerses('FRPDV17', parsed.bookId, parsed.chapter, parsed.startVerse, parsed.endVerse)
      ]);
      $('compare-text-lsg').textContent = lsg;
      $('compare-text-pdv').textContent = pdv;
    } catch (err) {
      $('compare-text-lsg').textContent = `Erreur : ${err.message}`;
      $('compare-text-pdv').textContent = `Erreur : ${err.message}`;
    }
  });

  const closeCompare = $('close-compare-drawer');
  if (closeCompare) closeCompare.addEventListener('click', () => { compareDrawer.hidden = true; });

  document.querySelectorAll('.use-ver-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.target;
      const text = target === 'FRLSG' ? $('compare-text-lsg').textContent : $('compare-text-pdv').textContent;
      if (text && !text.startsWith('Erreur') && !text.startsWith('Chargement')) {
        $('verseText').value = text;
        activeBibleVersion = target;
        document.querySelectorAll('.bible-ver-pill').forEach(b => {
          const active = b.dataset.ver === target;
          b.classList.toggle('active', active);
          b.setAttribute('aria-pressed', String(active));
        });
        compareDrawer.hidden = true;
        markDirty();
        renderPreview();
        const status = $('bible-status');
        if (status) {
          status.className = 'bible-status success';
          status.textContent = `✓ Version ${target === 'FRLSG' ? 'Segond 1910' : 'Parole de Vie 2017'} sélectionnée et insérée !`;
          status.hidden = false;
        }
      }
    });
  });
}

// ==========================================================================
// Mode Sombre Éditorial — Atelier Admin
// ==========================================================================
function applyAdminTheme(theme) {
  const isDark = theme === 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem('bm_theme', theme); } catch {}

  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) metaTheme.setAttribute('content', isDark ? '#141712' : '#f6f3ea');

  const desktopBtn = $('theme-toggle');
  const desktopIcon = $('theme-toggle-icon');
  const desktopText = $('theme-toggle-text');
  if (desktopBtn) {
    desktopBtn.setAttribute('title', isDark ? 'Passer au mode clair' : 'Passer au mode sombre');
    desktopBtn.setAttribute('aria-label', isDark ? 'Passer au mode clair' : 'Passer au mode sombre');
  }
  if (desktopIcon) desktopIcon.textContent = isDark ? '☀️' : '🌙';
  if (desktopText) desktopText.textContent = isDark ? 'Clair' : 'Sombre';

  const mobileBtn = $('theme-toggle-mobile');
  if (mobileBtn) {
    mobileBtn.textContent = isDark ? '☀️' : '🌙';
    mobileBtn.setAttribute('title', isDark ? 'Passer au mode clair' : 'Passer au mode sombre');
    mobileBtn.setAttribute('aria-label', isDark ? 'Passer au mode clair' : 'Passer au mode sombre');
  }

  const dropdownIcon = $('mobile-dropdown-theme-icon');
  const dropdownText = $('mobile-dropdown-theme-text');
  if (dropdownIcon) dropdownIcon.textContent = isDark ? '☀️' : '🌙';
  if (dropdownText) dropdownText.textContent = isDark ? 'Passer au mode clair' : 'Passer au mode sombre';
}

function initAdminTheme() {
  let savedTheme = 'light';
  try {
    savedTheme = localStorage.getItem('bm_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  } catch {}
  applyAdminTheme(savedTheme);

  const toggleHandler = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyAdminTheme(nextTheme);
  };

  const desktopBtn = $('theme-toggle');
  if (desktopBtn) desktopBtn.addEventListener('click', toggleHandler);

  const mobileBtn = $('theme-toggle-mobile');
  if (mobileBtn) mobileBtn.addEventListener('click', toggleHandler);

  const dropdownBtn = $('mobile-theme-toggle');
  if (dropdownBtn) {
    dropdownBtn.addEventListener('click', () => {
      toggleHandler();
      const mobileDropdown = $('mobile-dropdown-menu');
      if (mobileDropdown) mobileDropdown.hidden = true;
    });
  }

  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      try {
        if (!localStorage.getItem('bm_theme')) {
          applyAdminTheme(e.matches ? 'dark' : 'light');
        }
      } catch {}
    });
  }

  window.addEventListener('storage', (e) => {
    if (e.key === 'bm_theme' && e.newValue) {
      applyAdminTheme(e.newValue);
    }
  });
}

initAdminTheme();

