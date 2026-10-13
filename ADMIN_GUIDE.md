# Guide de l’Atelier d’administration — Benjamin Minko

Bienvenue dans ton espace d'administration (« L’Atelier »). Cet outil te permet de gérer l'ensemble de tes projets et publications facilement, sur ordinateur comme sur smartphone.

---

## 1. Accès immédiat

### Sur ton ordinateur
- Rendez-vous sur : **[http://localhost:8080/admin](http://localhost:8080/admin)**
- Mot de passe initial : `benjamin2026`

### Sur ton smartphone (connecté à ton Wi-Fi)
- Ouvre le navigateur de ton téléphone et tape l'adresse locale de ton PC :  
  **`http://192.168.1.4:8080/admin`** *(ou l'IP affichée dans la console au démarrage)*
- Entre le mot de passe : `benjamin2026`
- **Astuce :** Tu peux ajouter la page à l'écran d'accueil de ton smartphone (dans Safari ou Chrome : *Partager > Sur l'écran d'accueil*) pour l'ouvrir comme une véritable application mobile !

---

## 2. Sécurité

1. **Changement de mot de passe :**
   - Une fois connecté, clique sur **« Mot de passe »** dans la barre en haut à droite.
   - Saisis `benjamin2026`, puis définis ton mot de passe personnel sécurisé.
2. **Hachage cryptographique :**
   - Le mot de passe est protégé avec un hachage standard industriel **PBKDF2-HMAC-SHA256** (100 000 itérations + sel cryptographique).
3. **Session longue durée :**
   - La session reste active pendant 30 jours sur ton appareil pour t'éviter d'avoir à retaper le mot de passe à chaque visite.
4. **Protection anti-force brute :**
   - Blocage automatique temporaire de 5 minutes après 5 tentatives échouées.

---

## 3. Formats de publication pris en charge

Tu peux choisir parmi 4 formats grâce au sélecteur situé en haut du formulaire :

| Format | Rubriques recommandées | Champs spécifiques |
|---|---|---|
| **🚀 Projet technique** | Sciences actuarielles, Web, IA | Technologies, Liens Site / Démo / GitHub |
| **📖 Note de lecture** | Lectures & découvertes | Titre du livre, Auteur, Citation marquante, Note de lecture |
| **✝ Partage de foi** | Foi & Bible | Référence biblique (ex. *Jean 15:5*), Texte du verset, Méditation |
| **✍ Article / Réflexion** | Toutes | Chapeau, Corps de texte, Date |

À chaque enregistrement :
- La page d'accueil (`index.html`) est mise à jour automatiquement.
- La page dédiée dans `rubriques/` est générée immédiatement.
- Une sauvegarde automatique datée est archivée dans `.backups/`.

---

## 4. Déploiement en ligne 24h/24 (Cloud)

Pour que ton portfolio et ton administration soient accessibles **partout dans le monde en 4G/5G** sans avoir besoin de laisser ton ordinateur allumé :

1. Dépose ton dossier de projet sur **GitHub**.
2. Crée un compte gratuit sur **[Render.com](https://render.com)**.
3. Clique sur **New Web Service**, connecte ton dépôt GitHub :
   - Le fichier `render.yaml` et le `Procfile` préconfigurés détectent tout automatiquement.
4. Ton site sera en ligne avec son adresse HTTPS sécurisée (ex: `https://benjamin-minko.onrender.com/admin`) !
