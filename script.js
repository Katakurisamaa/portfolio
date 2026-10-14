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

// ==========================================================================
// Mode Sombre Éditorial (Dark Mode)
// ==========================================================================
const themeToggleBtn = document.querySelector('#theme-toggle');

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('bm_theme', theme);
  if (themeToggleBtn) {
    themeToggleBtn.textContent = theme === 'dark' ? '☀️' : '🌙';
    themeToggleBtn.setAttribute('title', theme === 'dark' ? 'Passer au mode clair' : 'Passer au mode sombre');
    themeToggleBtn.setAttribute('aria-label', theme === 'dark' ? 'Passer au mode clair' : 'Passer au mode sombre');
  }
}

const savedTheme = localStorage.getItem('bm_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
applyTheme(savedTheme);

if (themeToggleBtn) {
  themeToggleBtn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });
}

// ==========================================================================
// Rendu Mathématique Actuariel (KaTeX)
// ==========================================================================
function renderActuarialMath() {
  if (window.renderMathInElement) {
    try {
      window.renderMathInElement(document.body, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false }
        ],
        throwOnError: false
      });
    } catch (e) {
      console.warn('KaTeX render info:', e);
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderActuarialMath);
} else {
  setTimeout(renderActuarialMath, 50);
}

// ==========================================================================
// Liseuse Biblique Complète (LSG 1910 & Parole de Vie 2017)
// ==========================================================================
const bibleModal = document.querySelector('#bible-reader-modal');
if (bibleModal) {
  const bibleModalTitle = document.querySelector('#bible-modal-title');
  const bibleModalSub = document.querySelector('#bible-modal-sub');
  const bibleContent = document.querySelector('#bible-chapter-content');
  const bibleLoading = document.querySelector('#bible-modal-loading');
  const closeBibleBtn = document.querySelector('#close-bible-modal');
  let currentBibleRef = null;
  let readerVersion = 'FRLSG';

  const BIBLE_MAP = {
    'genese': 1, 'exode': 2, 'levitique': 3, 'nombres': 4, 'deuteronome': 5,
    'josue': 6, 'juges': 7, 'ruth': 8, '1 samuel': 9, '2 samuel': 10,
    '1 rois': 11, '2 rois': 12, '1 chroniques': 13, '2 chroniques': 14,
    'esdras': 15, 'nehemie': 16, 'esther': 17, 'job': 18, 'psaumes': 19, 'psaume': 19, 'ps': 19,
    'proverbes': 20, 'ecclesiaste': 21, 'cantique': 22, 'esaie': 23, 'jeremie': 24,
    'lamentations': 25, 'ezekiel': 26, 'daniel': 27, 'osee': 28, 'joel': 29,
    'amos': 30, 'abdias': 31, 'jonas': 32, 'michee': 33, 'nahum': 34,
    'habacuc': 35, 'sophonie': 36, 'aggee': 37, 'zacharie': 38, 'malachie': 39,
    'matthieu': 40, 'marc': 41, 'luc': 42, 'jean': 43, 'actes': 44,
    'romains': 45, '1 corinthiens': 46, '2 corinthiens': 47, 'galates': 48,
    'ephesiens': 49, 'philippiens': 50, 'colossiens': 51,
    '1 thessaloniciens': 52, '2 thessaloniciens': 53,
    '1 timothee': 54, '2 timothee': 55, 'tite': 56, 'philemon': 57,
    'hebreux': 58, 'jacques': 59, '1 pierre': 60, '2 pierre': 61,
    '1 jean': 62, '2 jean': 63, '3 jean': 64, 'jude': 65, 'apocalypse': 66
  };

  function parseRefClient(raw) {
    if (!raw) return null;
    const clean = raw.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const regex = /^([1-3]?\s*[a-z]+)\s*(\d+)[\s:;,.]+(\d+)(?:\s*[-–]\s*(\d+))?$/;
    const m = clean.match(regex);
    if (m) {
      const bStr = m[1].trim();
      const bId = BIBLE_MAP[bStr];
      if (!bId) return null;
      return { bookId: bId, chapter: parseInt(m[2], 10), startV: parseInt(m[3], 10), endV: m[4] ? parseInt(m[4], 10) : parseInt(m[3], 10), originalRef: raw };
    }
    const regexCh = /^([1-3]?\s*[a-z]+)\s*(\d+)$/;
    const mCh = clean.match(regexCh);
    if (mCh) {
      const bId = BIBLE_MAP[mCh[1].trim()];
      if (!bId) return null;
      return { bookId: bId, chapter: parseInt(mCh[2], 10), startV: 0, endV: 0, originalRef: raw };
    }
    return null;
  }

  async function loadChapter(info) {
    currentBibleRef = info;
    if (bibleModalTitle) bibleModalTitle.textContent = info.originalRef;
    const verLabel = readerVersion === 'FRLSG' ? 'Bible Segond 1910' : 'Parole de Vie 2017';
    if (bibleModalSub) bibleModalSub.textContent = `Lecture complète du chapitre · Version : ${verLabel}`;
    if (bibleLoading) bibleLoading.hidden = false;
    if (bibleContent) bibleContent.replaceChildren();

    if (typeof bibleModal.showModal === 'function') {
      try { bibleModal.showModal(); } catch { bibleModal.setAttribute('open', ''); }
    } else {
      bibleModal.setAttribute('open', '');
    }
    document.body.style.overflow = 'hidden';

    try {
      const res = await fetch(`https://bolls.life/get-chapter/${readerVersion}/${info.bookId}/${info.chapter}/`);
      if (!res.ok) throw new Error('Impossible de contacter le serveur biblique.');
      const verses = await res.json();
      if (!Array.isArray(verses)) throw new Error('Format de chapitre invalide.');

      const container = document.createElement('div');
      verses.forEach(v => {
        const span = document.createElement('span');
        span.className = 'verse-item';
        if (info.startV && v.verse >= info.startV && v.verse <= info.endV) {
          span.classList.add('highlighted');
        }
        const num = document.createElement('span');
        num.className = 'verse-num';
        num.textContent = `${v.verse} `;
        span.append(num);

        const cleanText = (v.text || '').replace(/<[^>]+>/g, '').trim() + ' ';
        span.append(document.createTextNode(cleanText));
        container.append(span);
      });

      if (bibleContent) bibleContent.replaceChildren(container);
    } catch (err) {
      if (bibleContent) {
        bibleContent.innerHTML = `<p style="color:var(--accent);">Erreur lors du chargement : ${err.message}</p>`;
      }
    } finally {
      if (bibleLoading) bibleLoading.hidden = true;
    }
  }

  function closeBible() {
    if (typeof bibleModal.close === 'function') {
      try { bibleModal.close(); } catch { bibleModal.removeAttribute('open'); }
    } else {
      bibleModal.removeAttribute('open');
    }
    document.body.style.overflow = '';
  }

  document.addEventListener('click', event => {
    const btn = event.target.closest('.bible-chapter-btn');
    if (btn) {
      event.preventDefault();
      const ref = btn.dataset.bibleRef;
      const parsed = parseRefClient(ref);
      if (parsed) {
        loadChapter(parsed);
      }
    }
  });

  if (closeBibleBtn) closeBibleBtn.addEventListener('click', closeBible);
  bibleModal.addEventListener('click', event => { if (event.target === bibleModal) closeBible(); });
  bibleModal.addEventListener('cancel', closeBible);

  // Basculeur de version dans la liseuse biblique
  document.querySelectorAll('.bible-modal-ver').forEach(btn => {
    btn.addEventListener('click', () => {
      readerVersion = btn.dataset.ver;
      document.querySelectorAll('.bible-modal-ver').forEach(b => {
        const active = b === btn;
        b.classList.toggle('active', active);
      });
      if (currentBibleRef) loadChapter(currentBibleRef);
    });
  });
}

// ==========================================================================
// Palette de Recherche Instantanée (Ctrl+K / Cmd+K)
// ==========================================================================
const searchModal = document.querySelector('#search-palette-modal');
const searchTrigger = document.querySelector('#search-trigger');
if (searchModal) {
  const searchInput = document.querySelector('#search-palette-input');
  const searchResults = document.querySelector('#search-palette-results');
  const closeSearchBtn = document.querySelector('#close-search-palette');
  let activeSearchCategory = '';

  function openSearch() {
    if (typeof searchModal.showModal === 'function') {
      try { searchModal.showModal(); } catch { searchModal.setAttribute('open', ''); }
    } else {
      searchModal.setAttribute('open', '');
    }
    document.body.style.overflow = 'hidden';
    if (searchInput) {
      searchInput.value = '';
      searchInput.focus();
    }
    performSearch('');
  }

  function closeSearch() {
    if (typeof searchModal.close === 'function') {
      try { searchModal.close(); } catch { searchModal.removeAttribute('open'); }
    } else {
      searchModal.removeAttribute('open');
    }
    document.body.style.overflow = '';
  }

  function performSearch(q) {
    if (!searchResults) return;
    const cards = [...document.querySelectorAll('.project')];
    const query = q.trim().toLowerCase();

    let matches = cards.map(c => {
      const title = c.querySelector('h3')?.textContent || '';
      const cat = c.dataset.category || '';
      const desc = c.querySelector('p')?.textContent || '';
      const meta = c.querySelector('.project-meta')?.textContent || '';
      const details = c.querySelector('.detail-body')?.textContent || '';
      const quote = c.querySelector('blockquote')?.textContent || '';
      const allText = `${title} ${cat} ${desc} ${meta} ${details} ${quote}`.toLowerCase();
      return { element: c, title, cat, desc, allText };
    });

    if (activeSearchCategory) {
      matches = matches.filter(m => m.cat.toLowerCase() === activeSearchCategory.toLowerCase());
    }

    if (query) {
      matches = matches.filter(m => m.allText.includes(query));
    }

    searchResults.replaceChildren();

    if (!matches.length) {
      const p = document.createElement('p');
      p.className = 'search-empty-hint';
      p.textContent = query ? `Aucun résultat pour « ${query} ».` : 'Aucune publication trouvée.';
      searchResults.append(p);
      return;
    }

    matches.slice(0, 10).forEach(item => {
      const btn = document.createElement('div');
      btn.className = 'search-result-item';

      const top = document.createElement('div');
      top.className = 'search-result-top';
      const badge = document.createElement('span');
      badge.className = 'search-result-badge';
      badge.textContent = item.cat || 'Publication';
      top.append(badge);

      const title = document.createElement('h4');
      title.className = 'search-result-title';
      title.textContent = item.title;

      const desc = document.createElement('p');
      desc.className = 'search-result-desc';
      desc.textContent = item.desc.slice(0, 110) + (item.desc.length > 110 ? '...' : '');

      btn.append(top, title, desc);
      btn.addEventListener('click', () => {
        closeSearch();
        item.element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        item.element.style.outline = '2px solid var(--accent)';
        item.element.style.outlineOffset = '4px';
        setTimeout(() => {
          item.element.style.outline = '';
          item.element.style.outlineOffset = '';
        }, 2500);
      });
      searchResults.append(btn);
    });
  }

  if (searchTrigger) searchTrigger.addEventListener('click', openSearch);
  if (closeSearchBtn) closeSearchBtn.addEventListener('click', closeSearch);
  searchModal.addEventListener('click', event => { if (event.target === searchModal) closeSearch(); });
  searchModal.addEventListener('cancel', closeSearch);

  if (searchInput) {
    searchInput.addEventListener('input', () => performSearch(searchInput.value));
  }

  // Filtres de la palette
  document.querySelectorAll('.search-filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      activeSearchCategory = pill.dataset.cat;
      document.querySelectorAll('.search-filter-pill').forEach(p => {
        const active = p === pill;
        p.classList.toggle('active', active);
      });
      if (searchInput) performSearch(searchInput.value);
    });
  });

  // Raccourci clavier global (Ctrl+K / Cmd+K / Slash)
  window.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      if (searchModal.open || searchModal.hasAttribute('open')) {
        closeSearch();
      } else {
        openSearch();
      }
    }
  });
}

// Progressive enhancement also covers cards refreshed by the live data source.
(() => {
  let viewer, viewerImage, viewerTitle, viewerCaption, returnFocus;
  function openImage(image, trigger, title) {
    if (!viewer) {
      viewer=document.createElement('dialog');viewer.className='image-viewer';viewer.setAttribute('aria-labelledby','project-image-title');
      const head=document.createElement('div');head.className='image-viewer-head';
      viewerTitle=document.createElement('h2');viewerTitle.id='project-image-title';
      const close=document.createElement('button');close.type='button';close.className='image-viewer-close';close.textContent='Fermer ×';close.autofocus=true;
      close.addEventListener('click',()=>viewer.close());head.append(viewerTitle,close);
      const content=document.createElement('div');content.className='image-viewer-content';viewerImage=document.createElement('img');content.append(viewerImage);
      viewerCaption=document.createElement('p');viewerCaption.className='image-viewer-caption';
      viewer.append(head,content,viewerCaption);document.body.append(viewer);
      viewer.addEventListener('close',()=>{document.body.classList.remove('image-viewer-open');returnFocus?.focus({preventScroll:true});});
      viewer.addEventListener('click',event=>{if(event.target!==viewer)return;const r=viewer.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)viewer.close();});
    }
    returnFocus=trigger;viewerTitle.textContent=title || 'Aperçu du projet';viewerImage.src=image.currentSrc || image.src;viewerImage.alt=image.alt;
    viewerCaption.textContent=image.alt || title;viewer.showModal();document.body.classList.add('image-viewer-open');
  }
  function enhance() {
    document.querySelectorAll('.project > img.project-image').forEach(image=>{
      const card=image.closest('.project');const title=card.querySelector('h3')?.textContent || 'Projet';
      const button=document.createElement('button');button.type='button';button.className='project-media';button.setAttribute('aria-label','Agrandir l’image : '+title);button.setAttribute('aria-haspopup','dialog');
      const stage=document.createElement('span');stage.className='media-stage';
      const footer=document.createElement('span');footer.className='media-footer';
      const kind=document.createElement('span');kind.className='media-kind';kind.textContent='Aperçu du projet';
      const action=document.createElement('span');action.className='media-action';action.textContent='Agrandir ↗';footer.append(kind,action);
      image.before(button);stage.append(image);button.append(stage,footer);
      const copy=document.createElement('div');copy.className='media-copy';
      while(button.nextSibling)copy.append(button.nextSibling);
      button.after(copy);card.classList.add('media-ready');
      const setFormat=()=>{
        if(!image.naturalWidth)return;
        const portrait=image.naturalHeight>image.naturalWidth*1.12;
        button.classList.toggle('is-portrait',portrait);button.classList.toggle('is-landscape',!portrait);
        kind.textContent=portrait?'Visuel intégral':'Aperçu du projet';
        button.disabled=false;button.classList.remove('image-unavailable');
      };
      const unavailable=()=>{button.classList.add('image-unavailable');button.disabled=true;action.textContent='Image indisponible';};
      image.addEventListener('load',setFormat);image.addEventListener('error',unavailable);
      if(image.complete){if(image.naturalWidth)setFormat();else unavailable();}
      button.addEventListener('click',()=>openImage(image,button,title));
    });
  }
  enhance();
  document.querySelectorAll('.projects').forEach(container=>new MutationObserver(enhance).observe(container,{childList:true,subtree:true}));
})();

