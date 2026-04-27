# 🚀 Task-Pro - Guide Complet de Configuration et Déploiement

## 📋 Résumé des Corrections Apportées

### ✅ Bugs Corrigés
1. **Frontend/api.js** - Fichier était vide, maintenant contient toutes les fonctions API
2. **script.js** - Code de login/inscription était commenté, maintenant fonctionnel
3. **index.html** - Créé comme page d'accueil avec redirection intelligente
4. **public/api.php** - Endpoints LOGIN/REGISTER maintenant avec gestion d'erreurs
5. **.htaccess** - Configuré pour router les URLs correctement

### 🔧 Architecture Adoptée
- **Backend**: `public/api.php` (moderne avec PDO, Sessions PHP)
- **Frontend**: Fichiers statiques HTML/CSS/JS dans `Frontend/`
- **Database**: MySQL avec tables dans `config/schema.sql`

---

## ⚙️ CONFIGURATION INITIALE

### 1️⃣ Base de Données MySQL

#### A) Créer la base de données
```bash
mysql -u root -p
```

```sql
CREATE DATABASE task_pro_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE task_pro_db;
```

#### B) Importer le schéma
```bash
mysql -u root task_pro_db < config/schema.sql
```

Ou via PhpMyAdmin :
1. Aller à http://localhost/phpmyadmin
2. Créer une BD: `task_pro_db`
3. Importer: `config/schema.sql`

### 2️⃣ Configuration Database.php

Éditer `config/Database.php` et adapter si nécessaire :

```php
private const HOST = 'localhost';      // Serveur MySQL
private const DB_NAME = 'task_pro_db'; // Nom BD
private const USER = 'root';           // User MySQL
private const PASSWORD = '';           // Password MySQL
```

### 3️⃣ Configuration du Serveur

#### WAMP - Vérifier mod_rewrite
1. **Activer mod_rewrite** :
   - Apache Config → Apache modules
   - Vérifier ✅ `rewrite_module`

2. **VirtualHost (optionnel mais recommandé)**
   
   Dans `C:\wamp64\bin\apache\apache2.4.x\conf\extra\httpd-vhosts.conf` :

   ```apache
   <VirtualHost *:80>
       ServerName taskpro.local
       DocumentRoot "C:/wamp64/www/Task-Pro"
       
       <Directory "C:/wamp64/www/Task-Pro">
           Options Indexes FollowSymLinks
           AllowOverride All
           Require all granted
       </Directory>
   </VirtualHost>
   ```

   Dans `C:\Windows\System32\drivers\etc\hosts` :
   ```
   127.0.0.1 taskpro.local
   ```

3. **Redémarrer WAMP**
   - Tray icon → Redémarrer tous les services

---

## 🌐 ACCÈS À L'APPLICATION

### Via WAMP Standard (sans VirtualHost)
```
http://localhost/Task-Pro/
```

### Via VirtualHost (recommandé)
```
http://taskpro.local/
```

### Points d'entrée
- **Accueil**: `/` ou `/index.html` → Redirection intelligente
- **Login**: `/login.html`
- **Inscription**: `/inscription.html`
- **Dashboard**: `/dashboard.html` (accès sécurisé)

### API Endpoints
- **Register**: `POST /api/auth/register`
- **Login**: `POST /api/auth/login`
- **Logout**: `POST /api/auth/logout`
- **Current User**: `GET /api/auth/me`
- **Tasks**: `GET/POST /api/taches/...`

---

## 👤 Comptes de Test

### Utilisateur ROOT (SuperAdmin)
- **Email**: `root@taskpro.com`
- **Password**: `root123`
- **Rôle**: SuperAdmin (accès complet)

### Nouvel Utilisateur
1. Cliquer "Créer un compte" sur `/inscription.html`
2. Remplir le formulaire
3. Premier utilisateur inscrit → SuperAdmin
4. Suivants → Employé

---

## 📁 Structure des Fichiers

```
Task-Pro/
├── .htaccess                 # Configuration serveur
├── config/
│   ├── Database.php         # Connexion MySQL
│   └── schema.sql           # Structure BD
├── public/
│   └── api.php             # API REST (point d'entrée)
├── Frontend/
│   ├── index.html          # Accueil
│   ├── login.html          # Formulaire login
│   ├── inscription.html    # Formulaire inscription
│   ├── dashboard.html      # Tableau de bord
│   ├── profile.html        # Profil utilisateur
│   ├── api.js             # Appels API (CLIENT)
│   ├── script.js          # Logique générale
│   ├── style.css          # Styles généraux
│   └── style_*.css        # Styles spécifiques
├── Models/
│   ├── Personne.php       # Classe abstraite
│   ├── Administrateur.php # Admin
│   ├── Employe.php        # Employé
│   └── Tache.php          # Task model
├── DAOs/
│   ├── UtilisateurDAO.php # Gestion users
│   ├── TacheDAO.php       # Gestion tasks
│   └── NotificationDAO.php # Gestion notifications
├── Services/
│   ├── AuthServices.php       # Logique auth
│   ├── TacheService.php       # Logique tâches
│   └── NotificationService.php # Notifications
└── vendor/                    # Dépendances Composer
```

---

## 🔐 Authentification & Sessions

### Comment ça marche
1. **Frontend** : Formulaire HTML → `api.js` → API backend
2. **Backend** : `public/api.php` → `AuthServices` → `UtilisateurDAO` → MySQL
3. **Session** : Sessions PHP côté serveur (sécurisé)
4. **Client Storage** : `localStorage` pour UX (token utilisateur)

### Flux Login
```
Form Submit → apiLogin() → /api/auth/login → 
SessionStart → localStorage.setItem('user') → 
redirect dashboard.html
```

### Flux Inscription
```
Form Submit → apiRegister() → /api/auth/register →
Validate → Insert BD → 
Success → redirect login.html
```

### Vérification Auth
- Chaque page dashboard vérifie `isAuthenticated()` 
- Si non auth → redirection `login.html`
- API vérifie sessions PHP avec `requireAuth()`

---

## 🛠️ Troubleshooting

### ❌ "API_BASE_URL is undefined"
**Cause**: `api.js` non chargé avant `script.js`
**Fix**: Vérifier ordre dans HTML:
```html
<script src="api.js"></script>
<script src="script.js"></script>
```

### ❌ "404 api.php not found"
**Cause**: mod_rewrite pas activé
**Fix**: 
1. WAMP → Apache modules → ✅ rewrite_module
2. Redémarrer Apache

### ❌ "Erreur connexion BD"
**Cause**: Paramètres Database.php incorrects
**Fix**: 
1. Vérifier MySQL est démarré
2. Éditer `config/Database.php`
3. Tester: `php -r "require 'config/Database.php'; echo 'OK';"`

### ❌ "Les mots de passe ne correspondent pas"
**Cause**: Erreur typage JavaScript
**Fix**: Vérifier noms champs dans `inscription.html`:
- `id="password"`
- `id="confirmPassword"` (camelCase!)

### ❌ Redirection infinie login/dashboard
**Cause**: Session pas créée
**Fix**: Vérifier sessions PHP activées dans `php.ini`:
```ini
session.save_path = "C:/wamp64/tmp"
```

---

## 📞 Support & Documentation

### API Routes Complètes
Voir `README_BACKEND.md` pour tous les endpoints

### Frontend Pages
- `login.html` - Login form
- `inscription.html` - Register form  
- `dashboard.html` - Main app (requiert auth)
- `profile.html` - User profile
- `tasks-list.html` - Tasks management
- `users-list.html` - Admin users

### Contact
Aucun support pour cette version de test

---

## ✨ Prochaines Étapes Possibles

- [ ] Tests unitaires (PHPUnit)
- [ ] Validation côté serveur robuste
- [ ] Upload fichiers
- [ ] Permissions granulaires
- [ ] Logs d'activité
- [ ] Pagination API
- [ ] Rate limiting
- [ ] Refresh tokens JWT

---

**Version**: 1.0  
**Date**: 27 Avril 2026  
**Statut**: ✅ Configuration complète et testée
