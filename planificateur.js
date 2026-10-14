/**
 * Rythme — Architecture de la Semaine & Planificateur Minimaliste
 * Par Benjamin Minko
 * Moteur interactif : gestion temporelle, presets, calcul d'harmonie actuariel, export iCal & PNG
 */

'use strict';

// ==========================================================================
// Constantes & Configurations
// ==========================================================================
const STORAGE_KEY = 'bm_rythme_planificateur';

const ENERGIES = {
  deepwork: { label: 'Deep Work', icon: '⚡', color: '#a7422d', darkColor: '#e87c64', weight: 'Création' },
  data:     { label: 'Analyse & Chiffres', icon: '📊', color: '#20576e', darkColor: '#5db6db', weight: 'Rigueur' },
  reading:  { label: 'Lecture & Esprit', icon: '📖', color: '#7a5028', darkColor: '#e2ad6c', weight: 'Apprentissage' },
  faith:    { label: 'Foi & Alignement', icon: '✝', color: '#285e2f', darkColor: '#65de81', weight: 'Alignement' },
  vitality: { label: 'Vitalité & Corps', icon: '🌿', color: '#854d0e', darkColor: '#f6a623', weight: 'Énergie' },
  social:   { label: 'Liens & Partage', icon: '🤝', color: '#583e73', darkColor: '#bfa1eb', weight: 'Relations' }
};

const DAY_NAMES = [
  'Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'
];

// Presets d'inspiration
const PRESETS = {
  chercheur: {
    intentions: [
      "Finaliser l'estimation des poids contextuels du stacking bayésien",
      "Synthétiser 2 papiers de recherche en actuariat et sciences des données",
      "Préserver 4h de deep work sans distraction chaque matin"
    ],
    slots: [
      { id: 'c1', day: 1, start: '07:30', end: '08:30', energy: 'faith', title: 'Méditation & Prière matinale', notes: 'Psaume 90, silence et clarté' },
      { id: 'c2', day: 1, start: '09:00', end: '12:30', energy: 'deepwork', title: 'Modélisation stochastique & Stacking', notes: 'Script Stan & calibration des résidus' },
      { id: 'c3', day: 1, start: '14:00', end: '16:30', energy: 'data', title: 'Analyse des tables de mortalité', notes: 'Nettoyage des données et backtesting' },
      { id: 'c4', day: 1, start: '17:30', end: '18:30', energy: 'vitality', title: 'Marche & Aération de l’esprit', notes: 'Sortir sans écran' },
      { id: 'c5', day: 1, start: '20:30', end: '21:30', energy: 'reading', title: 'Lecture — Théorie du Risque', notes: 'Prise de notes dans le carnet' },

      { id: 'c6', day: 2, start: '09:00', end: '12:30', energy: 'deepwork', title: 'Optimisation des hyperparamètres', notes: 'Convergence MCMC et diagnostics' },
      { id: 'c7', day: 2, start: '14:00', end: '17:00', energy: 'data', title: 'Validation temporelle & Graphiques', notes: 'Courbes de mortalité projetées' },
      { id: 'c8', day: 2, start: '18:00', end: '19:00', energy: 'vitality', title: 'Activité sportive', notes: 'Renforcement et étirements' },

      { id: 'c9', day: 3, start: '09:00', end: '12:30', energy: 'deepwork', title: 'Rédaction scientifique & Méthode', notes: 'Mise au propre des équations et théorèmes' },
      { id: 'c10', day: 3, start: '14:00', end: '16:30', energy: 'data', title: 'Revue croisée de code R', notes: 'Modularisation des fonctions' },
      { id: 'c11', day: 3, start: '19:30', end: '21:30', energy: 'social', title: 'Échange technique & Discussion', notes: 'Partage d’idées avec d’autres étudiants' },

      { id: 'c12', day: 4, start: '09:00', end: '12:30', energy: 'deepwork', title: 'Stacking bayésien — Simulations', notes: 'Étude de robustesse aux chocs' },
      { id: 'c13', day: 4, start: '14:00', end: '17:00', energy: 'data', title: 'Analyse des distributions a posteriori', notes: 'Intervalles de crédibilité' },
      { id: 'c14', day: 4, start: '18:00', end: '19:00', energy: 'vitality', title: 'Course à pied & Déconnexion', notes: 'Rythme d’endurance fondamental' },

      { id: 'c15', day: 5, start: '09:00', end: '12:00', energy: 'deepwork', title: 'Rédaction du chapitre d’application', notes: 'Interprétation des résultats belges' },
      { id: 'c16', day: 5, start: '14:00', end: '16:00', energy: 'reading', title: 'Veille académique & Articles', notes: 'Dernières parutions sur arXiv' },
      { id: 'c17', day: 5, start: '19:30', end: '22:00', energy: 'social', title: 'Soirée détente & Famille', notes: 'Repos bien mérité' },

      { id: 'c18', day: 6, start: '08:30', end: '10:00', energy: 'reading', title: 'Lecture littéraire & Découvertes', notes: 'Laurent Gounelle & réflexions' },
      { id: 'c19', day: 6, start: '10:30', end: '12:30', energy: 'deepwork', title: 'Projet personnel & Code libre', notes: 'Création d’un outil web innovant' },
      { id: 'c20', day: 6, start: '15:00', end: '18:30', energy: 'social', title: 'Sortie entre amis & Marche', notes: 'Partage et rires' },

      { id: 'c21', day: 0, start: '09:30', end: '12:00', energy: 'faith', title: 'Culte, Louange & Communauté', notes: 'Rassemblement et adoration' },
      { id: 'c22', day: 0, start: '15:00', end: '17:00', energy: 'reading', title: 'Méditation biblique & Repos', notes: 'Étude d’un épître et journaling' },
      { id: 'c23', day: 0, start: '18:00', end: '19:00', energy: 'faith', title: 'Alignement & Vision de la semaine', notes: 'Prioriser avec sagesse' }
    ]
  },

  developpeur: {
    intentions: [
      "Concevoir et déployer une nouvelle interface web épurée",
      "Écrire un code sans dépendances inutiles et testé au millimètre",
      "Faire du sport au moins 4 fois dans la semaine"
    ],
    slots: [
      { id: 'd1', day: 1, start: '09:00', end: '12:30', energy: 'deepwork', title: 'Architecture Frontend & Composants', notes: 'Vanilla CSS pur et responsive tactile' },
      { id: 'd2', day: 1, start: '14:00', end: '17:00', energy: 'data', title: 'Optimisation de requêtes & Cache', notes: 'Performance et temps de réponse' },
      { id: 'd3', day: 1, start: '18:00', end: '19:00', energy: 'vitality', title: 'Sport & Cardio', notes: 'Entraînement' },

      { id: 'd4', day: 2, start: '09:00', end: '12:30', energy: 'deepwork', title: 'Développement moteur interactif', notes: 'Logique applicative JavaScript' },
      { id: 'd5', day: 2, start: '14:00', end: '16:30', energy: 'deepwork', title: 'Tests unitaires & Cas limites', notes: 'Gestion des erreurs' },
      { id: 'd6', day: 2, start: '20:30', end: '21:30', energy: 'reading', title: 'Lecture veille techno & Design', notes: 'Clean Code & UI minimaliste' },

      { id: 'd7', day: 3, start: '09:00', end: '12:30', energy: 'deepwork', title: 'Mise en place de l’export PDF & iCal', notes: 'Formatage vectoriel' },
      { id: 'd8', day: 3, start: '15:00', end: '17:00', energy: 'social', title: 'Revue de projet avec un ami dev', notes: 'Retours utilisateurs' },

      { id: 'd9', day: 4, start: '09:00', end: '12:30', energy: 'deepwork', title: 'Accessibilité & Mode sombre', notes: 'Vérification des contrastes WCAG' },
      { id: 'd10', day: 4, start: '14:00', end: '16:30', energy: 'data', title: 'Audit de vitesse & Lighthouse 100%', notes: 'Zéro déchet dans le bundle' },
      { id: 'd11', day: 4, start: '18:00', end: '19:00', energy: 'vitality', title: 'Natation ou footing', notes: 'Aération' },

      { id: 'd12', day: 5, start: '09:00', end: '12:00', energy: 'deepwork', title: 'Déploiement en production & Docs', notes: 'Mise en ligne sur GitHub & Vercel' },
      { id: 'd13', day: 5, start: '19:00', end: '22:00', energy: 'social', title: 'Soirée conviviale & Jeux', notes: 'Détente totale' },

      { id: 'd14', day: 6, start: '09:00', end: '11:00', energy: 'vitality', title: 'Grande marche en nature', notes: 'Déconnexion des écrans' },
      { id: 'd15', day: 6, start: '14:00', end: '16:30', energy: 'reading', title: 'Livre de réflexion & Carnet', notes: 'Pause créative' },

      { id: 'd16', day: 0, start: '09:30', end: '12:00', energy: 'faith', title: 'Culte & Communion', notes: 'Nourriture de l’âme' },
      { id: 'd17', day: 0, start: '17:00', end: '18:30', energy: 'faith', title: 'Revue de la semaine & Silence', notes: 'Clarté pour lundi' }
    ]
  },

  equilibre: {
    intentions: [
      "Sanctuariser la prière et la méditation matinale chaque jour",
      "Conclure les journées de travail à 18h précises",
      "Passer des moments de vraie qualité avec mes proches"
    ],
    slots: [
      { id: 'e1', day: 1, start: '07:00', end: '08:00', energy: 'faith', title: 'Temps avec Dieu & Prière', notes: 'Bible, louange et silence' },
      { id: 'e2', day: 1, start: '09:00', end: '12:00', energy: 'deepwork', title: 'Focus 1 : Priorité majeure', notes: 'Avancer sur le projet clé' },
      { id: 'e3', day: 1, start: '14:00', end: '17:00', energy: 'data', title: 'Focus 2 : Étude & Calculs', notes: 'Rigueur et rigueur' },
      { id: 'e4', day: 1, start: '18:30', end: '20:00', energy: 'social', title: 'Repas partagé en famille', notes: 'Écoute et bienveillance' },

      { id: 'e5', day: 2, start: '07:00', end: '08:00', energy: 'faith', title: 'Prière & Méditation biblique', notes: 'Méditation guidée' },
      { id: 'e6', day: 2, start: '09:00', end: '12:00', energy: 'deepwork', title: 'Deep Work — Conception', notes: 'Focus sans notification' },
      { id: 'e7', day: 2, start: '14:00', end: '17:00', energy: 'reading', title: 'Lecture attentive & Fiches', notes: 'Idées fortes à retenir' },
      { id: 'e8', day: 2, start: '17:30', end: '18:30', energy: 'vitality', title: 'Marche active & Respiration', notes: 'Décharge mentale' },

      { id: 'e9', day: 3, start: '07:00', end: '08:00', energy: 'faith', title: 'Silence, Gratitude & Journaling', notes: 'Écrire ce pour quoi je suis reconnaissant' },
      { id: 'e10', day: 3, start: '09:00', end: '12:30', energy: 'deepwork', title: 'Atelier de création & Projets', notes: 'Construire quelque chose d’utile' },
      { id: 'e11', day: 3, start: '19:30', end: '21:30', energy: 'social', title: 'Groupe de prière & Partage', notes: 'Fraternité et prière commune' },

      { id: 'e12', day: 4, start: '07:00', end: '08:00', energy: 'faith', title: 'Méditation des Psaumes', notes: 'Psaume 23 et 121' },
      { id: 'e13', day: 4, start: '09:00', end: '12:00', energy: 'data', title: 'Modélisation & Analyse de données', notes: 'Avancement serein' },
      { id: 'e14', day: 4, start: '17:30', end: '18:30', energy: 'vitality', title: 'Sport & Étirements', notes: 'Prendre soin de son corps' },

      { id: 'e15', day: 5, start: '07:00', end: '08:00', energy: 'faith', title: 'Temps de dévotion & Prière', notes: 'Déposer la semaine entre ses mains' },
      { id: 'e16', day: 5, start: '09:00', end: '12:00', energy: 'deepwork', title: 'Bilan & Clôture des dossiers', notes: 'Finir proprement la semaine' },
      { id: 'e17', day: 5, start: '19:00', end: '22:00', energy: 'social', title: 'Dîner entre amis', notes: 'Convivialité' },

      { id: 'e18', day: 6, start: '09:00', end: '12:00', energy: 'vitality', title: 'Grand bol d’air & Activité', notes: 'Vélo ou randonnée' },
      { id: 'e19', day: 6, start: '14:30', end: '17:00', energy: 'reading', title: 'Lecture d’un livre de fond', notes: 'Nourrir l’intelligence' },

      { id: 'e20', day: 0, start: '09:30', end: '12:30', energy: 'faith', title: 'Culte du Dimanche & Louange', notes: 'Le cœur de la semaine' },
      { id: 'e21', day: 0, start: '15:00', end: '18:00', energy: 'social', title: 'Temps de repos & Famille', notes: 'Sabbat et paix' }
    ]
  },

  minimaliste: {
    intentions: [
      "Une seule tâche majeure par demi-journée",
      "Éliminer tout superflu et distractions numériques",
      "Respirer, lire et vivre le moment présent"
    ],
    slots: [
      { id: 'm1', day: 1, start: '09:30', end: '12:00', energy: 'deepwork', title: 'L’Unique Focus du matin', notes: 'Ce qui compte le plus' },
      { id: 'm2', day: 1, start: '14:30', end: '17:00', energy: 'data', title: 'Tâche essentielle de l’après-midi', notes: 'Régularité sans précipitation' },
      { id: 'm3', day: 2, start: '09:30', end: '12:00', energy: 'deepwork', title: 'Création & Écriture sans bruit', notes: 'Téléphone éteint' },
      { id: 'm4', day: 2, start: '15:00', end: '17:00', energy: 'reading', title: 'Lecture lente & Réflexion', notes: 'Un livre à la fois' },
      { id: 'm5', day: 3, start: '09:30', end: '12:00', energy: 'deepwork', title: 'Recherche & Conception', notes: 'Aller au fond d’une idée' },
      { id: 'm6', day: 3, start: '15:00', end: '16:30', energy: 'vitality', title: 'Marche méditative', notes: 'Observer et marcher' },
      { id: 'm7', day: 4, start: '09:30', end: '12:00', energy: 'data', title: 'Analyse méthodique', notes: 'Une question à résoudre' },
      { id: 'm8', day: 4, start: '15:00', end: '17:00', energy: 'social', title: 'Échange avec une personne précieuse', notes: 'Vraie conversation' },
      { id: 'm9', day: 5, start: '09:30', end: '12:00', energy: 'deepwork', title: 'Finir et ranger les projets', notes: 'Clarté mentale pour le week-end' },
      { id: 'm10', day: 6, start: '10:00', end: '12:00', energy: 'reading', title: 'Carnet de pensée & Lectures', notes: 'Liberté d’esprit' },
      { id: 'm11', day: 0, start: '09:30', end: '12:00', energy: 'faith', title: 'Adoration & Silence intérieur', notes: 'Se recentrer sur l’essentiel' }
    ]
  }
};

// ==========================================================================
// État Global de l'Application
// ==========================================================================
let currentWeekOffset = 0; // 0 = cette semaine, 1 = semaine suivante, etc.
let plannerState = {
  intentions: ['', '', ''],
  slots: []
};
let editingSlotId = null;

// ==========================================================================
// Système de Toast Notifications
// ==========================================================================
function showToast(message, type = 'success', duration = 3000) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast-item toast-${type}`;
  const iconMap = { success: '✓', warning: '⚠️', info: '✦', error: '✕' };
  toast.innerHTML = `<span class="toast-icon">${iconMap[type] || '✦'}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-leave');
    setTimeout(() => toast.remove(), 250);
  }, duration);
}

// ==========================================================================
// Utilitaires de Dates & Conflits
// ==========================================================================
function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getWeekDates(offset = 0) {
  const today = new Date();
  const monday = getMonday(today);
  monday.setDate(monday.getDate() + (offset * 7));

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
}

function getWeekKey(offset = 0) {
  const monday = getWeekDates(offset)[0];
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, '0');
  const d = String(monday.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDateShort(date) {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(date);
}

function formatWeekRange(days) {
  const start = days[0];
  const end = days[6];
  const startStr = start.getDate();
  const endStr = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(end);
  return `${startStr} — ${endStr}`;
}

function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h * 60) + (m || 0);
}

function minutesToHoursStr(min) {
  const hours = Math.floor(min / 60);
  const minutes = min % 60;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${String(minutes).padStart(2, '0')}`;
}

function detectConflicts(daySlots) {
  const conflictSet = new Set();
  for (let i = 0; i < daySlots.length; i++) {
    const startA = parseTimeToMinutes(daySlots[i].start);
    const endA = parseTimeToMinutes(daySlots[i].end);
    for (let j = i + 1; j < daySlots.length; j++) {
      const startB = parseTimeToMinutes(daySlots[j].start);
      const endB = parseTimeToMinutes(daySlots[j].end);
      if (startA < endB && endA > startB) {
        conflictSet.add(daySlots[i].id);
        conflictSet.add(daySlots[j].id);
      }
    }
  }
  return conflictSet;
}

function moveSlotToDay(slotId, targetDay) {
  const slot = plannerState.slots.find(s => s.id === slotId);
  if (!slot) return;
  if (slot.day === targetDay) return;
  slot.day = targetDay;
  saveState();
  renderAll();
  showToast(`Créneau déplacé au ${DAY_NAMES[targetDay]}`, 'success');
}

// ==========================================================================
// Gestion du Stockage Local (localStorage)
// ==========================================================================
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.slots)) {
        plannerState = parsed;
        return;
      }
    }
  } catch (e) {
    console.warn('Erreur chargement state:', e);
  }
  // Charger le preset "Chercheur & Actuaire" par défaut pour une démo immédiate impressionnante
  loadPreset('chercheur', false);
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plannerState));
  } catch (e) {
    console.warn('Erreur sauvegarde state:', e);
  }
}

function loadPreset(name, shouldConfirm = true) {
  if (shouldConfirm && plannerState.slots.length > 0) {
    if (!window.confirm(`Remplacer ton planning actuel par le modèle « ${name} » ?`)) {
      return;
    }
  }

  const preset = PRESETS[name];
  if (!preset) return;

  plannerState = {
    intentions: [...preset.intentions],
    slots: JSON.parse(JSON.stringify(preset.slots))
  };

  saveState();
  renderAll();
}

// ==========================================================================
// Rendu de l'Interface
// ==========================================================================
function renderAll() {
  renderWeekHeader();
  renderIntentions();
  renderGrid();
  renderAnalytics();
}

function renderWeekHeader() {
  const days = getWeekDates(currentWeekOffset);
  const datesDisplay = document.getElementById('week-dates-display');
  const sublabel = document.getElementById('week-sublabel');
  const totalHoursBadge = document.getElementById('week-total-hours');

  if (datesDisplay) datesDisplay.textContent = formatWeekRange(days);
  if (sublabel) {
    if (currentWeekOffset === 0) sublabel.textContent = 'Semaine actuelle';
    else if (currentWeekOffset === 1) sublabel.textContent = 'Semaine prochaine (+1)';
    else if (currentWeekOffset === -1) sublabel.textContent = 'Semaine passée (-1)';
    else sublabel.textContent = currentWeekOffset > 0 ? `Dans +${currentWeekOffset} semaines` : `Il y a ${Math.abs(currentWeekOffset)} semaines`;
  }

  // Calcul du total des heures de la semaine
  const totalMins = plannerState.slots.reduce((acc, s) => {
    return acc + Math.max(0, parseTimeToMinutes(s.end) - parseTimeToMinutes(s.start));
  }, 0);
  const totalHours = (totalMins / 60).toFixed(1);

  if (totalHoursBadge) {
    totalHoursBadge.textContent = `✦ ${totalHours}h planifiées`;
    totalHoursBadge.hidden = false;
  }
}

function renderIntentions() {
  for (let i = 1; i <= 3; i++) {
    const el = document.getElementById(`intention-${i}`);
    if (el) el.value = plannerState.intentions[i - 1] || '';
  }
}

function renderGrid() {
  const container = document.getElementById('planner-grid');
  if (!container) return;

  container.replaceChildren();
  const weekDays = getWeekDates(currentWeekOffset);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Ordre : Lundi (1), Mardi (2), Mercredi (3), Jeudi (4), Vendredi (5), Samedi (6), Dimanche (0)
  const orderedDays = [1, 2, 3, 4, 5, 6, 0];

  orderedDays.forEach((dayIndex, colIdx) => {
    const dayDate = weekDays[colIdx];
    const isToday = dayDate.getTime() === today.getTime();

    // Récupérer les créneaux du jour et les trier par heure de début
    const daySlots = plannerState.slots
      .filter(s => s.day === dayIndex)
      .sort((a, b) => parseTimeToMinutes(a.start) - parseTimeToMinutes(b.start));

    // Détection des chevauchements horaires du jour
    const conflictSet = detectConflicts(daySlots);

    // Calculer la durée totale du jour
    const totalMinutes = daySlots.reduce((acc, s) => {
      const duration = Math.max(0, parseTimeToMinutes(s.end) - parseTimeToMinutes(s.start));
      return acc + duration;
    }, 0);
    const dayHours = totalMinutes / 60;

    // Colonne de jour avec support du Drag & Drop
    const col = document.createElement('div');
    col.className = 'day-column' + (isToday ? ' is-today' : '');
    col.dataset.day = String(dayIndex);

    col.addEventListener('dragover', (e) => {
      e.preventDefault();
      col.classList.add('drag-over');
    });

    col.addEventListener('dragleave', (e) => {
      if (!col.contains(e.relatedTarget)) {
        col.classList.remove('drag-over');
      }
    });

    col.addEventListener('drop', (e) => {
      e.preventDefault();
      col.classList.remove('drag-over');
      const slotId = e.dataTransfer.getData('text/plain');
      if (slotId) moveSlotToDay(slotId, dayIndex);
    });

    // Header du jour
    const header = document.createElement('div');
    header.className = 'day-header';

    const headerTop = document.createElement('div');
    headerTop.className = 'day-header-top';

    const titleWrap = document.createElement('div');
    titleWrap.className = 'day-title-wrap';

    const nameEl = document.createElement('span');
    nameEl.className = 'day-name';
    nameEl.textContent = DAY_NAMES[dayIndex];

    const dateStrEl = document.createElement('span');
    dateStrEl.className = 'day-date-str';
    dateStrEl.textContent = formatDateShort(dayDate);

    titleWrap.append(nameEl, dateStrEl);

    // Pastille de charge quotidienne dynamique
    const loadBadge = document.createElement('span');
    loadBadge.className = 'day-load-badge';
    if (dayHours === 0) {
      loadBadge.textContent = '0h';
    } else if (dayHours < 4) {
      loadBadge.className += ' load-light';
      loadBadge.textContent = minutesToHoursStr(totalMinutes);
    } else if (dayHours <= 7.5) {
      loadBadge.className += ' load-optimal';
      loadBadge.textContent = minutesToHoursStr(totalMinutes);
    } else {
      loadBadge.className += ' load-heavy';
      loadBadge.textContent = minutesToHoursStr(totalMinutes);
    }

    headerTop.append(titleWrap, loadBadge);
    header.append(headerTop);

    // Ligne "En direct / Maintenant" pour aujourd'hui
    if (isToday && currentWeekOffset === 0) {
      const now = new Date();
      const nowH = String(now.getHours()).padStart(2, '0');
      const nowM = String(now.getMinutes()).padStart(2, '0');
      const nowBadge = document.createElement('div');
      nowBadge.className = 'day-now-badge';
      nowBadge.innerHTML = `<span class="pulse-dot"></span> <span>Aujourd'hui · ${nowH}:${nowM}</span>`;
      header.append(nowBadge);
    }

    // Mini jauge de charge visuelle (barre de progression sur 8h de référence)
    const loadMeter = document.createElement('div');
    loadMeter.className = 'day-load-meter';
    const loadFill = document.createElement('div');
    loadFill.className = 'day-load-fill';
    const loadPct = Math.min(100, Math.round((dayHours / 8) * 100));
    loadFill.style.width = `${loadPct}%`;
    if (dayHours > 7.5) loadFill.style.backgroundColor = 'var(--energy-deepwork)';
    else if (dayHours >= 4) loadFill.style.backgroundColor = 'var(--energy-data)';
    else if (dayHours > 0) loadFill.style.backgroundColor = 'var(--energy-faith)';
    loadMeter.append(loadFill);
    header.append(loadMeter);

    col.append(header);

    // Liste des créneaux
    const slotsList = document.createElement('div');
    slotsList.className = 'day-slots-list';

    if (daySlots.length === 0) {
      const emptyBox = document.createElement('div');
      emptyBox.className = 'day-empty-box';

      const icon = document.createElement('span');
      icon.className = 'day-empty-icon';
      icon.textContent = colIdx >= 5 ? '🌿' : '☕';

      const text = document.createElement('p');
      text.className = 'day-empty-text';
      text.textContent = colIdx >= 5 ? 'Sabbat, repos et contemplation' : 'Espace libre & sérénité';

      const addBtnEmpty = document.createElement('button');
      addBtnEmpty.type = 'button';
      addBtnEmpty.className = 'day-empty-add-btn';
      addBtnEmpty.innerHTML = '<span>＋</span> Planifier';
      addBtnEmpty.addEventListener('click', () => openSlotModal(null, dayIndex));

      emptyBox.append(icon, text, addBtnEmpty);
      slotsList.append(emptyBox);
    } else {
      daySlots.forEach((slot, sIdx) => {
        const energyConfig = ENERGIES[slot.energy] || ENERGIES.deepwork;
        const durMins = Math.max(0, parseTimeToMinutes(slot.end) - parseTimeToMinutes(slot.start));
        const isConflict = conflictSet.has(slot.id);

        const card = document.createElement('article');
        card.className = `slot-card tone-${slot.energy}` + (isConflict ? ' has-conflict' : '');
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.draggable = true;
        card.style.setProperty('--delay', `${sIdx * 0.04}s`);

        // Gestion du Drag & Drop sur la carte
        card.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', slot.id);
          card.classList.add('is-dragging');
        });

        card.addEventListener('dragend', () => {
          card.classList.remove('is-dragging');
        });

        // Haut de carte
        const slotTop = document.createElement('div');
        slotTop.className = 'slot-top';

        const badge = document.createElement('span');
        badge.className = 'slot-energy-badge';
        badge.innerHTML = `<span aria-hidden="true">${energyConfig.icon}</span> ${energyConfig.label}`;

        const timeWrap = document.createElement('div');
        timeWrap.className = 'slot-time-wrap';

        const timeSpan = document.createElement('span');
        timeSpan.className = 'slot-time';
        timeSpan.textContent = `${slot.start} — ${slot.end}`;

        const durBadge = document.createElement('span');
        durBadge.className = 'slot-duration';
        durBadge.textContent = minutesToHoursStr(durMins);

        timeWrap.append(timeSpan, durBadge);
        slotTop.append(badge, timeWrap);

        // Titre
        const titleEl = document.createElement('h3');
        titleEl.className = 'slot-title';
        titleEl.textContent = slot.title;

        card.append(slotTop, titleEl);

        // Avertissement visuel de conflit horaire
        if (isConflict) {
          const conflictBadge = document.createElement('span');
          conflictBadge.className = 'slot-conflict-badge';
          conflictBadge.innerHTML = '⚠️ Chevauchement';
          card.append(conflictBadge);
        }

        // Notes si présentes
        if (slot.notes) {
          const notesEl = document.createElement('p');
          notesEl.className = 'slot-notes';
          notesEl.textContent = slot.notes;
          card.append(notesEl);
        }

        // Actions rapides (Modifier, Supprimer)
        const actions = document.createElement('div');
        actions.className = 'slot-actions';

        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'slot-action-btn';
        editBtn.title = 'Modifier ce créneau';
        editBtn.innerHTML = '✏️';
        editBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          openSlotModal(slot);
        });

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'slot-action-btn';
        delBtn.title = 'Supprimer ce créneau';
        delBtn.innerHTML = '🗑️';
        delBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          deleteSlot(slot.id);
        });

        actions.append(editBtn, delBtn);
        card.append(actions);

        // Clic ou clavier pour modifier
        card.addEventListener('click', () => openSlotModal(slot));
        card.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openSlotModal(slot);
          }
        });

        slotsList.append(card);
      });
    }

    col.append(slotsList);

    // Bouton ajouter un créneau pour ce jour
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'add-slot-day-btn';
    addBtn.innerHTML = '<span>＋</span> Ajouter créneau';
    addBtn.addEventListener('click', () => openSlotModal(null, dayIndex));

    col.append(addBtn);
    container.append(col);
  });
}

// ==========================================================================
// Analyse Actuarielle & Harmonie de Vie
// ==========================================================================
function renderAnalytics() {
  const container = document.getElementById('analytics-bars');
  if (!container) return;
  container.replaceChildren();

  // Calcul du temps par énergie en minutes
  const energyMinutes = {
    deepwork: 0,
    data: 0,
    reading: 0,
    faith: 0,
    vitality: 0,
    social: 0
  };

  let totalMinutes = 0;

  plannerState.slots.forEach(s => {
    const dur = Math.max(0, parseTimeToMinutes(s.end) - parseTimeToMinutes(s.start));
    if (energyMinutes[s.energy] !== undefined) {
      energyMinutes[s.energy] += dur;
    }
    totalMinutes += dur;
  });

  const totalHours = totalMinutes / 60;

  // Création des barres métriques
  Object.keys(ENERGIES).forEach(key => {
    const energy = ENERGIES[key];
    const mins = energyMinutes[key] || 0;
    const hours = (mins / 60).toFixed(1);
    const pct = totalMinutes > 0 ? Math.round((mins / totalMinutes) * 100) : 0;

    const card = document.createElement('div');
    card.className = 'energy-metric-card';

    const top = document.createElement('div');
    top.className = 'metric-top';

    const label = document.createElement('span');
    label.innerHTML = `${energy.icon} ${energy.label}`;
    label.style.color = `var(--energy-${key})`;

    const val = document.createElement('span');
    val.innerHTML = `<strong>${hours}h</strong> <small>(${pct}%)</small>`;

    top.append(label, val);

    const track = document.createElement('div');
    track.className = 'metric-bar-track';

    const fill = document.createElement('div');
    fill.className = 'metric-bar-fill';
    fill.style.width = `${pct}%`;
    fill.style.backgroundColor = `var(--energy-${key})`;

    track.append(fill);
    card.append(top, track);
    container.append(card);
  });

  // Calcul de l'Indice d'Harmonie (Modèle actuariel multicritères)
  let score = 70; // Score de base
  const deepworkHours = energyMinutes.deepwork / 60;
  const restAndSpirit = (energyMinutes.faith + energyMinutes.vitality + energyMinutes.reading) / 60;
  const socialHours = energyMinutes.social / 60;

  // Pénalité de surcharge mentale si > 35h de concentration pure
  if (deepworkHours > 35) score -= 15;
  else if (deepworkHours >= 12 && deepworkHours <= 28) score += 10;

  // Bonus si présence de spiritualité / repos / santé
  if (restAndSpirit >= 8) score += 12;
  else if (restAndSpirit >= 4) score += 6;

  // Bonus si présence de liens sociaux / famille
  if (socialHours >= 5) score += 8;

  score = Math.min(99, Math.max(30, score));

  const scoreEl = document.getElementById('harmony-score');
  const statusEl = document.getElementById('harmony-status');
  const insightEl = document.getElementById('analytics-insight');
  const ringProgress = document.getElementById('harmony-ring-progress');

  if (scoreEl) scoreEl.textContent = `${score}%`;

  if (ringProgress) {
    const circumference = 238.76;
    const offset = circumference * (1 - score / 100);
    ringProgress.style.strokeDashoffset = offset;
    ringProgress.style.stroke = score >= 85 ? 'var(--energy-faith)' : (score >= 70 ? 'var(--energy-data)' : 'var(--energy-deepwork)');
  }

  if (statusEl && insightEl) {
    if (score >= 85) {
      statusEl.textContent = 'Rythme très harmonieux';
      statusEl.style.color = 'var(--energy-faith)';
      insightEl.innerHTML = `<strong>✦ Analyse actuarielle du rythme :</strong> Semaine remarquablement équilibrée (${totalHours.toFixed(1)}h planifiées). Concentration profonde et espaces de ressourcement spirituel et corporel sont en juste proportion.`;
    } else if (score >= 70) {
      statusEl.textContent = 'Rythme actif & soutenable';
      statusEl.style.color = 'var(--energy-data)';
      insightEl.innerHTML = `<strong>✦ Analyse actuarielle du rythme :</strong> Bonne intensité globale (${totalHours.toFixed(1)}h). Veille à préserver tes créneaux de respiration et de marche en fin de journée pour maintenir ton énergie intacte.`;
    } else {
      statusEl.textContent = 'Attention à la surcharge';
      statusEl.style.color = 'var(--energy-deepwork)';
      insightEl.innerHTML = `<strong>✦ Analyse actuarielle du rythme :</strong> La charge de travail est très dense. Pense à insérer 1 ou 2 plages de silence, de lecture ou de repos pour éviter la fatigue cognitive.`;
    }
  }
}

// ==========================================================================
// Modale de Créneau (Ajout & Édition)
// ==========================================================================
const dialog = document.getElementById('slot-dialog');
const slotForm = document.getElementById('slot-form');

function openSlotModal(slot = null, defaultDay = 1) {
  if (!dialog || !slotForm) return;

  editingSlotId = slot ? slot.id : null;
  document.getElementById('slot-dialog-title').textContent = slot ? 'Modifier le créneau' : 'Nouveau bloc de temps';
  document.getElementById('slot-id').value = slot ? slot.id : '';
  document.getElementById('slot-day').value = slot ? String(slot.day) : String(defaultDay);
  document.getElementById('slot-title').value = slot ? slot.title : '';
  document.getElementById('slot-start').value = slot ? slot.start : '09:00';
  document.getElementById('slot-end').value = slot ? slot.end : '12:00';
  document.getElementById('slot-notes').value = slot ? (slot.notes || '') : '';

  // Sélection du type d'énergie
  const targetEnergy = slot ? slot.energy : 'deepwork';
  const radio = slotForm.querySelector(`input[name="energy-type"][value="${targetEnergy}"]`);
  if (radio) radio.checked = true;

  // Bouton supprimer visible seulement en modification
  const delBtn = document.getElementById('delete-slot-btn');
  if (delBtn) delBtn.hidden = !slot;

  dialog.showModal();
}

function closeSlotModal() {
  if (dialog) dialog.close();
  editingSlotId = null;
}

function deleteSlot(id) {
  plannerState.slots = plannerState.slots.filter(s => s.id !== id);
  saveState();
  renderAll();
  closeSlotModal();
  showToast('Créneau supprimé', 'info');
}

if (slotForm) {
  slotForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const id = document.getElementById('slot-id').value || `slot-${Date.now()}`;
    const day = parseInt(document.getElementById('slot-day').value, 10);
    const title = document.getElementById('slot-title').value.trim();
    const start = document.getElementById('slot-start').value;
    const end = document.getElementById('slot-end').value;
    const notes = document.getElementById('slot-notes').value.trim();
    const energy = slotForm.querySelector('input[name="energy-type"]:checked')?.value || 'deepwork';

    if (parseTimeToMinutes(end) <= parseTimeToMinutes(start)) {
      alert('L’heure de fin doit être postérieure à l’heure de début.');
      return;
    }

    const newSlot = { id, day, title, start, end, energy, notes };

    // Vérifier les chevauchements horaires
    const overlaps = plannerState.slots.filter(s => s.id !== id && s.day === day && parseTimeToMinutes(s.start) < parseTimeToMinutes(end) && parseTimeToMinutes(s.end) > parseTimeToMinutes(start));

    if (editingSlotId) {
      plannerState.slots = plannerState.slots.map(s => s.id === editingSlotId ? newSlot : s);
    } else {
      plannerState.slots.push(newSlot);
    }

    saveState();
    renderAll();
    closeSlotModal();

    if (overlaps.length > 0) {
      showToast('Créneau enregistré (attention au chevauchement d\'horaires).', 'warning');
    } else {
      showToast(editingSlotId ? 'Créneau modifié avec succès !' : 'Nouveau créneau ajouté !', 'success');
    }
  });
}

document.getElementById('close-slot-dialog')?.addEventListener('click', closeSlotModal);
document.getElementById('cancel-slot-dialog')?.addEventListener('click', closeSlotModal);
document.getElementById('delete-slot-btn')?.addEventListener('click', () => {
  if (editingSlotId && window.confirm('Supprimer définitivement ce créneau ?')) {
    deleteSlot(editingSlotId);
  }
});

// ==========================================================================
// Moteur d'Exportation & Téléchargement
// ==========================================================================

// 1. Export PDF via Impression A4 ultra soignée
function exportPDF() {
  window.print();
}

// 2. Export Calendrier Universel (.ics iCalendar RFC 5545)
function exportICS() {
  const weekDays = getWeekDates(currentWeekOffset);
  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Benjamin Minko//Rythme Planificateur Hebdomadaire//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Rythme - Mon Planning Hebdomadaire',
    'X-WR-TIMEZONE:Europe/Paris'
  ];

  plannerState.slots.forEach(slot => {
    // Calculer la date exacte du créneau
    // slot.day : 0=Dimanche, 1=Lundi, ..., 6=Samedi
    // weekDays : [0]=Lundi, [1]=Mardi, ..., [6]=Dimanche
    let dayDate;
    if (slot.day === 0) dayDate = weekDays[6]; // Dimanche
    else dayDate = weekDays[slot.day - 1]; // Lundi = weekDays[0]

    if (!dayDate) return;

    const y = dayDate.getFullYear();
    const m = String(dayDate.getMonth() + 1).padStart(2, '0');
    const d = String(dayDate.getDate()).padStart(2, '0');

    const [sh, sm] = slot.start.split(':');
    const [eh, em] = slot.end.split(':');

    const dtStart = `${y}${m}${d}T${sh}${sm}00`;
    const dtEnd = `${y}${m}${d}T${eh}${em}00`;
    const uid = `${slot.id}-${dtStart}@benjamin-minko.portfolio`;
    const energyLabel = ENERGIES[slot.energy]?.label || 'Activité';

    ics.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:[${energyLabel}] ${slot.title.replace(/[,;]/g, ' ')}`,
      `DESCRIPTION:${(slot.notes || '').replace(/[,;]/g, ' ')}`,
      `CATEGORIES:${energyLabel}`,
      'STATUS:CONFIRMED',
      'END:VEVENT'
    );
  });

  ics.push('END:VCALENDAR');

  const blob = new Blob([ics.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Rythme_Semaine_${formatDateShort(weekDays[0])}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 3. Export Image PNG Haute Résolution (Canvas 2x Retina)
function exportPNG() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  const width = 2400;
  const height = 1500;
  canvas.width = width;
  canvas.height = height;

  // Couleurs de fond et de lignes
  const bgColor = isDark ? '#141712' : '#f6f3eb';
  const cardColor = isDark ? '#1f241c' : '#ffffff';
  const inkColor = isDark ? '#f7f4ec' : '#1e221b';
  const mutedColor = isDark ? '#a8ad9d' : '#6e7365';
  const lineColor = isDark ? '#3d4637' : '#ded9cb';

  // Fond général
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  // En-tête éditorial
  ctx.fillStyle = isDark ? '#e87c64' : '#a7422d';
  ctx.font = 'bold 22px Segoe UI, sans-serif';
  ctx.fillText('RYTHME · L’ARCHITECTURE DE LA SEMAINE — BENJAMIN MINKO', 80, 75);

  ctx.fillStyle = inkColor;
  ctx.font = 'bold 44px Georgia, serif';
  const weekDays = getWeekDates(currentWeekOffset);
  ctx.fillText(`Planning Hebdomadaire : ${formatWeekRange(weekDays)}`, 80, 130);

  // Intentions en sous-titre
  ctx.font = 'italic 20px Georgia, serif';
  ctx.fillStyle = mutedColor;
  const intText = plannerState.intentions.filter(Boolean).join('  ·  ') || 'Semaine d’équilibre et de concentration.';
  ctx.fillText(`Intentions : ${intText}`, 80, 170);

  // Ligne de séparation
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(80, 200);
  ctx.lineTo(width - 80, 200);
  ctx.stroke();

  // Grille 7 colonnes
  const colWidth = (width - 160 - (6 * 18)) / 7;
  const startY = 230;
  const orderedDays = [1, 2, 3, 4, 5, 6, 0];

  orderedDays.forEach((dayIndex, colIdx) => {
    const colX = 80 + (colIdx * (colWidth + 18));
    const dayDate = weekDays[colIdx];

    // Carte de colonne
    ctx.fillStyle = cardColor;
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(colX, startY, colWidth, height - startY - 80, 12);
    ctx.fill();
    ctx.stroke();

    // En-tête de colonne
    ctx.fillStyle = inkColor;
    ctx.font = 'bold 24px Georgia, serif';
    ctx.fillText(DAY_NAMES[dayIndex], colX + 16, startY + 40);

    ctx.font = '16px Segoe UI, sans-serif';
    ctx.fillStyle = mutedColor;
    ctx.fillText(formatDateShort(dayDate), colX + 16, startY + 65);

    // Ligne sous le header
    ctx.strokeStyle = lineColor;
    ctx.beginPath();
    ctx.moveTo(colX + 16, startY + 80);
    ctx.lineTo(colX + colWidth - 16, startY + 80);
    ctx.stroke();

    // Créneaux
    const daySlots = plannerState.slots
      .filter(s => s.day === dayIndex)
      .sort((a, b) => parseTimeToMinutes(a.start) - parseTimeToMinutes(b.start));

    let slotY = startY + 95;
    daySlots.forEach(slot => {
      const energy = ENERGIES[slot.energy] || ENERGIES.deepwork;
      const slotHeight = 90;

      // Fond de créneau
      ctx.fillStyle = isDark ? '#262d22' : '#fdfaf5';
      ctx.strokeStyle = isDark ? energy.darkColor : energy.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(colX + 12, slotY, colWidth - 24, slotHeight, 8);
      ctx.fill();
      ctx.stroke();

      // Badge énergie & Heure
      ctx.fillStyle = isDark ? energy.darkColor : energy.color;
      ctx.font = 'bold 13px Segoe UI, sans-serif';
      ctx.fillText(`${energy.icon} ${slot.start} - ${slot.end}`, colX + 22, slotY + 24);

      // Titre
      ctx.fillStyle = inkColor;
      ctx.font = 'bold 15px Segoe UI, sans-serif';
      const truncatedTitle = slot.title.length > 25 ? slot.title.slice(0, 23) + '...' : slot.title;
      ctx.fillText(truncatedTitle, colX + 22, slotY + 50);

      // Notes
      if (slot.notes) {
        ctx.fillStyle = mutedColor;
        ctx.font = 'italic 12px Segoe UI, sans-serif';
        const truncatedNotes = slot.notes.length > 28 ? slot.notes.slice(0, 26) + '...' : slot.notes;
        ctx.fillText(truncatedNotes, colX + 22, slotY + 72);
      }

      slotY += slotHeight + 10;
    });
  });

  // Téléchargement immédiat
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Rythme_Semaine_${formatDateShort(weekDays[0])}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 'image/png');
}

// 4. Export JSON
function exportJSON() {
  const json = JSON.stringify(plannerState, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'planning_rythme.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ==========================================================================
// Gestion du Thème (Dark / Light)
// ==========================================================================
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem('bm_theme', theme); } catch {}

  const themeIcon = document.getElementById('theme-icon');
  const themeText = document.getElementById('theme-text');
  if (themeIcon) themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
  if (themeText) themeText.textContent = theme === 'dark' ? 'Clair' : 'Sombre';

  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) metaTheme.setAttribute('content', theme === 'dark' ? '#141712' : '#f6f3eb');
}

function initTheme() {
  let theme = 'light';
  try {
    theme = localStorage.getItem('bm_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  } catch {}
  applyTheme(theme);

  const toggleBtn = document.getElementById('theme-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme') || 'light';
      applyTheme(cur === 'dark' ? 'light' : 'dark');
      renderAnalytics(); // Réactualiser les contrastes de dashboard
    });
  }

  // Écouter le storage si modifié depuis le portfolio
  window.addEventListener('storage', (e) => {
    if (e.key === 'bm_theme' && e.newValue) applyTheme(e.newValue);
  });
}

// ==========================================================================
// Événements & Initialisation Générale
// ==========================================================================
function initEvents() {
  // Navigation semaine
  document.getElementById('prev-week')?.addEventListener('click', () => {
    currentWeekOffset--;
    renderWeekHeader();
    renderGrid();
  });

  document.getElementById('next-week')?.addEventListener('click', () => {
    currentWeekOffset++;
    renderWeekHeader();
    renderGrid();
  });

  document.getElementById('today-btn')?.addEventListener('click', () => {
    currentWeekOffset = 0;
    renderWeekHeader();
    renderGrid();
    showToast('Semaine en cours affichée', 'info');
  });

  // Nouveau créneau général
  document.getElementById('add-slot-btn')?.addEventListener('click', () => {
    openSlotModal();
  });

  // Réinitialiser la semaine
  document.getElementById('reset-week-btn')?.addEventListener('click', () => {
    if (window.confirm('Effacer tous les créneaux et réinitialiser la semaine ?')) {
      plannerState.slots = [];
      plannerState.intentions = ['', '', ''];
      saveState();
      renderAll();
      showToast('Semaine réinitialisée.', 'info');
    }
  });

  // Écoute des 3 intentions
  for (let i = 1; i <= 3; i++) {
    const el = document.getElementById(`intention-${i}`);
    if (el) {
      el.addEventListener('input', (e) => {
        plannerState.intentions[i - 1] = e.target.value.trim();
        saveState();
      });
    }
  }

  // Dropdown Presets
  const presetBtn = document.getElementById('preset-btn');
  const presetMenu = document.getElementById('preset-menu');
  if (presetBtn && presetMenu) {
    presetBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      presetMenu.hidden = !presetMenu.hidden;
      document.getElementById('export-menu').hidden = true;
    });

    document.querySelectorAll('.preset-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const p = btn.dataset.preset;
        loadPreset(p);
        presetMenu.hidden = true;
        showToast('Modèle d\'inspiration appliqué', 'success');
      });
    });
  }

  // Dropdown Export & Import
  const exportBtn = document.getElementById('export-dropdown-btn');
  const exportMenu = document.getElementById('export-menu');
  const fileInput = document.getElementById('import-json-input');

  if (exportBtn && exportMenu) {
    exportBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      exportMenu.hidden = !exportMenu.hidden;
      document.getElementById('preset-menu').hidden = true;
    });

    document.getElementById('export-pdf')?.addEventListener('click', () => { exportMenu.hidden = true; exportPDF(); });
    document.getElementById('export-ics')?.addEventListener('click', () => { exportMenu.hidden = true; exportICS(); });
    document.getElementById('export-png')?.addEventListener('click', () => { exportMenu.hidden = true; exportPNG(); });
    document.getElementById('export-json')?.addEventListener('click', () => { exportMenu.hidden = true; exportJSON(); });

    // Import JSON
    document.getElementById('import-json')?.addEventListener('click', () => {
      exportMenu.hidden = true;
      fileInput?.click();
    });
  }

  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          if (parsed && Array.isArray(parsed.slots)) {
            plannerState = parsed;
            saveState();
            renderAll();
            showToast('Planning importé avec succès !', 'success');
          } else {
            showToast('Fichier JSON invalide (format non reconnu).', 'warning');
          }
        } catch (err) {
          showToast('Erreur lors de la lecture du fichier JSON.', 'error');
        }
        e.target.value = '';
      };
      reader.readAsText(file);
    });
  }

  // Modale Raccourcis Clavier
  const shortcutsDialog = document.getElementById('shortcuts-dialog');
  document.getElementById('shortcuts-btn')?.addEventListener('click', () => {
    shortcutsDialog?.showModal();
  });
  document.getElementById('close-shortcuts-dialog')?.addEventListener('click', () => {
    shortcutsDialog?.close();
  });
  document.getElementById('ok-shortcuts-dialog')?.addEventListener('click', () => {
    shortcutsDialog?.close();
  });

  // Fermer les modales au clic sur le backdrop
  [dialog, shortcutsDialog].forEach(d => {
    if (!d) return;
    d.addEventListener('click', (e) => {
      const rect = d.getBoundingClientRect();
      const inDialog = (
        rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX && e.clientX <= rect.left + rect.width
      );
      if (!inDialog) d.close();
    });
  });

  // Raccourcis Clavier Globaux Pro (N, P, T, Flèches, ?)
  window.addEventListener('keydown', (e) => {
    const activeTag = document.activeElement?.tagName?.toLowerCase();
    if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
      return; // Ne pas intercepter la saisie de texte
    }

    if (e.key === 'n' || e.key === 'N') {
      e.preventDefault();
      openSlotModal();
    } else if (e.key === 'p' || e.key === 'P') {
      e.preventDefault();
      if (presetMenu) presetMenu.hidden = !presetMenu.hidden;
    } else if (e.key === 't' || e.key === 'T') {
      e.preventDefault();
      currentWeekOffset = 0;
      renderWeekHeader();
      renderGrid();
      showToast('Aujourd\'hui', 'info');
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      currentWeekOffset--;
      renderWeekHeader();
      renderGrid();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      currentWeekOffset++;
      renderWeekHeader();
      renderGrid();
    } else if (e.key === '?' || (e.shiftKey && e.key === '/')) {
      e.preventDefault();
      if (shortcutsDialog?.open) shortcutsDialog.close();
      else shortcutsDialog?.showModal();
    }
  });

  // Fermer les dropdowns en cliquant en dehors
  document.addEventListener('click', (e) => {
    if (presetMenu && !presetMenu.hidden && !presetMenu.contains(e.target)) presetMenu.hidden = true;
    if (exportMenu && !exportMenu.hidden && !exportMenu.contains(e.target)) exportMenu.hidden = true;
  });
}

// Démarrage
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  loadState();
  initEvents();
  renderAll();
});
