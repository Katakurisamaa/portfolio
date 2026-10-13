'use strict';

const $ = id => document.getElementById(id);
const form = $('editor');
const allFields = [
  'title', 'category', 'type', 'description', 'details',
  'technologies', 'site', 'demo', 'github', 'imageAlt',
  'author', 'bookTitle', 'quote', 'bibleRef', 'verseText'
];

let sections = [], selectedSection = 'Actuariat & data';
let projects = [], revision = '', token = '';
let current = null, dirty = false, busy = false;
let imagePath = '', imageFile = null, imageURL = '', artwork = '';
let undo = null, pendingDelete = null;

// --- Gestion des requêtes sécurisées ---
async function apiRequest(url, options = {}) {
  const customGhToken = localStorage.getItem('bm_github_token') || '';
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(customGhToken ? { 'X-GitHub-Token': customGhToken } : {}),
    ...options.headers
  };
  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) {
      showLogin(true, 'Session expirée. Reconnecte-toi.');
    }
    throw new Error(data.error || `Erreur (${response.status})`);
  }
  return data;
}

const message = (text, kind = '') => {
  $('message').textContent = text;
  $('message').className = `message ${kind}`;
};

function lock(value) {
  busy = value;
  $('fields').disabled = value || !revision;
  $('new-project').disabled = value || !revision;
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

// --- Authentification ---
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
  try {
    const res = await apiRequest('/api/auth/status');
    if (res.authenticated) {
      showLogin(false);
      if (res.defaultPasswordUsed) {
        $('default-pw-hint').hidden = false;
      }
      return true;
    }
  } catch {
    // Non authentifié
  }
  showLogin(true);
  return false;
}

// Connexion
$('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const password = $('login-password').value;
  $('login-btn').disabled = true;
  $('login-error').hidden = true;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Mot de passe incorrect.');

    token = data.token;
    localStorage.setItem('bm_admin_token', token);
    showLogin(false);
    if (data.defaultPasswordUsed) {
      $('default-pw-hint').hidden = false;
    }
    load();
  } catch (err) {
    $('login-error').hidden = false;
    $('login-error').textContent = err.message;
  } finally {
    $('login-btn').disabled = false;
  }
});

// Déconnexion
$('logout-btn').addEventListener('click', async () => {
  if (!approveDiscard()) return;
  try { await apiRequest('/api/auth/logout', { method: 'POST' }); } catch {}
  localStorage.removeItem('bm_admin_token');
  sessionStorage.removeItem('bm_admin_token');
  token = '';
  showLogin(true, 'Déconnecté avec succès.');
});

// Afficher / masquer le mot de passe
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
    await apiRequest('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    });
    $('change-pw-dialog').close();
    $('default-pw-hint').hidden = true;
    message('Mot de passe mis à jour avec succès.', 'success');
  } catch (err) {
    $('change-pw-error').hidden = false;
    $('change-pw-error').textContent = err.message;
  } finally {
    $('confirm-change-pw').disabled = false;
  }
});

// --- Sélecteur de type de publication ---
function setPublicationType(type) {
  $('type').value = type;
  document.querySelectorAll('.type-pill').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === type);
  });

  // Basculer les groupes de champs spécifiques
  $('fields-projet').hidden = (type !== 'projet');
  $('fields-lecture').hidden = (type !== 'lecture');
  $('fields-foi').hidden = (type !== 'foi');

  // Ajuster les libellés contextuels
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

  // En-tête de carte (Meta)
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

  // Visuel / Image
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

  // Liens pour projets
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

// --- Édition et liste ---
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
    $('category').value = selectedSection;
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
  const visible = projects.filter(p => p.category === selectedSection);
  $('count').textContent = String(visible.length);
  $('project-list').replaceChildren();

  if (!visible.length) {
    const p = document.createElement('p');
    p.className = 'list-empty';
    p.textContent = 'Aucune publication dans cette rubrique pour le moment. Clique sur « Nouvelle publication » pour commencer.';
    $('project-list').append(p);
  }

  for (const item of visible) {
    const article = document.createElement('article');
    article.className = 'list-project' + (item.id === current ? ' selected' : '');

    const top = document.createElement('div');
    top.className = 'list-project-top';
    const tag = document.createElement('span');
    tag.className = 'list-type-tag';
    tag.textContent = item.type === 'lecture' ? '📖 Lecture' : item.type === 'foi' ? '✝ Foi' : '🚀 Projet';
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

  // Datalist des rubriques
  const categories = [...new Set([...sections.map(s => s.key), ...projects.map(p => p.category)])];
  $('categories').replaceChildren(...categories.map(c => {
    const opt = document.createElement('option');
    opt.value = c;
    return opt;
  }));
}

function renderSections() {
  $('section-tabs').replaceChildren();
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
  $('section-title').textContent = section?.title || selectedSection;
  $('section-description').textContent = section?.description || '';
  $('view-section').href = section ? `/rubriques/${section.slug}.html` : '/';
}

// --- Chargement et sauvegarde ---
async function load() {
  lock(true);
  try {
    const isAuthed = await checkAuth();
    if (!isAuthed) return;

    const data = await apiRequest('/api/projects');
    projects = data.projects;
    revision = data.revision;
    sections = data.sections || [];

    if (!sections.some(s => s.key === selectedSection)) {
      selectedSection = sections[0]?.key || 'Actuariat & data';
    }
    undo = null;
    $('undo').hidden = true;
    edit();
    message('Tes publications sont synchronisées. Tout est prêt !');
  } catch (err) {
    message(`Erreur de chargement : ${err.message}`, 'error');
  } finally {
    lock(false);
  }
}

async function persist(next) {
  const data = await apiRequest('/api/projects', {
    method: 'PUT',
    body: JSON.stringify({ revision, projects: next })
  });
  projects = data.projects;
  revision = data.revision;
  sections = data.sections || [];
}

// --- Gestionnaires d'événements formulaire ---
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
      const data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = () => reject(new Error('Impossible de lire cette image.'));
        reader.readAsDataURL(imageFile);
      });
      imagePath = (await apiRequest('/api/upload', {
        method: 'POST',
        body: JSON.stringify({ data })
      })).path;
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
    message('Publication enregistrée et mise en ligne immédiatement !', 'success');
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
    message('Publication retirée. Tu peux annuler la suppression si besoin.', 'success');
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

window.addEventListener('beforeunload', e => {
  if (dirty) { e.preventDefault(); e.returnValue = ''; }
});

// Démarrage
load();


// --- Synchronisation en ligne & Token GitHub ---
function updateSyncDialogStatus() {
  const savedToken = localStorage.getItem('bm_github_token') || '';
  if (savedToken) {
    const preview = savedToken.slice(0, 4) + '...' + savedToken.slice(-4);
    $('sync-token-status').textContent = `Token configur? sur ce smartphone (${preview}). Pr?t pour enregistrer et supprimer en ligne !`;
    $('custom-github-token').value = savedToken;
  } else {
    $('sync-token-status').textContent = 'Aucun token stock? sur cet appareil. Les variables Vercel sont utilis?es si configur?es.';
    $('custom-github-token').value = '';
  }
}

$('open-sync-dialog')?.addEventListener('click', () => {
  updateSyncDialogStatus();
  $('sync-dialog').showModal();
});
$('close-sync-dialog')?.addEventListener('click', () => $('sync-dialog').close());

$('save-github-token')?.addEventListener('click', () => {
  const val = $('custom-github-token').value.trim();
  if (!val) {
    message('Entre un token GitHub valide.', 'error');
    return;
  }
  localStorage.setItem('bm_github_token', val);
  updateSyncDialogStatus();
  message('Token GitHub m?moris? sur ce smartphone !', 'success');
});

$('clear-github-token')?.addEventListener('click', () => {
  localStorage.removeItem('bm_github_token');
  $('custom-github-token').value = '';
  updateSyncDialogStatus();
  message('Token effac? de ce smartphone.', 'success');
});
