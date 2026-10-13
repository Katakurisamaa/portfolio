'use strict';

const SUPABASE_URL = 'https://yvrtpioalszmefypdfsy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2cnRwaW9hbHN6bWVmeXBkZnN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4ODk3NTksImV4cCI6MjEwNzQ2NTc1OX0.WECsQoXXtIrymJanEZqhCw1mZvVnOKkNRrU-9P0SrAs';

// --- Menu mobile accessible ---
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
const mobile = window.matchMedia('(max-width: 760px)');

if (menuButton && navigation) {
  menuButton.hidden = false;
  function setMenu(open) {
    menuButton.setAttribute('aria-expanded', String(open));
    const icon = menuButton.querySelector('span');
    if (icon) icon.textContent = open ? '✕' : '+';
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
}

// --- Filtres de projets ---
function initFilters() {
  const filters = document.querySelector('.filters');
  if (!filters) return;
  const projects = [...document.querySelectorAll('.project')];
  const categories = [...new Set(projects.map(project => project.dataset.category).filter(Boolean))];
  
  filters.replaceChildren();
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
  initFilters();
  filtersContainer.addEventListener('click', event => {
    const button = event.target.closest('[data-filter]');
    if (!button) return;
    const projects = [...document.querySelectorAll('.project')];
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

// --- Copie email ---
const copyButton = document.querySelector('#copy-email');
if (copyButton) {
  copyButton.hidden = false;
  copyButton.addEventListener('click', async () => {
    const status = document.querySelector('#copy-status');
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText('minkojunior400@gmail.com');
      if (status) status.textContent = 'Adresse copiée. À bientôt !';
    } catch {
      if (status) status.textContent = "La copie est indisponible. Sélectionne l'adresse ci-dessus ou clique dessus pour m'écrire.";
    }
  });
}

const yearEl = document.querySelector('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// --- Animations d'apparition ---
function initObserver() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('is-pending');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.06 });

    document.querySelectorAll('.reveal').forEach(element => {
      if (element.getBoundingClientRect().top > window.innerHeight) {
        element.classList.add('is-pending');
        observer.observe(element);
      }
    });
  }
}
initObserver();

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
    detailsLabel = 'Méditation & partage';
  } else {
    metaLabel = `${String(n).padStart(2, '0')} — ${e('category')}`;
    metaSub = e('technologies');
    const links = [];
    if (p.site) links.push(`<a href="${e('site')}" target="_blank" rel="noopener noreferrer">Voir le site ↗<span class="sr-only"> (nouvel onglet)</span></a>`);
    if (p.demo) links.push(`<a href="${e('demo')}" target="_blank" rel="noopener noreferrer">Essayer la démo ↗<span class="sr-only"> (nouvel onglet)</span></a>`);
    if (p.github) links.push(`<a href="${e('github')}" target="_blank" rel="noopener noreferrer">Code source ↗<span class="sr-only"> (nouvel onglet)</span></a>`);
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
    const res = await fetch(`${SUPABASE_URL}/rest/v1/projects?select=*&order=created_at.asc`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    if (!res.ok) return;
    const items = await res.json();
    if (!Array.isArray(items) || items.length === 0) return;

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

    // Comparaison avec les cartes déjà présentes pour éviter un re-rendu inutile
    const existingCards = projectsContainer.querySelectorAll('.project');
    const existingIds = [...existingCards].map(c => c.querySelector('h3')?.textContent).filter(Boolean);
    const newIds = displayItems.map(p => p.title);
    const isSame = existingIds.length === newIds.length && existingIds.every((t, i) => t === newIds[i]);
    if (isSame) return; // Déjà parfaitement synchronisé avec le HTML statique

    // Injection dynamique des cartes mises à jour
    const htmlCards = displayItems.map((p, idx) => renderCard(p, idx + 1, displayItems.length)).join('\n');
    projectsContainer.innerHTML = htmlCards || '<p class="empty-projects">De nouvelles explorations arrivent bientôt.</p>';

    // Réinitialisation des filtres et observateurs
    if (!currentRubrique) {
      initFilters();
    } else {
      // Mise à jour des compteurs de rubrique
      const countLabel = `${displayItems.length} partage${displayItems.length !== 1 ? 's' : ''}`;
      const eyebrow = document.querySelector('.rubric-heading .eyebrow');
      if (eyebrow) eyebrow.textContent = `MON UNIVERS / ${countLabel.toUpperCase()}`;
      const h2Count = document.querySelector('.rubric-content h2 span');
      if (h2Count) h2Count.textContent = String(displayItems.length).padStart(2, '0');
    }
    initObserver();
  } catch (err) {
    console.warn('Sync Supabase direct optionnel:', err);
  }
}

syncLiveFromSupabase();
