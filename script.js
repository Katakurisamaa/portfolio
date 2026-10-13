'use strict';
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
  if (event.key === 'Escape' && mobile.matches && menuButton.getAttribute('aria-expanded') === 'true') { setMenu(false); menuButton.focus(); }
});
const filters = document.querySelector('.filters');
const projects = [...document.querySelectorAll('.project')];
const categories = [...new Set(projects.map(project => project.dataset.category))];
const allFilter = document.createElement('button');
allFilter.type = 'button'; allFilter.className = 'filter active';
allFilter.textContent = `Tout explorer · ${projects.length}`;
allFilter.dataset.filter = ''; allFilter.setAttribute('aria-pressed', 'true');
filters.append(allFilter);
categories.forEach(category => {
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'filter'; button.dataset.filter = category;
  button.textContent = category; button.setAttribute('aria-pressed', 'false'); filters.append(button);
});
filters.hidden = projects.length === 0 || !!document.body.dataset.rubrique;
filters.addEventListener('click', event => {
  const button = event.target.closest('[data-filter]');
  if (!button) return;
  filters.querySelectorAll('button').forEach(item => {
    const active = item === button;
    item.classList.toggle('active', active); item.setAttribute('aria-pressed', String(active));
  });
  projects.forEach(project => {
    project.hidden = !!button.dataset.filter && project.dataset.category !== button.dataset.filter;
    project.classList.remove('is-pending');
  });
  const count = projects.filter(project => !project.hidden).length;
  document.querySelector('#filter-status').textContent = `${count} projet${count > 1 ? 's' : ''} affiché${count > 1 ? 's' : ''}.`;
});
const copyButton = document.querySelector('#copy-email');
copyButton.hidden = false;
copyButton.addEventListener('click', async () => {
  const status = document.querySelector('#copy-status');
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText('minkojunior400@gmail.com');
    status.textContent = 'Adresse copiée. À bientôt !';
  } catch { status.textContent = 'La copie est indisponible. Sélectionne l’adresse ci-dessus ou clique dessus pour écrire.'; }
});
document.querySelector('#year').textContent = new Date().getFullYear();
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
if ('IntersectionObserver' in window && !reducedMotion.matches) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.remove('is-pending'); observer.unobserve(entry.target); }
    });
  }, { threshold: 0.06 });
  document.querySelectorAll('.reveal').forEach(element => {
    if (element.getBoundingClientRect().top > window.innerHeight) { element.classList.add('is-pending'); observer.observe(element); }
  });
  reducedMotion.addEventListener('change', event => {
    if (event.matches) { observer.disconnect(); document.querySelectorAll('.is-pending').forEach(element => element.classList.remove('is-pending')); }
  });
}

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
