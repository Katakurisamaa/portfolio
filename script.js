'use strict';

const SUPABASE_URL = 'https://yvrtpioalszmefypdfsy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2cnRwaW9hbHN6bWVmeXBkZnN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4ODk3NTksImV4cCI6MjEwNzQ2NTc1OX0.WECsQoXXtIrymJanEZqhCw1mZvVnOKkNRrU-9P0SrAs';

// Menu mobile
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
const mobile = window.matchMedia('(max-width: 760px)');
menuButton.hidden = false;

function setMenu(open) {
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.querySelector('span').textContent = open ? '−' : '＋';
  navigation.hidden = mobile.matches && !open;
}
setMenu(false);
menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
mobile.addEventListener('change', () => setMenu(false));
navigation.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && mobile.matches && menuButton.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    menuButton.focus();
  }
});

// Filtres de catégories
let projects = [];
function initFilters() {
  const filters = document.querySelector('.filters');
  projects = [...document.querySelectorAll('.project')];
  if (!filters) return;

  filters.replaceChildren();
  const categories = [...new Set(projects.map(project => project.dataset.category).filter(Boolean))];
  const allFilter = document.createElement('button');
  allFilter.type = 'button';
  allFilter.className = 'filter active';
  allFilter.textContent = `Tout explorer · ${projects.length}`;
  allFilter.dataset.filter = '';
  allFilter.setAttribute('aria-pressed', 'true');
  filters.append(allFilter);

  categories.forEach(category => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'filter';
    button.dataset.filter = category;
    button.textContent = category;
    button.setAttribute('aria-pressed', 'false');
    filters.append(button);
  });

  filters.hidden = projects.length === 0 || !!document.body.dataset.rubrique;
}

const filtersContainer = document.querySelector('.filters');
if (filtersContainer) {
  filtersContainer.addEventListener('click', event => {
    const button = event.target.closest('[data-filter]');
    if (!button) return;
    filtersContainer.querySelectorAll('button').forEach(item => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-pressed', String(active));
    });
    projects.forEach(project => {
      project.hidden = !!button.dataset.filter && project.dataset.category !== button.dataset.filter;
      project.classList.remove('is-pending');
    });
    const count = projects.filter(project => !project.hidden).length;
    const status = document.querySelector('#filter-status');
    if (status) status.textContent = `${count} projet${count > 1 ? 's' : ''} affiché${count > 1 ? 's' : ''}.`;
  });
}
initFilters();

// Copie d'email
const copyButton = document.querySelector('#copy-email');
if (copyButton) {
  copyButton.hidden = false;
  copyButton.addEventListener('click', async () => {
    const status = document.querySelector('#copy-status');
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText('minkojunior400@gmail.com');
      status.textContent = 'Adresse copiée. À bientôt !';
    } catch {
      status.textContent = 'La copie est indisponible. Sélectionne l’adresse ci-dessus ou clique dessus pour écrire.';
    }
  });
}

const yearSpan = document.querySelector('#year');
if (yearSpan) yearSpan.textContent = new Date().getFullYear();

// Animations d'apparition
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let observerInstance = null;
function initObserver() {
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    if (observerInstance) observerInstance.disconnect();
    observerInstance = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('is-pending');
          observerInstance.unobserve(entry.target);
        }
      });
    }, { threshold: 0.06 });

    document.querySelectorAll('.reveal').forEach(element => {
      if (element.getBoundingClientRect().top > window.innerHeight) {
        element.classList.add('is-pending');
        observerInstance.observe(element);
      }
    });
  }
}
initObserver();
reducedMotion.addEventListener('change', event => {
  if (event.matches && observerInstance) {
    observerInstance.disconnect();
    document.querySelectorAll('.is-pending').forEach(element => element.classList.remove('is-pending'));
  }
});

// --- Rendu HTML polymorphe dynamique pour Supabase ---
function escapeHTML(str) {
  return String(str || '').replace(/[&<>'"]/g, tag => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  }[tag] || tag));
}

function renderCard(p, n, total) {
  const e = k => escapeHTML(p[k] || '');
  const ptype = p.type || (p.category === 'Lectures' ? 'lecture' : p.category === 'Foi' ? 'foi' : 'projet');
  let imageHTML = '';

  if (p.image) {
    const alt = escapeHTML(p.imageAlt || p.imagealt || p.title || '');
    imageHTML = `<img class="project-image" src="${e('image')}" alt="${alt}" loading="lazy" width="800" height="500">`;
  } else if (ptype === 'lecture') {
    const book = e('bookTitle') || e('booktitle') || e('title');
    const author = e('author') || 'Lecture';
    imageHTML = `<div class="project-art reading-art" aria-hidden="true"><span class="art-label">LECTURE & IDÉE</span><div class="reading-card-inner"><strong>${book}</strong><span>${author}</span></div></div>`;
  } else if (ptype === 'foi') {
    const ref = e('bibleRef') || e('bibleref') || 'Méditation';
    imageHTML = `<div class="project-art faith-art" aria-hidden="true"><span class="art-label">FOI & PAROLE</span><div class="faith-card-inner"><i>✦</i><strong>${ref}</strong></div></div>`;
  } else {
    const initial = escapeHTML((p.title || 'PR').slice(0, 2).toUpperCase());
    imageHTML = `<div class="project-art project-placeholder" aria-hidden="true"><strong>${initial}</strong><span>${e('category')}</span></div>`;
  }

  let bodyExtra = '';
  let metaLabel = '';
  let metaSub = '';
  let detailsLabel = 'Dans les coulisses';

  if (ptype === 'lecture') {
    metaLabel = `${String(n).padStart(2, '0')} — Lecture`;
    metaSub = e('author') || 'Partage';
    if (p.quote) bodyExtra += `<blockquote class="reading-quote">« ${e('quote')} »</blockquote>`;
    if (p.document) bodyExtra += `<div class="project-links"><button type="button" class="project-doc-btn" data-doc="${e('document')}" data-doc-title="${e('title')}">Lire la note de lecture ↗</button></div>`;
    detailsLabel = 'Note de lecture & réflexions';
  } else if (ptype === 'foi') {
    metaLabel = `${String(n).padStart(2, '0')} — Foi & Bible`;
    const refVal = p.bibleRef || p.bibleref || '';
    metaSub = escapeHTML(refVal) || 'Partage';
    const verseVal = p.verseText || p.versetext || '';
    if (verseVal) {
      const refSpan = refVal ? `<span class="verse-ref">${escapeHTML(refVal)}</span>` : '';
      bodyExtra += `<blockquote class="faith-quote">${refSpan}« ${escapeHTML(verseVal)} »</blockquote>`;
    }
    if (p.document) bodyExtra += `<div class="project-links"><button type="button" class="project-doc-btn" data-doc="${e('document')}" data-doc-title="${e('title')}">Lire le partage ↗</button></div>`;
    detailsLabel = 'Méditation & partage';
  } else {
    metaLabel = `${String(n).padStart(2, '0')} — ${e('category')}`;
    metaSub = e('technologies');
    const links = [];
    if (p.site) links.push(`<a href="${e('site')}" target="_blank" rel="noopener noreferrer">Voir le site ↗<span class="sr-only"> (nouvel onglet)</span></a>`);
    if (p.demo) links.push(`<a href="${e('demo')}" target="_blank" rel="noopener noreferrer">Essayer la démo ↗<span class="sr-only"> (nouvel onglet)</span></a>`);
    if (p.github) links.push(`<a href="${e('github')}" target="_blank" rel="noopener noreferrer">Code source ↗<span class="sr-only"> (nouvel onglet)</span></a>`);
    if (p.document) links.push(`<button type="button" class="project-doc-btn" data-doc="${e('document')}" data-doc-title="${e('title')}">Lire le document d’étude ↗</button>`);
    if (links.length) bodyExtra += `<div class="project-links">${links.join('')}</div>`;
  }

  const details = p.details ? `<details><summary>${detailsLabel} <span aria-hidden="true">+</span></summary><div class="detail-body">${e('details')}</div></details>` : '';
  const body = `<div class="project-meta"><span>${metaLabel}</span><span>${metaSub}</span></div><h3>${e('title')}</h3><p>${e('description')}</p>${bodyExtra}${details}`;

  const wide = (n === total && total % 2 === 1 && total > 1);
  return `<article class="project${wide ? ' project-wide' : ''} reveal" data-category="${e('category')}">${imageHTML}${wide ? '<div class="wide-copy">' : ''}${body}${wide ? '</div>' : ''}</article>`;
}

// --- Synchronisation dynamique en direct avec Supabase ---
async function syncLiveFromSupabase() {
  try {
    let items = null;
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/projects?select=*&order=created_at.asc`, {
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
      });
      if (res.ok) items = await res.json();
    } catch {}

    if (!items) {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const d = await res.json();
        items = d.projects || [];
      }
    }

    if (!Array.isArray(items)) return;

    items = items.map(r => {
      let doc = r.document || '';
      let det = r.details || '';
      const match = det.match(/\[DOC:([^\]]+)\]/);
      if (match) {
        if (!doc) doc = match[1].trim();
        det = det.replace(/\[DOC:[^\]]+\]/g, '').trim();
      }
      return {
        ...r,
        details: det,
        document: doc,
        imageAlt: r.imagealt || r.imageAlt || '',
        bookTitle: r.booktitle || r.bookTitle || '',
        bibleRef: r.bibleref || r.bibleRef || '',
        verseText: r.versetext || r.verseText || ''
      };
    });

    const currentRubrique = document.body.dataset.rubrique;
    const projectsContainer = document.querySelector('.projects');
    if (!projectsContainer) return;

    let displayItems = items;
    if (currentRubrique) {
      if (currentRubrique === '__all__') {
        displayItems = items.filter(p => !['Lectures', 'Foi'].includes(p.category));
      } else {
        displayItems = items.filter(p => p.category === currentRubrique);
      }
    }

    const existingCards = projectsContainer.querySelectorAll('.project');
    const existingTitles = [...existingCards].map(c => c.querySelector('h3')?.textContent?.trim()).filter(Boolean);
    const newTitles = displayItems.map(p => (p.title || '').trim());
    const isSame = existingTitles.length === newTitles.length && existingTitles.every((t, i) => t === newTitles[i]);
    if (isSame) return;

    if (displayItems.length === 0) {
      projectsContainer.innerHTML = '<p class="empty-projects">De nouvelles explorations arrivent bientôt.</p>';
    } else {
      projectsContainer.innerHTML = displayItems.map((p, idx) => renderCard(p, idx + 1, displayItems.length)).join('\n');
    }

    initFilters();
    if (currentRubrique) {
      const isPartage = ['Lectures', 'Foi'].includes(currentRubrique);
      const countLabel = `${displayItems.length} ${isPartage ? 'partage' : 'projet'}${displayItems.length > 1 ? 's' : ''}`;
      const eyebrow = document.querySelector('.rubric-heading .eyebrow');
      if (eyebrow) eyebrow.textContent = `MON UNIVERS / ${countLabel.toUpperCase()}`;
      const h2Count = document.querySelector('.rubric-content h2 span');
      if (h2Count) h2Count.textContent = String(displayItems.length).padStart(2, '0');
    }
    initObserver();
  } catch (err) {
    console.warn('Sync direct Supabase info:', err);
  }
}
syncLiveFromSupabase();

// --- Liseuse intégrée de documents d'étude & recherche (Lecture seule sécurisée) ---
const docModal = document.querySelector('#doc-viewer-modal');
if (docModal) {
  const docFrame = document.querySelector('#doc-viewer-frame');
  const docTitle = document.querySelector('#doc-viewer-title');
  const docLoading = document.querySelector('#doc-viewer-loading');
  const closeBtn = document.querySelector('#close-doc-viewer');
  const modeToggle = document.querySelector('#doc-viewer-mode-toggle');
  let currentDocUrl = '';
  let viewerMode = 'optimized';

  function computeViewerUrl(rawUrl, mode) {
    if (!rawUrl) return 'about:blank';
    if (rawUrl.includes('drive.google.com')) {
      return rawUrl.replace(/\/view(\?.*)?$/, '/preview');
    }
    if (mode === 'optimized') {
      return `https://docs.google.com/viewer?url=${encodeURIComponent(rawUrl)}&embedded=true`;
    }
    const sep = rawUrl.includes('#') ? '&' : '#';
    return `${rawUrl}${sep}toolbar=0&navpanes=0&scrollbar=1`;
  }

  function loadDoc(url, title) {
    currentDocUrl = url;
    if (docTitle) docTitle.textContent = title || 'Document d’étude';
    if (docLoading) docLoading.hidden = false;
    if (docFrame) {
      docFrame.src = computeViewerUrl(currentDocUrl, viewerMode);
      docFrame.onload = () => {
        if (docLoading) docLoading.hidden = true;
      };
    }
    if (modeToggle) {
      modeToggle.textContent = viewerMode === 'optimized' ? 'Vue directe' : 'Vue optimisée';
    }
    if (typeof docModal.showModal === 'function') {
      try { docModal.showModal(); } catch { docModal.setAttribute('open', ''); }
    } else {
      docModal.setAttribute('open', '');
    }
    document.body.style.overflow = 'hidden';
  }

  function closeDoc() {
    if (typeof docModal.close === 'function') {
      try { docModal.close(); } catch { docModal.removeAttribute('open'); }
    } else {
      docModal.removeAttribute('open');
    }
    if (docFrame) docFrame.src = 'about:blank';
    document.body.style.overflow = '';
  }

  document.addEventListener('click', event => {
    const btn = event.target.closest('.project-doc-btn');
    if (btn) {
      event.preventDefault();
      const doc = btn.dataset.doc;
      const title = btn.dataset.docTitle || btn.closest('.project')?.querySelector('h3')?.textContent || 'Document d’étude';
      if (doc) loadDoc(doc, title);
    }
  });

  if (closeBtn) closeBtn.addEventListener('click', closeDoc);

  if (modeToggle) {
    modeToggle.addEventListener('click', () => {
      viewerMode = viewerMode === 'optimized' ? 'direct' : 'optimized';
      if (currentDocUrl) {
        if (docLoading) docLoading.hidden = false;
        if (docFrame) docFrame.src = computeViewerUrl(currentDocUrl, viewerMode);
        modeToggle.textContent = viewerMode === 'optimized' ? 'Vue directe' : 'Vue optimisée';
      }
    });
  }

  docModal.addEventListener('click', event => {
    if (event.target === docModal) closeDoc();
  });

  docModal.addEventListener('cancel', () => {
    closeDoc();
  });

  docModal.addEventListener('contextmenu', e => e.preventDefault());
  window.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 's') && (docModal.open || docModal.hasAttribute('open'))) {
      e.preventDefault();
    }
  });
}
