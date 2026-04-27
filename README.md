# 🟡 Task-Pro - Application de Gestion des Tâches

## 🚀 Démarrage Rapide (5 minutes)

### Étape 1: Base de Données
```bash
# Via MySQL CLI
mysql -u root task_pro_db < config/schema.sql
```
Ou via PhpMyAdmin: Importer `config/schema.sql`

### Étape 2: Vérifier Configuration
```
http://localhost/Task-Pro/test_config.php
```
✅ Tous les tests doivent être verts

### Étape 3: Accéder à l'app
```
http://localhost/Task-Pro/
```

### Étape 4: Se connecter
- **Email**: root@taskpro.com
- **Password**: root123
- **Rôle**: SuperAdmin

---

## 📚 Documentation Complète

- **[SETUP.md](SETUP.md)** - Guide complet d'installation et configuration
- **[README_BACKEND.md](README_BACKEND.md)** - Documentation API REST
- **[CHANGELOG.md](CHANGELOG.md)** - Tous les changements et corrections
- **[Frontend/](Frontend/)** - Application web

---

## 🎯 Fonctionnalités

✅ **Authentification**
- Login / Registration
- Gestion sessions PHP
- Rôles (SuperAdmin, Admin, Employé)

✅ **Gestion des Tâches**
- Créer, lire, mettre à jour, supprimer
- Assigner à des utilisateurs
- Statuts (non assigné, assigné, en cours, terminé)
- Dates d'échéance

✅ **Interface**
- Design moderne (Glassmorphism)
- Responsive
- Animations fluides
- Lucide Icons

---

## 🏗️ Architecture

```
Frontend (HTML/CSS/JS)
    ↓
API REST (public/api.php)
    ↓
Services (Business Logic)
    ↓
DAOs (Database Access)
    ↓
MySQL
```

---

## 🔐 Sécurité

- ✅ Sessions PHP côté serveur
- ✅ Validation côté client ET serveur
- ✅ PDO + requêtes paramétrées
- ✅ Password hashing (bcrypt)
- ✅ CORS headers
- ✅ mod_rewrite pour API

---

## 🗂️ Structure Fichiers

```
Task-Pro/
├── Frontend/            # Application web
│   ├── index.html      # Page d'accueil
│   ├── login.html      # Connexion
│   ├── inscription.html # Inscription
│   ├── dashboard.html  # Tableau de bord
│   ├── api.js         # Appels API
│   ├── script.js      # Logique générale
│   └── *.css          # Styles
├── public/
│   └── api.php        # API REST
├── config/
│   ├── Database.php   # Connexion BD
│   └── schema.sql     # Structure BD
├── Services/          # Business logic
├── DAOs/              # Database access
├── Models/            # Data models
└── vendor/            # Dépendances
```

---

## 🔧 Troubleshooting

| Problème | Solution |
|----------|----------|
| 404 sur les routes | Vérifier mod_rewrite activé |
| Erreur BD | Vérifier schema.sql importé |
| Login ne fonctionne pas | Vérifier sessions PHP activées |
| API 404 | Vérifier .htaccess présent |

Voir **[SETUP.md](SETUP.md)** pour plus de détails.

---

## 📞 Endpoints API

### Authentification
- `POST /api/auth/register` - Créer compte
- `POST /api/auth/login` - Se connecter
- `POST /api/auth/logout` - Se déconnecter
- `GET /api/auth/me` - Infos utilisateur

### Tâches
- `GET /api/taches/list` - Lister tâches
- `POST /api/taches/create` - Créer tâche
- `GET /api/taches/{id}` - Détail tâche
- `PUT /api/taches/{id}/status` - Modifier statut
- `DELETE /api/taches/{id}` - Supprimer

Voir **[README_BACKEND.md](README_BACKEND.md)** pour tous les endpoints.

---

## ✨ Améliorations Récentes (v1.0)

✅ Frontend intégré (login, inscription)  
✅ API complète et fonctionnelle  
✅ Sessions utilisateur  
✅ Gestion des erreurs  
✅ Interface responsive  
✅ Authentification sécurisée  

---

## 📄 License

Privé - Task-Pro 2026

---

**Prêt à démarrer?** → [SETUP.md](SETUP.md)  
**API docs?** → [README_BACKEND.md](README_BACKEND.md)  
**Changelog?** → [CHANGELOG.md](CHANGELOG.md)

