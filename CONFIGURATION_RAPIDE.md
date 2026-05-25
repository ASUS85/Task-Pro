# ⚙️ Configuration Rapide - Dashboards V3.0

## ✅ Prérequis

- [x] PHP 7.4+
- [x] MySQL 5.7+
- [x] WAMP/LAMP/MAMP active
- [x] Base de données `task_pro_db` créée
- [x] Tables: `utilisateurs`, `taches`

---

## 🔧 Étapes de Configuration

### 1. Vérifier la Structure des Tables

#### Table `utilisateurs`
```sql
CREATE TABLE utilisateurs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100),
    prenom VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(255),
    role ENUM('SuperAdmin', 'Administrateur', 'Employe'),
    sexe VARCHAR(20),
    poste VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Table `taches`
```sql
CREATE TABLE taches (
    id INT PRIMARY KEY AUTO_INCREMENT,
    libelle VARCHAR(255),
    description TEXT,
    status VARCHAR(50),
    id_responsable INT,
    id_createur INT,
    periode_realisation VARCHAR(10),
    dateCreation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dateDebutAssignation DATETIME,
    FOREIGN KEY (id_responsable) REFERENCES utilisateurs(id),
    FOREIGN KEY (id_createur) REFERENCES utilisateurs(id)
);
```

### 2. Vérifier les DAOs

#### UtilisateurDAO

Vérifier la présence de la méthode:
```php
public function obtenirTous(string $role = null): array {
    // Récupère tous les utilisateurs
}
```

#### TacheDAO

Vérifier la présence de la méthode:
```php
public function obtenirTous(): array {
    // Récupère toutes les tâches
}
```

### 3. Vérifier l'API (api.php)

Vérifier la présence des sections:

```php
// ================= DASHBOARD =================
if ($parts[0] === 'dashboard') {
    // Endpoints /dashboard/stats et /dashboard/recent-tasks
}
```

### 4. Fichiers Côté Frontend

Vérifier la présence de:
- ✅ `/Frontend/dashboard-unified.js` (nouveau)
- ✅ `/Frontend/dashboard.html` (modifié)
- ✅ `/Frontend/dashbordUser.html` (modifié)
- ✅ `/Frontend/assets/js/loaders.js`

### 5. Données de Test

Créer au minimum:

```sql
-- Créer un SuperAdmin
INSERT INTO utilisateurs (nom, prenom, email, password, role, sexe, poste)
VALUES ('Admin', 'Super', 'admin@taskpro.com', '$2y$10$...hash...', 'SuperAdmin', 'M', 'Manager');

-- Créer un Administrateur
INSERT INTO utilisateurs (nom, prenom, email, password, role, sexe, poste)
VALUES ('Manager', 'Task', 'manager@taskpro.com', '$2y$10$...hash...', 'Administrateur', 'M', 'Manager');

-- Créer un Employé
INSERT INTO utilisateurs (nom, prenom, email, password, role, sexe, poste)
VALUES ('Employee', 'John', 'employee@taskpro.com', '$2y$10$...hash...', 'Employe', 'M', 'Developer');

-- Créer quelques tâches
INSERT INTO taches (libelle, description, status, id_responsable, id_createur, periode_realisation)
VALUES ('Task 1', 'Description 1', 'en cours', 3, 1, '5j');

INSERT INTO taches (libelle, description, status, id_responsable, id_createur, periode_realisation)
VALUES ('Task 2', 'Description 2', 'assigné', 3, 1, '3j');

INSERT INTO taches (libelle, description, status, id_createur, periode_realisation)
VALUES ('Task 3', 'Description 3', 'non assigné', 1, '2j');
```

---

## 🧪 Tests de Vérification

### Test 1: API Disponible
```bash
curl http://localhost/Task-Pro/public/api.php/dashboard/stats
```

Doit retourner:
```json
{
    "success": false,
    "message": "Non authentifié"
}
```

✅ Bon! L'endpoint existe et demande l'authentification.

### Test 2: Authentification Session
```javascript
// Dans la console du navigateur, après connexion
fetch('/Task-Pro/public/api.php/dashboard/stats', {
    credentials: 'include'
})
.then(r => r.json())
.then(d => console.log(d));
```

Doit afficher les stats.

### Test 3: Données Dynamiques
```javascript
// Vérifier que les nombres changent
setInterval(() => {
    fetch('/Task-Pro/public/api.php/dashboard/stats', {
        credentials: 'include'
    })
    .then(r => r.json())
    .then(d => console.log('Stats:', d.stats.totalTaches));
}, 5000);
```

Les nombres doivent être cohérents avec la BD.

---

## 🚀 Démarrage Rapide

### Étape 1: Accéder au Dashboard
```
http://localhost/Task-Pro/Frontend/dashboard.html
```

### Étape 2: Se Connecter
- Email: `admin@taskpro.com` (SuperAdmin)
- Mot de passe: (selon votre setup)

### Étape 3: Vérifier les Stats
- Les cartes doivent afficher les données de la BD
- Aucune erreur console (F12)

### Étape 4: Tester les Restrictions
- Se déconnecter
- Se connecter en tant qu'Employé
- Vérifier redirection vers dashbordUser.html

---

## 🔐 Configuration de Sécurité

### Sessions

Vérifier dans `config/Database.php`:
```php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
```

### Variables de Session

Après connexion, vérifier:
```php
$_SESSION['user_id']    // ID de l'utilisateur
$_SESSION['user_role']  // Rôle (SuperAdmin, Administrateur, Employe)
```

### CORS (si besoin)

Dans `public/api.php`:
```php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
```

---

## 📋 Checklist de Déploiement

- [ ] Base de données créée et données présentes
- [ ] Tables `utilisateurs` et `taches` avec bonnes colonnes
- [ ] DAOs avec méthodes `obtenirTous()`
- [ ] API endpoints existants (/dashboard/stats, /dashboard/recent-tasks)
- [ ] Fichiers HTML et JS à jour
- [ ] loaders.js présent et fonctionnel
- [ ] Sessions configurées correctement
- [ ] Tests d'authentification réussis
- [ ] Redirection par rôle fonctionnelle
- [ ] Données affichées correctement

---

## ⚠️ Problèmes Courants et Solutions

### "API non trouvée" ou "404"

**Cause**: Mauvaise URL ou endpoint non implémenté

**Solution**:
```javascript
// Vérifier l'URL complète
console.log('/Task-Pro/public/api.php/dashboard/stats');

// Tester l'endpoint
fetch('/Task-Pro/public/api.php', {
    credentials: 'include'
})
.then(r => r.json())
.then(d => console.log(d)); // Doit afficher "API Task-Pro fonctionne"
```

### "Non authentifié" (401)

**Cause**: Session non établie ou expirée

**Solution**:
```javascript
// Vérifier la session
console.log(sessionStorage.getItem('user'));

// Re-connecter et réessayer
// Ou vérifier que les cookies sont activés
```

### "Données vides ou 0"

**Cause**: Base de données vide

**Solution**:
```sql
-- Vérifier les données
SELECT COUNT(*) FROM taches;
SELECT COUNT(*) FROM utilisateurs;

-- Ajouter des données de test
INSERT INTO ...
```

### "Erreur CORS"

**Cause**: Requête bloquée par navigateur

**Solution**:
1. Vérifier les headers CORS dans api.php
2. S'assurer que credentials: 'include' est utilisé
3. Utiliser la même origin (localhost/localhost)

### "Styles manquants"

**Cause**: CSS non chargé ou mauvaise URL

**Solution**:
```html
<!-- Vérifier les chemins -->
<link rel="stylesheet" href="style_dashboard.css">
<link rel="stylesheet" href="dashbordstyle.css">

<!-- Doivent être au même niveau que le HTML -->
```

---

## 🔍 Logs et Debugging

### Logs PHP

Ajouter dans `public/api.php`:
```php
error_log('Dashboard Stats: ' . json_encode($stats));
```

Puis vérifier `error_log` de PHP.

### Logs JavaScript

Ouvrir les DevTools (F12):
```javascript
// Voir tous les logs
console.log(dashboardData);

// Voir les erreurs de fetch
.catch(error => console.error('Erreur:', error));
```

### Inspection BD

```sql
-- Vérifier les tâches d'un utilisateur
SELECT * FROM taches WHERE id_responsable = 3;

-- Compter les tâches par statut
SELECT status, COUNT(*) FROM taches GROUP BY status;

-- Voir les utilisateurs
SELECT id, nom, prenom, role FROM utilisateurs;
```

---

## 📞 Support et Contact

Si des problèmes persistent:

1. Vérifier la console (F12) pour les erreurs JavaScript
2. Vérifier les logs PHP
3. Tester directement les endpoints API avec curl
4. Vérifier que les données existent en BD
5. Vérifier que l'authentification fonctionne

---

## 📦 Fichiers Modifiés/Créés

### Créés
- ✅ `/Frontend/dashboard-unified.js` (nouveau script unifié)
- ✅ `DASHBOARD_INTEGRATION_V3.md` (documentation)
- ✅ `DASHBOARD_TEST_CHECKLIST.md` (checklist de test)
- ✅ `API_DASHBOARD_DOCUMENTATION.md` (doc API)
- ✅ `CONFIGURATION_RAPIDE.md` (ce fichier)

### Modifiés
- ✅ `/public/api.php` (ajout endpoints dashboard)
- ✅ `/Frontend/dashboard.html` (utilise dashboard-unified.js)
- ✅ `/Frontend/dashbordUser.html` (utilise dashboard-unified.js)

### Supprimés
- ✅ 13 fichiers de documentation/test volumineux

---

## 🎉 Vous Êtes Prêt!

Le système est opérationnel. Pour commencer:

```bash
1. Accédez à http://localhost/Task-Pro/Frontend/login.html
2. Connectez-vous avec vos identifiants
3. Les dashboards devraient charger les données dynamiques
4. Vérifiez que les restrictions par rôle fonctionnent
```

**Version**: 3.0  
**Date**: 29 avril 2026  
**Statut**: ✅ Prêt pour production
