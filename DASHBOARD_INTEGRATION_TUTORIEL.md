# Tutoriel d'intégration du dashboard dynamique

Ce fichier explique les changements effectués pour connecter le dashboard au backend et comment continuer le développement sur d'autres fonctionnalités.

## 1. Objectif

- Rendre le `dashboard.html` dynamique.
- Autoriser l'accès uniquement aux rôles `Administrateur` et `SuperAdmin`.
- Afficher des données en fonction de la base de données.
- Pour `SuperAdmin`, afficher les statistiques globales.
- Pour `Administrateur`, afficher uniquement les statistiques de ses propres tâches créées.
- Afficher `--//--` quand une valeur est vide ou manquante.
- Traiter `0` comme une valeur valide.

## 2. Fichiers modifiés

### Frontend

- `Frontend/dashboard.html`
- `Frontend/api.js`
- `Frontend/script.js`
- `Frontend/dashboard.js` (nouveau fichier)

### Backend

- `public/api.php`
- `DAOs/TacheDAO.php`

## 3. Changements côté frontend

### 3.1 `Frontend/dashboard.html`

- Remplacement des valeurs statiques (`48`, `17`, `31`, `8`, etc.) par des éléments avec des `id` identifiables :
  - `totalTasks`
  - `inProgressTasks`
  - `doneTasks`
  - `usersActive`
  - `progressPercent`
  - `progressSummary`
  - `dashboardWelcome`
  - `dashboardMessage`
  - `overviewList`
  - `teamName1`, `teamName2`, `teamName3`
  - `teamBar1`, `teamBar2`, `teamBar3`

- Ajout de l'inclusion de `dashboard.js` à la fin de la page.
- Conservation du design existant en ne modifiant que le contenu et les éléments ciblés.

### 3.2 `Frontend/api.js`

- Ajout de la fonction `apiGetDashboard()` :
  - Appelle `GET /dashboard`
  - Retourne l'objet `dashboard` renvoyé par le backend.

- Cela suit le même modèle que les autres fonctions API déjà présentes.

### 3.3 `Frontend/script.js`

- Mise à jour de la fonction `initializePage()` :
  - Si on se trouve sur `dashboard.html`, on appelle `loadDashboard()`.
  - Sinon, on continue d'appeler `chargerTaches()` pour les autres pages.

- Vérification de l'accès au dashboard :
  - Si l'utilisateur connecté n'a pas le rôle `Administrateur` ou `SuperAdmin`, il est redirigé vers `login.html`.

### 3.4 `Frontend/dashboard.js`

- Nouveau fichier principal du dashboard.
- Contient :
  - `loadDashboard()` : récupère les données via l'API.
  - `renderDashboard(data)` : remplit les éléments HTML avec les données reçues.
  - `formatDynamicValue(value)` : affiche `--//--` quand la valeur est `null`, `undefined` ou une chaîne vide.

- Exemple de logique :
  - `data.stats.totalTasks` remplit `#totalTasks`
  - `data.overview.activity` remplit la liste `#overviewList`
  - `data.teamPerformance` remplit les barres de performance équipe.

## 4. Changements côté backend

### 4.1 `DAOs/TacheDAO.php`

- Ajout de la méthode `obtenirParCreateur(int $idCreateur)` :
  - Retourne les tâches créées par un administrateur donné.
  - Cette méthode est essentielle pour afficher uniquement les tâches pertinentes aux administrateurs.

### 4.2 `public/api.php`

- Ajout de l'endpoint `GET /dashboard`.
- Validation et sécurité :
  - `requireAuth()` vérifie la présence d'une session.
  - Le dashboard n'est accessible que si le rôle est `Administrateur` ou `SuperAdmin`.

- Comportement selon le rôle :
  - `SuperAdmin` :
    - récupère toutes les tâches via `obtenirTous()`.
    - récupère tous les utilisateurs via `obtenirTous()`.
  - `Administrateur` :
    - récupère uniquement les tâches créées par l'administrateur via `obtenirParCreateur()`.
    - calcule les utilisateurs concernés par responsable.

- Calcul de statistiques :
  - `totalTasks`
  - `inProgressTasks`
  - `doneTasks`
  - `completionPercent`
  - `createdToday`
  - `completedToday`

- Construction de la réponse JSON :
  - `dashboard.user`
  - `dashboard.stats`
  - `dashboard.overview`
  - `dashboard.teamPerformance`

- Si une donnée manque, le frontend affiche `--//--`.

## 5. Architecture et bonnes pratiques

### 5.1 Principe de séparation frontend/backend

- Le backend expose une API propre (`GET /dashboard`).
- Le frontend ne contient pas de logique métier liée à la base de données.
- Le frontend se contente de consommer l'API et de mettre à jour l'interface.

### 5.2 Gestion des rôles

- Le backend valide réellement l'accès.
- Le frontend effectue une seconde vérification pour l'UX.
- La sécurité doit toujours être garantie côté serveur.

### 5.3 Traitement des valeurs manquantes

- `0` doit rester une valeur affichée.
- Seules les valeurs `null`, `undefined`, ou `''` deviennent `--//--`.
- Cette règle est respectée dans `dashboard.js`.

## 6. Comment continuer sur d'autres fonctionnalités

### 6.1 Ajouter une nouvelle donnée dynamique

1. Créer un `id` dans le HTML.
2. Ajouter une clé à la réponse JSON backend.
3. Appeler ce nouvel endpoint via une fonction `api...()` dans `Frontend/api.js`.
4. Mettre à jour le JavaScript de rendu pour remplir le nouvel élément.

### 6.2 Ajouter un nouvel endpoint sécurisé

1. Dans `public/api.php`, ajouter un nouveau bloc sous `// ================= DASHBOARD =================`.
2. Valider la session avec `requireAuth()`.
3. Valider le rôle si nécessaire (`Administrateur`, `SuperAdmin`, autre).
4. Lire la donnée via un DAO ou service.
5. Retourner une réponse JSON structurée.

### 6.3 Étendre les statistiques du dashboard

1. Ajouter une méthode DAO ou service si besoin.
2. Récupérer les données nécessaires dans `public/api.php`.
3. Ajouter un champ à `dashboard.stats` ou `dashboard.overview`.
4. Mettre à jour `renderDashboard()` pour l’afficher.

### 6.4 Travailler sur une autre page

1. Identifier la page HTML.
2. Ajouter des `id` dans le HTML pour les zones dynamiques.
3. Créer une fonction API correspondante dans `Frontend/api.js`.
4. Ajouter un nouveau script ou étendre le script existant pour charger la page.
5. Tester avec une session utilisateur.

## 7. Exemples de cas d'usage futurs

- `GET /tasks/summary` pour les stats détaillées de délais.
- `GET /users/activity` pour afficher les utilisateurs actifs.
- `GET /admin/overview` pour les données dédiées au SuperAdmin.

## 8. Résumé court des changements

- `dashboard.html` : zones dynamiques.
- `api.js` : nouvel appel `apiGetDashboard()`.
- `script.js` : redirection et chargement conditionnel.
- `dashboard.js` : rendu dynamique et remplacement de valeurs absentes.
- `public/api.php` : nouvel endpoint sécurisé `GET /dashboard`.
- `TacheDAO.php` : nouveau DAO `obtenirParCreateur()`.

---

Avec cette base, tu peux maintenant :
- créer de nouveaux endpoints API,
- ajouter d'autres vues dynamiques,
- conserver la logique de rôle dans `public/api.php`,
- garder le frontend simple et centré sur le rendu.
