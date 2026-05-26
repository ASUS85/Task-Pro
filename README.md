# 🟡 Task-Pro

## Vue d'ensemble

Task-Pro est une application de gestion des tâches avec rôles utilisateurs : **SuperAdmin**, **Administrateur** et **Employé**.

Elle regroupe :
- une interface frontend en HTML/CSS/JS
- une API REST en PHP (`public/api.php`)
- une couche services et DAO pour la logique métier
- une base MySQL pilotée par `config/schema.sql`

---

## Démarrage rapide

### 1. Importer le schéma MySQL
```bash
mysql -u root task_pro_db < config/schema.sql
```

### 2. Configurer la base dans `config/Database.php`
```php
private const HOST = 'localhost';
private const DB_NAME = 'task_pro_db';
private const USER = 'root';
private const PASSWORD = '';
```

### 3. Accéder à l'application
- `http://localhost/Task-Pro/`
- ou via VirtualHost `http://taskpro.local/` si configuré

### 4. Connexion de test
- Email : `root@taskpro.com`
- Mot de passe : `root123`
- Rôle : `SuperAdmin`

---

## Pages principales

- `index.html` : redirection intelligente
- `login.html` : connexion
- `inscription.html` : création de compte
- `dashboard.html` : tableau de bord Admin / SuperAdmin
- `create-task.html` : création de tâche
- `task-list.html` : gestion des tâches
- `users-list.html` : gestion des utilisateurs
- `profile.html` : profil utilisateur
- `dashbordUser.html` : tableau de bord employé

---

## Architecture du projet

```
Task-Pro/
├── Frontend/            # Interface web
├── public/              # API REST
├── config/              # Configuation et schéma SQL
├── Services/            # Logique métier
├── DAOs/                # Accès base de données
├── Models/              # Entités du domaine
└── vendor/              # Dépendances
```

---

## API REST

### Auth
- `POST /api/auth/register` : inscription
- `POST /api/auth/login` : connexion
- `POST /api/auth/logout` : déconnexion
- `GET /api/auth/me` : informations utilisateur connecté

### Tâches
- `GET /api/taches/list` : liste des tâches
- `POST /api/taches/create` : créer une tâche
- `GET /api/taches/{id}` : détail tâche
- `PUT /api/taches/{id}/status` : modifier statut
- `DELETE /api/taches/{id}` : supprimer une tâche

### Administration
- `POST /api/admin/users/create` : créer un administrateur ou employé
- `GET /api/admin/users` : lister utilisateurs
- `GET /api/admin/users/{id}` : détail utilisateur
- `DELETE /api/admin/users/{id}` : supprimer utilisateur

---

## Fonctionnalités clé

- Authentification et sessions PHP sécurisées
- Gestion des rôles SuperAdmin / Admin / Employé
- CRUD complet des tâches
- Envoi de notifications basique
- Interface responsive et navigation uniforme

---

## Déploiement et configuration

### Vérification WAMP
- Apache `rewrite_module` activé
- DocumentRoot correct
- PHP 7.4+ et extensions PDO activées

### VirtualHost recommandé
```
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

### Test de connexion
- `http://localhost/Task-Pro/test_config.php`

---

## Structure des fichiers utiles

```
Frontend/
  ├── api.js
  ├── script.js
  ├── dashboard.html
  ├── create-task.html
  ├── task-list.html
  ├── users-list.html
  ├── profile.html
  ├── login.html
  ├── inscription.html
  ├── dashbordUser.html
  └── *.css

public/
  └── api.php

config/
  ├── Database.php
  └── schema.sql

Services/
  ├── AuthServices.php
  ├── TacheService.php
  └── NotificationService.php

DAOs/
  ├── UtilisateurDAO.php
  ├── TacheDAO.php
  └── NotificationDAO.php

Models/
  ├── Personne.php
  ├── Administrateur.php
  ├── Employe.php
  └── Tache.php
```

---

## Notes de nettoyage

J'ai fusionné la documentation technique dans ce `README.md` et supprimé les fichiers `.md` obsolètes ou redondants pour alléger le projet.

---

## Historique des changements

Conserver `CHANGELOG.md` pour l'historique détaillé des versions et corrections.

---

## Support

Pour toute configuration supplémentaire, consultez `config/Database.php` et `public/api.php`.

