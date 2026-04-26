# 📋 Task Pro - Guide d'Installation Backend

## 🚀 Installation

### 1️⃣ **Créer la base de données**

```sql
CREATE DATABASE task_pro_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE task_pro_db;
```

### 2️⃣ **Importer le schéma SQL**

Exécutez le fichier `config/schema.sql` dans PHPMyAdmin(Importer simplement le fichier via importe) ou via MySQL CLI :

```bash
mysql -u root task_pro_db < config/schema.sql
```

### 3️⃣ **Configurer la base de données**

Éditer `config/Database.php` et adapter les paramètres de connexion :

```php
private const HOST = 'localhost';
private const DB_NAME = 'task_pro_db';
private const USER = 'root';
private const PASSWORD = '';
```

### 4️⃣ **Structure des dossiers**

```
├── config/
│   ├── Database.php (Connexion BD)
│   └── schema.sql (Schéma BD)
├── public/
│   └── api.php (Point d'entrée API)
├── Models/
│   ├── Personne.php 
│   ├── Employe.php 
│   ├── Administrateur.php
│   └── Tache.php 
├── DAOs/
│   ├── UtilisateurDAO.php 
│   └── TacheDAO.php 
└── Services/
    ├── AuthServices.php 
    └── TacheService.php 
```

---

## 📡 Routes API

### **Auth**

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/register` | Inscription (Employé) |
| POST | `/api/auth/login` | Connexion |
| POST | `/api/auth/logout` | Déconnexion |
| GET | `/api/auth/me` | Profil utilisateur courant |
| POST | `/api/auth/profile` | Modifier profil |

### **Tâches**

| Méthode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/api/taches/create` | Créer tâche | Admin+ |
| GET | `/api/taches/list` | Lister tâches (par rôle) | Oui |
| GET | `/api/taches/:id` | Détail tâche | Oui |
| PUT | `/api/taches/:id/status` | Modifier statut | Oui |
| PUT | `/api/taches/:id/assign` | Assigner tâche | Admin+ |
| DELETE | `/api/taches/:id` | Supprimer tâche | Admin+ |

### **Admin (SuperAdmin only)**

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/admin/users/create` | Créer Admin/Employé |
| GET | `/api/admin/users` | Lister utilisateurs |
| GET | `/api/admin/users/:id` | Détail utilisateur |
| DELETE | `/api/admin/users/:id` | Supprimer utilisateur |

---

## 🔐 Statuts des Tâches

```
non assigné  ──→  assigné  ──(T+10min auto)──→  en cours  ──→  terminé
                                                   ↓
                                            (T+délai, pas fini)
                                                   ↓
                                            non terminé
```

**Transitions :**
- **"non assigné"** : Tâche avec parent en attente (auto-assignation quand parent fini)
- **"assigné"** → **"en cours"** : Automatique après 10 minutes (via scheduler)
- **"en cours"** → **"non terminé"** : Automatique si délai dépassé
- **"en cours"** → **"terminé"** : Manuel (employé finalise)

---

## 📦 Exemple Requête

### Créer une tâche

```bash
POST http://localhost/Task-Pro/public/api.php/taches/create
Content-Type: application/json

{
  "id" : 1,
  "libelle": "Développer API",
  "description": "Créer les endpoints REST",
  "periode_realisation": "5h",
  "id_responsable": 1,
  "id_parent": null,
  "cheminFichier": null
}
```

### Modifier le statut

```bash
PUT http://localhost/Task-Pro/public/api.php/taches/1/status
Content-Type: application/json

{
  "status": "en cours"
}
```

---

## 🔄 Flux de travail complet

1. **Employé** s'enregistre via `/auth/register`
2. **Employé** se connecte via `/auth/login`
3. **Admin** crée une tâche via `/taches/create`
4. **Système** assigne automatiquement (si `id_responsable` fourni)
5. **Système** envoie notification (à implémenter)
6. **T+10min** : Tâche passe `"assigné"` → `"en cours"` (automatique)
7. **Employé** peut modifier statut ou télécharger fichier (à implémenter)
8. **Employé** termine → passe à `"terminé"` (ou auto `"non terminé"` si délai)

---

## 📝 À implémenter (Suite)

- [ ] **NotificationService** (app + email)
- [ ] **FileUploadService** (upload/download)
- [ ] **SchedulerService** (transitions auto)
- [ ] **ActivityLogService** (logs SuperAdmin)
- [ ] Authentification JWT
- [ ] Validations de sécurité avancées

---

## 🐛 Test rapide

```php
// test.php
require_once 'config/Database.php';
require_once 'DAOs/UtilisateurDAO.php';

$dao = new UtilisateurDAO();
echo count($dao->obtenirTous()) . " utilisateurs en BD\n";
```

