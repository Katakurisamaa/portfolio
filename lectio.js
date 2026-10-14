'use strict';

/* ==========================================================================
   Lectio — Synthétiseur Intelligent de Documents
   Utilise l'API Gemini pour analyser des documents.
   ========================================================================== */

// ---- Constants ----
const API_KEY_STORAGE = 'lectio-gemini-key';
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// ---- DOM Elements ----
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const heroSection = $('#hero-section');
const processingSection = $('#processing-section');
const resultsSection = $('#results-section');
const dropZone = $('#drop-zone');
const dropContent = $('#drop-content');
const pasteArea = $('#paste-area');
const pasteTextarea = $('#paste-textarea');
const fileInput = $('#file-input');
const progressFill = $('#progress-fill');
const processingStatus = $('#processing-status');
const toast = $('#toast');
const apiKeyDialog = $('#api-key-dialog');
const apiKeyInput = $('#api-key-input');

// ---- State ----
let currentMode = 'academic';
let documentText = '';
let documentName = 'Document';

// ---- Theme Toggle ----
const themeToggle = $('#theme-toggle');
const themeIcon = $('#theme-icon');

function setTheme(dark) {
  document.body.classList.toggle('dark', dark);
  themeIcon.textContent = dark ? '☀️' : '🌙';
  localStorage.setItem('lectio-theme', dark ? 'dark' : 'light');
}

const savedTheme = localStorage.getItem('lectio-theme');
if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  setTheme(true);
}

themeToggle.addEventListener('click', () => {
  setTheme(!document.body.classList.contains('dark'));
});

// ---- Year ----
const yearEl = $('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ---- Toast ----
let toastTimer;
function showToast(msg) {
  clearTimeout(toastTimer);
  toast.textContent = msg;
  toast.hidden = false;
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => { toast.hidden = true; }, 300);
  }, 2800);
}

// ---- API Key Management ----
function getApiKey() {
  return localStorage.getItem(API_KEY_STORAGE) || '';
}

function promptForApiKey() {
  return new Promise((resolve) => {
    apiKeyInput.value = getApiKey();
    apiKeyDialog.showModal();

    const onSave = () => {
      const key = apiKeyInput.value.trim();
      if (key) {
        localStorage.setItem(API_KEY_STORAGE, key);
        apiKeyDialog.close();
        cleanup();
        resolve(key);
      }
    };

    const onCancel = () => {
      apiKeyDialog.close();
      cleanup();
      resolve(null);
    };

    const onSample = () => {
      apiKeyDialog.close();
      cleanup();
      loadSample('actuariat');
      resolve(null);
    };

    const cleanup = () => {
      $('#save-api-key').removeEventListener('click', onSave);
      $('#cancel-api-key').removeEventListener('click', onCancel);
      $('#dialog-sample-btn')?.removeEventListener('click', onSample);
    };

    $('#save-api-key').addEventListener('click', onSave);
    $('#cancel-api-key').addEventListener('click', onCancel);
    $('#dialog-sample-btn')?.addEventListener('click', onSample);
  });
}

// Close dialog on backdrop click
apiKeyDialog.addEventListener('click', (e) => {
  if (e.target === apiKeyDialog) apiKeyDialog.close();
});

// ---- Interactive Samples ----
const SAMPLES = {
  actuariat: {
    mode: 'academic',
    title: 'Note de recherche — Stacking bayésien de mortalité',
    text: `Ce travail explore une extension contextuelle du stacking bayésien hiérarchique appliquée à la modélisation et à la prévision stochastique de la mortalité humaine. Partant du constat empirique selon lequel aucun modèle unique (Lee-Carter, Renshaw-Haberman, Plat, Cairns-Blake-Dowd) ne surperforme uniformément sur tous les groupes d'âge et horizons temporels, nous introduisons un mécanisme de pondération contextuelle. Une régularisation bayésienne hiérarchique prévient le surapprentissage tout en capturant l'hétérogénéité structurelle. Appliquée aux tables de mortalité belges (1970–2024), l'approche démontre une réduction significative de l'erreur quadratique moyenne de prévision et une quantification plus robuste du risque de longévité pour les fonds de pension et compagnies d'assurance-vie.`,
    result: {
      summary: `<h3>Thèse & Problématique Centrale</h3><p>La prévision de la mortalité se heurte au dilemme du modèle unique : aucun modèle stochastique ne domine sur l'ensemble de la pyramide des âges et des horizons de prévision. Le <strong>stacking bayésien contextuel</strong> propose d'agréger dynamiquement les forces de cinq modèles classiques en adaptant leurs poids relatifs selon le contexte démographique.</p><h3>Méthodologie & Innovations Clés</h3><ul><li><strong>Pondération adaptative :</strong> Détermination des poids par optimisation bayésienne selon l'âge et la maturité prédictive.</li><li><strong>Régularisation hiérarchique :</strong> Contrainte a priori évitant les variations artificielles de volatilité.</li><li><strong>Validation empirique :</strong> Évaluation sur 54 années de données de mortalité belge (1970–2024) avec fenêtres glissantes d'apprentissage.</li></ul><blockquote>« La flexibilité permet de reconnaître les différences ; la régularisation empêche de les inventer. »</blockquote><h3>Résultats & Portée Actuarielle</h3><p>L'approche réduit significativement le biais d'estimation pour les âges avancés (75-95 ans), zone la plus critique pour le calcul des provisions de longévité et de rentes viagères (Solvabilité II).</p>`,
      questions: [
        "Comment arbitrer entre la vitesse d'adaptation des poids contextuels et la stabilité réglementaire requise par Solvabilité II ?",
        "Dans quelle mesure les chocs exogènes (pandémies, crises sanitaires) affectent-ils la matrice de stacking par rapport à des modèles univariés ?",
        "La structure hiérarchique permet-elle d'extrapoler de manière fiable au-delà de 95 ans (fermeture de table) ?",
        "Quel est le coût computationnel d'un échantillonneur HMC (STAN) en contexte de production actuarielle quotidienne ?"
      ],
      concepts: [
        "Stacking Bayésien",
        "Risque de Longévité",
        "Régularisation Hiérarchique",
        "Tables Prospectives",
        "Solvabilité II",
        "Modèles Lee-Carter / Plat"
      ],
      connections: [
        { from: "Stacking Bayésien", to: "Risque de Longévité", link: "Affine la distribution prédictive des rentes viagères" },
        { from: "Régularisation Hiérarchique", to: "Stabilité Temporelle", link: "Empêche les oscillations chaotiques des poids d'une année sur l'autre" },
        { from: "Validation Empirique (Belgique)", to: "Solvabilité II", link: "Fournit un cadre d'audit robuste pour les exigences de capital prudentiel" }
      ]
    }
  },
  philosophie: {
    mode: 'general',
    title: 'De la brièveté de la vie — Sénèque',
    text: `Ce n'est pas que nous ayons peu de temps, c'est que nous en perdons beaucoup. La vie est assez longue et une part généreuse nous en a été accordée pour l'accomplissement des plus grandes choses, si tout était bien employé. Mais quand elle s'est écoulée dans le luxe et l'indolence, quand elle n'a été consacrée à aucun bien, enfin contraints par l'ultime nécessité, nous nous apercevons qu'elle est passée sans avoir senti qu'elle marchait. Il en est ainsi : nous ne recevons pas une vie brève, mais nous la faisons telle ; nous n'en sommes pas dépourvus, mais prodigues.`,
    result: {
      summary: `<h3>Diagnostic : L'Illusion de la Brièveté</h3><p>Sénèque réfute l'idée reçue selon laquelle l'existence humaine serait intrinsèquement trop courte. Le problème ne réside pas dans la dotation temporelle initiale, mais dans la <strong>dispersion et la prodigalité</strong> avec lesquelles nous dilapidons nos heures les plus précieuses.</p><h3>Principes d'Architecture de l'Attention</h3><ul><li><strong>L'aliénation par l'agitation :</strong> L'activité fébrile sans intention est une forme masquée d'oisiveté.</li><li><strong>Souveraineté sur son calendrier :</strong> Protéger son temps avec la même rigueur jalouse que son patrimoine matériel.</li><li><strong>La présence au présent :</strong> Ne pas reporter la vie à une retraite hypothétique.</li></ul><blockquote>« Nous ne recevons pas une vie brève, mais nous la faisons telle ; nous n'en sommes pas dépourvus, mais prodigues. »</blockquote><h3>Application Contemporaine</h3><p>À l'ère des distractions algorithmiques, cette réflexion résonne comme un manifeste pour le <em>Deep Work</em> et la reconquête de plages incompressibles d'attention profonde.</p>`,
      questions: [
        "À quelles activités concrètes accordez-vous du temps par complaisance plutôt que par conviction ?",
        "Pourquoi sommes-nous si avares de notre argent, mais si prodigues de notre temps ?",
        "Quelle est la part hebdomadaire réellement consacrée à ce qui construit notre esprit ?",
        "Comment réconcilier les devoirs quotidiens et la préservation de son for intérieur ?"
      ],
      concepts: [
        "Architecture du Temps",
        "Souveraineté de l'Esprit",
        "Deep Work Stoïcien",
        "Dispersion Moderne",
        "Finitude & Clarté",
        "Refus de l'Aliénation"
      ],
      connections: [
        { from: "Perte de temps", to: "Illusion de brièveté", link: "La dispersion donne rétrospectivement l'impression que la vie a filé" },
        { from: "Souveraineté temporelle", to: "Équilibre existentiel", link: "Poser des limites aux sollicitations externes libère l'énergie de création" },
        { from: "Méditation sur la finitude", to: "Action décisive", link: "Prendre conscience du caractère irremplaçable de chaque heure stimule l'engagement" }
      ]
    }
  },
  foi: {
    mode: 'meditation',
    title: 'Compter nos jours & la Sagesse — Psaume 90',
    text: `Seigneur, tu as été pour nous un refuge de génération en génération. Avant que les montagnes fussent nées, et que tu eusses formé la terre et le monde, d'éternité en éternité tu es Dieu. Tu fais rentrer les hommes dans la poussière, et tu dis : Fils de l'homme, retournez ! Car mille ans sont, à tes yeux, comme le jour d'hier, quand il n'est plus, et comme une veille de la nuit. Enseigne-nous à bien compter nos jours, afin que nous appliquions notre cœur à la sagesse. Répands sur nous dès le matin ta bienveillance, et nous serons toute notre vie dans la joie et l'allégresse. Que la grâce de l'Éternel, notre Dieu, soit sur nous ! Affermis l'ouvrage de nos mains, oui, affermis l'ouvrage de nos mains !`,
    result: {
      summary: `<h3>L'Éternité Divine face à la Fragilité Humaine</h3><p>Attribué à Moïse au désert, le <strong>Psaume 90</strong> pose un contraste saisissant entre l'éternité inébranlable de Dieu (<em>El Olam</em>) et la nature éphémère du pèlerinage terrestre. Loin d'engendrer le fatalisme, cette lucidité devient la source même de la <strong>sagesse pratique</strong>.</p><h3>L'Équation Spirituelle : Compter & Discerner</h3><ul><li><strong>Le mot-clé hébreu <em>Mônê</em> (מָנָה) :</strong> « Compter » ses jours ne relève pas d'une simple arithmétique anxieuse, mais d'une pesée consciente de la valeur accordée à chaque instant confié.</li><li><strong>Le cœur appliqué à la <em>Chokhmah</em> (חָכְמָה) :</strong> La sagesse biblique est un art de vivre fondé sur la crainte respectueuse et l'alignement avec les desseins éternels.</li><li><strong>La grâce matinale (<em>Hesed</em>) :</strong> Commencer chaque journée dans l'assurance de la fidélité divine avant toute exigence de productivité.</li></ul><blockquote>« Enseigne-nous à bien compter nos jours, afin que nous appliquions notre cœur à la sagesse. » — Psaume 90:12</blockquote><h3>L'Ouvrage Affermi</h3><p>La prière finale supplie Dieu d'affermir l'œuvre de nos mains : nos efforts humains ne trouvent leur solidité durable que lorsqu'ils sont bénis et enracinés dans Sa grâce.</p>`,
      questions: [
        "De quelle manière la reconnaissance de ma fragilité transforme-t-elle mes priorités quotidiennes ?",
        "Est-ce que je cherche d'abord la grâce de Dieu dès le matin (Hesed) avant d'entamer ma to-do list ?",
        "Qu'est-ce qui dans mon travail actuel a une valeur qui subsistera pour l'éternité ?",
        "Comment faire de chaque journée un espace d'offrande et de paix intérieure ?"
      ],
      concepts: [
        "Psaume 90:12",
        "Chokhmah (Sagesse)",
        "Hesed (Bienveillance)",
        "Éternité de Dieu",
        "Ouvrage Affermi",
        "Alignement Matinal"
      ],
      connections: [
        { from: "Fragilité humaine", to: "Quête de sagesse", link: "La conscience de notre finitude nous détache des futilités pour chercher l'essentiel" },
        { from: "Bienveillance matinale", to: "Joie durable", link: "L'enracinement dans l'amour de Dieu dès l'aube stabilise la paix intérieure face aux imprévus" },
        { from: "Grâce de Dieu", to: "Fécondité du travail", link: "L'effort humain ne devient fécond que s'il est affermi par le Seigneur" }
      ]
    }
  }
};

function loadSample(key) {
  const sample = SAMPLES[key];
  if (!sample) return;

  currentMode = sample.mode;
  $$('.lec-mode').forEach(b => {
    const isAct = b.dataset.mode === currentMode;
    b.classList.toggle('active', isAct);
    b.setAttribute('aria-checked', isAct ? 'true' : 'false');
  });

  documentText = sample.text;
  documentName = sample.title;

  showProcessing();

  setTimeout(() => {
    showResults(sample.result);
  }, 1200);
}

$$('.lec-sample-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    loadSample(btn.dataset.sample);
  });
});

// ---- Mode Selector ----
$$('.lec-mode').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.lec-mode').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-checked', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-checked', 'true');
    currentMode = btn.dataset.mode;
  });
});

// ---- Drop Zone & File Handling ----
// Drag events
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) handleFile(file);
});

// Click to open file picker (only from drop content, not paste area)
dropZone.addEventListener('click', (e) => {
  if (!pasteArea.hidden) return;
  if (e.target.closest('#paste-btn') || e.target.closest('label[for="file-input"]')) return;
  fileInput.click();
});

// Enter/Space on drop zone
dropZone.addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && pasteArea.hidden) {
    e.preventDefault();
    fileInput.click();
  }
});

fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) handleFile(fileInput.files[0]);
  fileInput.value = '';
});

// Paste button
$('#paste-btn').addEventListener('click', (e) => {
  e.stopPropagation();
  dropContent.hidden = true;
  pasteArea.hidden = false;
  pasteTextarea.focus();
});

$('#cancel-paste').addEventListener('click', (e) => {
  e.stopPropagation();
  pasteArea.hidden = true;
  dropContent.hidden = false;
  pasteTextarea.value = '';
});

$('#confirm-paste').addEventListener('click', (e) => {
  e.stopPropagation();
  const text = pasteTextarea.value.trim();
  if (text.length < 50) {
    showToast('Le texte est trop court pour une analyse pertinente (minimum 50 caractères).');
    return;
  }
  documentText = text;
  documentName = 'Texte collé';
  startAnalysis();
});

// Handle file
async function handleFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();

  if (ext === 'txt' || ext === 'md') {
    const text = await file.text();
    if (text.trim().length < 50) {
      showToast('Le fichier est trop court pour une analyse pertinente.');
      return;
    }
    documentText = text;
    documentName = file.name;
    startAnalysis();
  } else if (ext === 'pdf') {
    showToast('Extraction du texte PDF en cours...');
    try {
      documentText = await extractPdfText(file);
      if (documentText.trim().length < 50) {
        showToast('Le PDF ne contient pas assez de texte exploitable.');
        return;
      }
      documentName = file.name;
      startAnalysis();
    } catch (err) {
      showToast('Impossible de lire ce PDF. Essayez de coller le texte directement.');
      console.error('PDF extraction error:', err);
    }
  } else {
    showToast('Format non supporté. Utilisez .txt, .md ou .pdf');
  }
}

// Simple PDF text extraction (no external dependency)
async function extractPdfText(file) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);

  // Try to extract text between stream/endstream markers
  const streams = [];
  const streamRegex = /stream\r?\n([\s\S]*?)endstream/g;
  let match;
  while ((match = streamRegex.exec(text)) !== null) {
    streams.push(match[1]);
  }

  // Extract text operators (Tj, TJ, ')
  let extracted = '';
  const textOps = /\(([^)]*)\)\s*Tj|\[([^\]]*)\]\s*TJ/g;
  for (const stream of streams) {
    let m;
    while ((m = textOps.exec(stream)) !== null) {
      if (m[1]) extracted += m[1] + ' ';
      if (m[2]) {
        const parts = m[2].match(/\(([^)]*)\)/g);
        if (parts) extracted += parts.map(p => p.slice(1, -1)).join('') + ' ';
      }
    }
  }

  // Clean up
  extracted = extracted
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '')
    .replace(/\\t/g, ' ')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\s+/g, ' ')
    .trim();

  if (extracted.length < 50) {
    // Fallback: extract anything that looks like text
    const fallback = text.replace(/[^\x20-\x7E\xA0-\xFF\n]/g, ' ').replace(/\s+/g, ' ').trim();
    return fallback;
  }

  return extracted;
}

// ---- Analysis ----
async function startAnalysis() {
  let apiKey = getApiKey();
  if (!apiKey) {
    apiKey = await promptForApiKey();
    if (!apiKey) return;
  }

  showProcessing();

  try {
    const result = await analyzeWithGemini(apiKey, documentText, currentMode);
    showResults(result);
  } catch (err) {
    console.error('Analysis error:', err);
    if (err.message.includes('API_KEY') || err.message.includes('401') || err.message.includes('403')) {
      showToast('Clé API invalide. Veuillez la vérifier.');
      localStorage.removeItem(API_KEY_STORAGE);
      showHero();
      promptForApiKey();
    } else {
      showToast('Erreur lors de l\'analyse. Réessayez.');
      showHero();
    }
  }
}

function showProcessing() {
  heroSection.hidden = true;
  resultsSection.hidden = true;
  processingSection.hidden = false;
  animateProgress();
}

function showHero() {
  processingSection.hidden = true;
  resultsSection.hidden = true;
  heroSection.hidden = false;
  pasteArea.hidden = true;
  dropContent.hidden = false;
  pasteTextarea.value = '';
}

function animateProgress() {
  let progress = 0;
  const steps = [
    { at: 15, label: 'Lecture du document...' },
    { at: 35, label: 'Extraction des idées principales...' },
    { at: 55, label: 'Construction de la synthèse...' },
    { at: 75, label: 'Identification des connexions...' },
    { at: 90, label: 'Mise en forme finale...' },
  ];

  const interval = setInterval(() => {
    progress += Math.random() * 8 + 2;
    if (progress > 95) progress = 95;
    progressFill.style.width = progress + '%';

    for (const step of steps) {
      if (progress >= step.at && processingStatus.textContent !== step.label) {
        processingStatus.textContent = step.label;
      }
    }
  }, 400);

  // Store the interval for cleanup
  window._lecProgressInterval = interval;
}

async function analyzeWithGemini(apiKey, text, mode) {
  // Truncate very long texts
  const maxChars = 30000;
  const truncated = text.length > maxChars ? text.slice(0, maxChars) + '\n\n[... texte tronqué pour l\'analyse]' : text;

  const prompt = buildPrompt(truncated, mode);

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json'
      }
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

  try {
    return JSON.parse(raw);
  } catch {
    // Try to extract JSON from the response
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    throw new Error('Réponse IA invalide');
  }
}

function buildPrompt(text, mode) {
  const modeInstructions = {
    academic: `Tu es un assistant de lecture académique. Analyse ce texte de manière rigoureuse et scientifique.
Pour la synthèse, structure-la en sections avec des sous-titres. Identifie la thèse principale, la méthodologie, les résultats clés et les limites.
Pour les questions, pose des questions qui invitent à approfondir la réflexion critique.
Pour les concepts, identifie les termes techniques et théoriques clés.
Pour les connexions, montre les liens logiques entre les différentes parties du texte.`,

    general: `Tu es un assistant de lecture. Analyse ce texte de manière claire et accessible.
Pour la synthèse, résume les points essentiels de manière structurée et compréhensible.
Pour les questions, pose des questions qui aident à mieux comprendre le texte.
Pour les concepts, identifie les idées et thèmes principaux.
Pour les connexions, montre comment les idées s'articulent entre elles.`,

    meditation: `Tu es un guide de méditation biblique et spirituelle. Analyse ce texte avec une perspective de foi chrétienne.
Pour la synthèse, dégage le message spirituel central, le contexte historique et l'application personnelle.
Si le texte est biblique, mentionne les mots-clés originaux (hébreu ou grec) pertinents.
Pour les questions, pose des questions de réflexion spirituelle et d'application personnelle.
Pour les concepts, identifie les thèmes théologiques et les vérités spirituelles.
Pour les connexions, montre les liens avec d'autres passages bibliques ou principes de foi.`
  };

  return `${modeInstructions[mode]}

Analyse le texte suivant et retourne un JSON avec cette structure exacte :
{
  "summary": "La synthèse structurée en HTML (utilise <h3>, <p>, <ul>, <li>, <blockquote>, <strong>). Sois détaillé et nuancé.",
  "questions": ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"],
  "concepts": ["Concept 1", "Concept 2", "Concept 3", "Concept 4", "Concept 5", "Concept 6"],
  "connections": [
    {"from": "Idée A", "to": "Idée B", "link": "Description du lien entre ces idées"},
    {"from": "Idée C", "to": "Idée D", "link": "Description du lien"},
    {"from": "Idée E", "to": "Idée F", "link": "Description du lien"}
  ]
}

IMPORTANT: La synthèse doit être en HTML. Les questions sont des strings simples. Les concepts sont des strings courtes (2-4 mots). Les connexions ont from, to, et link.

Texte à analyser :
"""
${text}
"""`;
}

// ---- Display Results ----
function showResults(result) {
  clearInterval(window._lecProgressInterval);
  progressFill.style.width = '100%';

  setTimeout(() => {
    processingSection.hidden = true;
    heroSection.hidden = true;
    resultsSection.hidden = false;

    // Document info
    $('#doc-name').textContent = documentName;
    const wordCount = documentText.split(/\s+/).filter(Boolean).length;
    const charCount = documentText.length;
    $('#doc-stats').textContent = `${wordCount.toLocaleString('fr-FR')} mots · ${charCount.toLocaleString('fr-FR')} caractères`;

    // Summary
    $('#summary-content').innerHTML = result.summary || '<p>Aucune synthèse disponible.</p>';

    // Questions
    const questionsHtml = (result.questions || []).map((q, i) => `
      <div class="lec-question-item">
        <span class="lec-question-num">${String(i + 1).padStart(2, '0')}</span>
        <p>${escapeHtml(q)}</p>
      </div>
    `).join('');
    $('#questions-content').innerHTML = questionsHtml || '<p>Aucune question générée.</p>';

    // Concepts
    const conceptsHtml = '<div class="lec-concept-grid">' +
      (result.concepts || []).map(c => `<span class="lec-concept-tag">${escapeHtml(c)}</span>`).join('') +
      '</div>';
    $('#concepts-content').innerHTML = conceptsHtml;

    // Connections
    const connectionsHtml = (result.connections || []).map(c => `
      <div class="lec-connection">
        <span class="lec-connection-arrow" aria-hidden="true">↔</span>
        <div class="lec-connection-text">
          <strong>${escapeHtml(c.from)} → ${escapeHtml(c.to)}</strong>
          <span>${escapeHtml(c.link)}</span>
        </div>
      </div>
    `).join('');
    $('#connections-content').innerHTML = connectionsHtml || '<p>Aucune connexion identifiée.</p>';

    // Reset to first tab
    activateTab('summary');

    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 600);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

// ---- Tabs ----
$$('.lec-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    activateTab(tab.dataset.tab);
  });
});

function activateTab(tabName) {
  $$('.lec-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === tabName);
    t.setAttribute('aria-selected', t.dataset.tab === tabName ? 'true' : 'false');
  });
  $$('.lec-panel').forEach(p => {
    const isActive = p.id === `panel-${tabName}`;
    p.classList.toggle('active', isActive);
    p.hidden = !isActive;
  });
}

// ---- Copy ----
$$('.lec-copy-section').forEach(btn => {
  btn.addEventListener('click', () => {
    const section = btn.dataset.section;
    const content = $(`#${section}-content`);
    if (content) {
      navigator.clipboard.writeText(content.innerText).then(() => {
        showToast('Contenu copié ✓');
      });
    }
  });
});

$('#copy-all-btn').addEventListener('click', () => {
  const all = [
    '=== SYNTHÈSE ===\n' + ($('#summary-content')?.innerText || ''),
    '\n=== QUESTIONS CLÉS ===\n' + ($('#questions-content')?.innerText || ''),
    '\n=== CONCEPTS ===\n' + ($('#concepts-content')?.innerText || ''),
    '\n=== CONNEXIONS ===\n' + ($('#connections-content')?.innerText || ''),
  ].join('\n');

  navigator.clipboard.writeText(all).then(() => {
    showToast('Analyse complète copiée ✓');
  });
});

// ---- New Analysis ----
$('#new-analysis-btn').addEventListener('click', () => {
  documentText = '';
  documentName = 'Document';
  showHero();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ---- Question Item Styles (injected) ----
const questionStyles = document.createElement('style');
questionStyles.textContent = `
.lec-question-item {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  padding: 16px 0;
  border-bottom: 1px solid var(--lec-line);
}
.lec-question-item:last-child { border-bottom: none; }
.lec-question-num {
  font-family: var(--lec-serif);
  font-size: 18px;
  color: var(--lec-accent);
  flex-shrink: 0;
  min-width: 28px;
  font-weight: 600;
}
.lec-question-item p {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
}
`;
document.head.appendChild(questionStyles);
