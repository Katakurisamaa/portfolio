# Portfolio de Benjamin Minko

## Gérer mes projets sans code

1. Double-cliquer sur **Ouvrir la gestion.cmd** dans ce dossier.
2. Une fenêtre de commande démarre le gestionnaire et le navigateur ouvre http://127.0.0.1:8082/admin.
3. Cliquer sur **Ajouter un projet**, remplir le nom, la catégorie et la description. Ajouter si souhaité une image, les technologies, les détails et les liens du site, de la démo et du code source.
4. Cliquer sur **Enregistrer le projet**, puis **Voir mon portfolio**. Actualiser les onglets du portfolio déjà ouverts.
5. Garder la fenêtre de commande ouverte pendant la gestion. La fermer arrête le gestionnaire, sans effacer les projets. Si le gestionnaire tourne déjà, ouvrir directement l’adresse ci-dessus.

Python 3.12 ou plus récent doit être installé (Python 3.14 est présent sur cet ordinateur). Aucune bibliothèque supplémentaire n’est nécessaire.

## Ce qui est enregistré

- `projects.json` : les contenus des projets.
- `uploads/` : les images importées, PNG, JPEG ou WebP, maximum 5 Mo.
- `index.html` : la page publique, mise à jour à chaque enregistrement. Les projets restent visibles sans JavaScript.
- `.backups/` : copie de la liste précédente avant chaque enregistrement. Le bouton **Annuler la dernière suppression** restaure immédiatement un projet retiré durant la session. Les images supprimées des fiches restent conservées pour permettre la restauration.
- `artwork.json` : les illustrations des trois projets d’origine.

Les catégories sont libres ; les filtres et le compteur s’adaptent automatiquement. Les champs de liens vides n’affichent pas de boutons. Le nom d’une technologie, une catégorie et les textes ne sont jamais interprétés comme du code HTML.

Pour restaurer une sauvegarde plus ancienne : arrêter le gestionnaire, conserver une copie de projects.json, puis remplacer son contenu par celui du fichier souhaité dans .backups. Le gestionnaire reconstruit les fiches au prochain démarrage.

## Local et publication

L’éditeur fonctionne uniquement sur cet ordinateur, sur l’adresse 127.0.0.1. Ce n’est pas une administration en ligne. Les enregistrements ne publient rien sur Internet.

Pour publier le portfolio sur un hébergement statique, utiliser seulement **index.html**, **styles.css**, **script.js** et le dossier **uploads**. Ne pas publier les fichiers de gestion, projects.json, artwork.json ou .backups. Pour disposer d’une administration depuis plusieurs appareils, prévoir un hébergement adapté et une authentification.

## Fichiers de gestion

- `server.py` : serveur local, validation et sauvegarde atomique des fichiers, contrôle de l’origine et du jeton des requêtes.
- `admin.html`, `admin.css`, `admin.js` : formulaires et aperçu.

Les trois projets initiaux sont repris de la version précédente et leurs illustrations ne sont pas des captures d’applications. Ils peuvent être modifiés ou supprimés depuis la gestion.

## Rubriques du portfolio
L’accueil présente les rubriques. Chaque rubrique possède sa propre page dans `rubriques/` et rassemble uniquement ses contenus. Les cinq espaces de départ sont les sciences actuarielles, le développement web, l’IA, les lectures et la foi. Une nouvelle catégorie crée automatiquement une rubrique lors de l’enregistrement.

Dans la gestion, choisir une rubrique avant d’ajouter une fiche. Son classement est prérempli. Modifier le champ Rubrique déplace la fiche vers l’espace correspondant. Les pages sont reconstruites automatiquement lors de l’enregistrement et au démarrage.

Pour publier le site statique, inclure aussi le dossier `rubriques/`, en plus d’index.html, styles.css, script.js et uploads. `rubriques.py` appartient au gestionnaire local et ne doit pas être publié.
