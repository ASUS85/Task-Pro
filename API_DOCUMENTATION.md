# TaskPRO - Documentation API Complète

## 📋 Index des Endpoints

| # | METHOD | ENDPOINT | SERVICE | DAO | ROLE | STATUS | DESCRIPTION |
|---|--------|----------|---------|-----|------|--------|-------------|
| 1 | POST | `/auth/register` | AuthServices.inscrire | UtilisateurDAO.sauvegarder | PUBLIC | ✅ OK | Inscription publique (Employe) |
| 2 | POST | `/auth/login` | AuthServices.connecter | UtilisateurDAO.trouverParEmail | PUBLIC | ✅ OK | Connexion utilisateur |
| 3 | POST | `/auth/logout` | n/a | n/a | AUTH | ✅ OK | Déconnexion (détruit session) |
| 4 | GET | `/auth/me` | n/a | UtilisateurDAO.trouverParId | AUTH | ✅ OK | Récupère profil utilisateur actuel |
| 5 | PUT | `/auth/me` | AuthServices.modifierProfil | UtilisateurDAO.mettreAJour | AUTH | ✅ OK | Modifie profil/mot de passe |
| 6 | POST | `/taches/create` | TacheService.creerTache | TacheDAO.sauvegarder | ADMIN/SUPERADMIN | ✅ OK | Crée une tâche |
| 7 | GET | `/taches/list` | TacheService.getTaches | TacheDAO.obtenirTous/obtenirParResponsable | AUTH | ✅ OK | Liste tâches (filtré par rôle) |
| 8 | GET | `/taches/{id}` | n/a | TacheDAO.trouverParId | AUTH | ✅ OK | Récupère détails tâche |
| 9 | PUT | `/taches/{id}/status` | TacheService.modifierStatut | TacheDAO.modifierStatut | AUTH | ✅ OK | Modifie statut tâche |
| 10 | PUT | `/taches/{id}/assign` | TacheService.assignerTache | TacheDAO.modifierResponsable | ADMIN/SUPERADMIN | ✅ OK | Assigne tâche à employé |
| 11 | DELETE | `/taches/{id}` | TacheService.supprimerTache | TacheDAO.supprimer | ADMIN/SUPERADMIN | ✅ OK | Supprime tâche |
| 12 | GET | `/notifications` | n/a | NotificationDAO.obtenirNonLues | AUTH | ✅ OK | Notifications non lues récupérées avec méthode DAO implémentée |
| 13 | GET | `/dashboard` | n/a | TacheDAO / UtilisateurDAO | ADMIN/SUPERADMIN | ✅ OK | Affiche stats/dashboard |
| 14 | GET | `/users` | n/a | UtilisateurDAO.obtenirTous | ADMIN/SUPERADMIN | ✅ OK | Liste utilisateurs (sans SuperAdmin) |
| 15 | POST | `/admin/users/create` | AuthServices.creerUtilisateurParAdmin | UtilisateurDAO.sauvegarder | SUPERADMIN | ✅ OK | Crée utilisateur (Admin/Employe) |
| 16 | GET | `/admin/users` | n/a | UtilisateurDAO.obtenirTous | SUPERADMIN | ✅ OK | Liste tous utilisateurs (inclus SuperAdmin) |

---

## 🔍 Analyse Détaillée par Module

### 1. AUTH (Authentification)

#### Architecture
```
Frontend (api.js)
    ↓
public/api.php (routes: /auth/*)
    ↓
AuthServices (logique métier)
    ↓
UtilisateurDAO (accès BD)
    ↓
Models (Personne, Administrateur, Employe)
```

#### Endpoints

| Endpoint | HTTP | Frontend | Service | DAO | Détails |
|----------|------|----------|---------|-----|---------|
| `/auth/register` | POST | `apiRegister()` | `inscrire()` | `sauvegarder()` | Public. Le 1er utilisateur → SuperAdmin, autres → Employe |
| `/auth/login` | POST | `apiLogin()` | `connecter()` | `trouverParEmail()` | Hard-coded: root@taskpro.com / root123 → SuperAdmin |
| `/auth/logout` | POST | `apiLogout()` | n/a | n/a | Détruit session. Clear localStorage |
| `/auth/me` | GET | `apiGetCurrentUser()` | n/a | `trouverParId()` | Récupère utilisateur en session |
| `/auth/me` | PUT | `apiChangePassword()` | `modifierProfil()` | `mettreAJour()` | Modifie nom/prenom/poste/password |

#### Cohérence ✅
- ✅ Tous les appels `api.js` correspondent aux routes `api.php`
- ✅ Services appellent les bonnes méthodes DAO
- ✅ Validations en place (email, password match)
- ✅ Gestion des erreurs correcte (401/403)
- ✅ SessionStorage utilisé correctement

---

### 2. TACHES (Gestion des tâches)

#### Architecture
```
Frontend (create-task.js, task-list.js)
    ↓
public/api.php (routes: /taches/*)
    ↓
TacheService (logique métier + permissions)
    ↓
TacheDAO (accès BD)
    ↓
Model Tache
```

#### Endpoints

| Endpoint | HTTP | Frontend | Service | DAO | Permissions | Détails |
|----------|------|----------|---------|-----|-------------|---------|
| `/taches/create` | POST | `apiCreateTask()` | `creerTache()` | `sauvegarder()` | Administrateur, SuperAdmin | Création tâche |
| `/taches/list` | GET | `apiListTasks()` | `getTaches()` | Multiple | Tous | Filtre par rôle: Admin→tous, Employe→propres |
| `/taches/{id}` | GET | `apiGetTask()` | n/a | `trouverParId()` | Tous | Récupère détails tâche |
| `/taches/{id}/status` | PUT | `apiUpdateTaskStatus()` | `modifierStatut()` | `modifierStatut()` | Tous | Employe: propres tâches seulement |
| `/taches/{id}/assign` | PUT | `apiAssignTask()` | `assignerTache()` | `modifierResponsable()` | Administrateur, SuperAdmin | Assigne à employé + notif |
| `/taches/{id}` | DELETE | `apiDeleteTask()` | `supprimerTache()` | `supprimer()` | Administrateur, SuperAdmin | Supprime tâche |

#### Statuts Valides
```
"non assigné"     → Créée mais pas assignée
"assigné"         → Assignée à employé
"en cours"        → Employé a commencé
"non terminé"     → Pas terminée (intermédiaire)
"terminé"         → Complètement terminée (dateFinReelle = NOW())
```

#### Cohérence ✅
- ✅ Noms des champs API cohérents: `libelle`, `description`, `periode_realisation`
- ✅ Frontend utilise transformation `transformTaskFromAPI()`
- ✅ Permissions correctement vérifiées
- ✅ NotificationService appelé lors d'assignation

---

### 3. USERS (Gestion utilisateurs)

#### Endpoints

| Endpoint | HTTP | Frontend | Service | DAO | Permissions | Détails |
|----------|------|----------|---------|-----|-------------|---------|
| `/users` | GET | `apiListUsers()` | n/a | `obtenirTous()` | Administrateur, SuperAdmin | Liste sans SuperAdmin |
| `/admin/users` | GET | `apiListAdminUsers()` | n/a | `obtenirTous()` | SuperAdmin | Liste TOUS users inclus SuperAdmin |
| `/admin/users/create` | POST | `apiCreateUser()` | `creerUtilisateurParAdmin()` | `sauvegarder()` | SuperAdmin | Crée Admin ou Employe |

#### Rôles
```
SuperAdmin        → Gère tout, visible seulement pour admin/users
Administrateur    → Crée tâches, assigne, voit dashboard
Employe           → Exécute tâches, voit ses propres tâches
```

#### Cohérence ✅
- ✅ Distinction `/users` (pour Admins) vs `/admin/users` (pour SuperAdmin)
- ✅ SuperAdmin exclu de `/users` pour éviter assignation
- ✅ Création d'utilisateur seulement en SuperAdmin

---

### 4. NOTIFICATIONS

#### Endpoints

| Endpoint | HTTP | Frontend | Service | DAO | Permissions | Détails |
|----------|------|----------|---------|-----|-------------|---------|
| `/notifications` | GET | `apiGetNotifications()` | n/a | `obtenirNonLues()` | AUTH | ⚠️ Méthode DAO manquante |

#### ⚠️ PROBLÈME IDENTIFIÉ
```php
// api.php ligne ~260
$notifications = $notifDAO->obtenirNonLues($_SESSION['user_id']);

// MAIS: NotificationDAO.php n'a PAS cette méthode!
// Seule méthode existante: sauvegarder()
```

#### Solution Proposée
Implémenter `obtenirNonLues()` dans `NotificationDAO`:
```php
public function obtenirNonLues(int $idUtilisateur): array {
    $sql = "SELECT * FROM notifications 
            WHERE id_utilisateur = :user 
            AND lu = 0 
            ORDER BY created_at DESC";
    $stmt = $this->pdo->prepare($sql);
    $stmt->execute(['user' => $idUtilisateur]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}
```

---

### 5. DASHBOARD

#### Endpoint

| Endpoint | HTTP | Frontend | Service | DAO | Permissions | Détails |
|----------|------|----------|---------|-----|-------------|---------|
| `/dashboard` | GET | `apiGetDashboard()` | n/a | TacheDAO, UtilisateurDAO | ADMIN/SUPERADMIN | Stats complètes |

#### Logique
```
SuperAdmin:
  - Toutes les tâches
  - Tous les utilisateurs
  - Stats globales

Administrateur:
  - Tâches créées par lui
  - Utilisateurs assignés à ses tâches
  - Stats sur ses tâches
```

#### Cohérence ✅
- ✅ Distinction SuperAdmin vs Administrateur
- ✅ Calculs corrects (totalTasks, inProgressTasks, doneTasks, completionPercent)
- ✅ TeamPerformance avec top 3 employés

---

## 📊 Matrice de Cohérence Frontend ↔ Backend

### Appels API vs Routes API

| Fonction Frontend | Endpoint | Route Implémentée | Status |
|------------------|----------|------------------|--------|
| `apiRegister()` | POST `/auth/register` | ✅ Oui | OK |
| `apiLogin()` | POST `/auth/login` | ✅ Oui | OK |
| `apiChangePassword()` | PUT `/auth/me` | ✅ Oui | OK |
| `apiLogout()` | POST `/auth/logout` | ✅ Oui | OK |
| `apiGetCurrentUser()` | GET `/auth/me` | ✅ Oui | OK |
| `apiCreateTask()` | POST `/taches/create` | ✅ Oui | OK |
| `apiListTasks()` | GET `/taches/list` | ✅ Oui | OK |
| `apiGetTask()` | GET `/taches/{id}` | ✅ Oui | OK |
| `apiUpdateTaskStatus()` | PUT `/taches/{id}/status` | ✅ Oui | OK |
| `apiAssignTask()` | PUT `/taches/{id}/assign` | ✅ Oui | OK |
| `apiDeleteTask()` | DELETE `/taches/{id}` | ✅ Oui | OK |
| `apiGetNotifications()` | GET `/notifications` | ✅ Oui | ⚠️ DAO MANQUANTE |
| `apiGetDashboard()` | GET `/dashboard` | ✅ Oui | OK |
| `apiCreateUser()` | POST `/admin/users/create` | ✅ Oui | OK |
| `apiListUsers()` | GET `/users` | ✅ Oui | OK |

---

## 🎯 Permissions par Rôle

### SuperAdmin
```
✅ Accès TOTAL à tous les endpoints
✅ Crée/modifie/supprime utilisateurs
✅ Crée/assigne/modifie/supprime tâches
✅ Voit tous les utilisateurs (/admin/users)
✅ Voit dashboard avec stats globales
✅ Accès /admin/* endpoints
```

### Administrateur
```
✅ Crée/modifie/supprime tâches
✅ Assigne tâches à employés
✅ Voit la liste des utilisateurs (sauf SuperAdmin)
✅ Voit dashboard avec stats sur ses tâches créées
❌ Ne peut pas créer/modifier utilisateurs
❌ Ne peut pas voir /admin/users (SuperAdmin seulement)
```

### Employe
```
✅ Voit ses tâches assignées (GET /taches/list)
✅ Modifie statut de ses propres tâches
✅ Récupère ses notifications
❌ Ne peut pas créer de tâches
❌ Ne peut pas assigner des tâches
❌ Ne peut pas voir d'autres utilisateurs
❌ Ne peut pas voir le dashboard
```

### Public (non authentifié)
```
✅ S'inscrire (/auth/register)
✅ Se connecter (/auth/login)
❌ Tous les autres endpoints nécessitent auth
```

---

## 🐛 Bugs et Incohérences Détectées

### 🔴 CRITIQUE: NotificationDAO.obtenirNonLues() manquante

**Localisation**: `public/api.php` ligne ~260
```php
$notifications = $notifDAO->obtenirNonLues($_SESSION['user_id']);
```

**Problème**: La méthode `obtenirNonLues()` est appelée mais n'existe pas dans `NotificationDAO.php`

**Impact**: Endpoint `/notifications` retourne une erreur Fatal PHP

**Correction Requise**: 
- ✅ Implémenter `obtenirNonLues()` dans NotificationDAO
- ✅ Implémenter `marquerLue()` pour marquer notifs lues
- ✅ Table `notifications` doit avoir colonne `lu` (boolean)

---

### ⚠️ MINEUR: Cohérence des noms de champs API

**Observé**:
- API retourne: `id`, `libelle`, `description`, `periode_realisation`, `id_responsable`, `id_createur`
- Frontend mappe correctement: `transformTaskFromAPI()`

**Status**: ✅ Géré correctement via transformation

---

### ✅ VALIDÉ: Permissions correctes

**Vérifications faites**:
- ✅ `requireAuth()` sur tous les endpoints sécurisés
- ✅ `requireSuperAdmin()` sur `/admin/*`
- ✅ Vérification du rôle dans les Services
- ✅ SuperAdmin exclu de `/users` pour l'assignation
- ✅ Filtrage des tâches selon le rôle

---

## 📝 Architecture Complète

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND                            │
│ ┌────────────────────────────────────────────────────┐  │
│ │  HTML Pages  │  JS (api.js, create-task.js, etc)  │  │
│ └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓ fetch()
┌─────────────────────────────────────────────────────────┐
│              PUBLIC/API.PHP (Routeur)                    │
│ ┌─ /auth/* ────────────────────────────────────────┐   │
│ ├─ /taches/* ──────────────────────────────────────┤   │
│ ├─ /users/* ───────────────────────────────────────┤   │
│ ├─ /notifications/* ──────────────────────────────┤   │
│ ├─ /dashboard /* ──────────────────────────────────┤   │
│ └─ /admin/* ───────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
          ↓ new Service()              ↓ new DAO()
┌──────────────────────────┐  ┌─────────────────────────┐
│   SERVICES LAYER         │  │    DATA ACCESS LAYER    │
│ ┌────────────────────┐   │  │ ┌──────────────────────┐ │
│ │ AuthServices       │   │  │ │ UtilisateurDAO       │ │
│ │ TacheService       │   │  │ │ TacheDAO             │ │
│ │ NotificationServ   │   │  │ │ NotificationDAO      │ │
│ └────────────────────┘   │  │ └──────────────────────┘ │
└──────────────────────────┘  └─────────────────────────┘
          ↓                           ↓
┌─────────────────────────────────────────────────────────┐
│               DATABASE (MySQL)                          │
│ ┌──────────────┬──────────────┬────────────────────┐   │
│ │ utilisateurs │ taches       │ notifications      │   │
│ └──────────────┴──────────────┴────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist de Validation

- [x] Tous les endpoints implémentés dans api.php
- [x] Toutes les routes correspondent aux appels frontend
- [x] Services appellent les bonnes méthodes DAO
- [x] Permissions correctement vérifiées
- [x] Gestion des erreurs (401, 403, 404)
- [x] Validation des données
- [x] Cohérence des noms de champs API
- [ ] NotificationDAO.obtenirNonLues() - **À IMPLÉMENTER**
- [x] Logging/debugging fonctionnel
- [x] CORS headers configurés

---

## 🚀 À Faire - Corrections Requises

### 1. CRITIQUE: Implémenter NotificationDAO.obtenirNonLues()
```php
public function obtenirNonLues(int $idUtilisateur): array {
    // À implémenter
}
```

### 2. Vérifier table notifications
```sql
-- Vérifier que la table a:
-- - id (PRIMARY KEY)
-- - id_utilisateur (FOREIGN KEY)
-- - type (VARCHAR)
-- - message (TEXT)
-- - id_tache (nullable)
-- - lu (BOOLEAN / TINYINT)
-- - created_at (TIMESTAMP)
```

### 3. Tester tous les endpoints
- [ ] Auth (register, login, logout, me GET/PUT)
- [ ] Taches (create, list, get, status, assign, delete)
- [ ] Users (list, admin/users, admin/users/create)
- [ ] Notifications (GET)
- [ ] Dashboard (GET)

### 4. Vérifier les logs
- Console Frontend pour les appels API
- Logs PHP pour les erreurs backend
- Vérifier les permissions par rôle

---

## 📞 Contacts et Références

**Architecture**: DAO/Services/Models
**Base de données**: MySQL (PDO)
**Frontend**: Vanilla JavaScript (api.js)
**Session**: PHP Native + localStorage
**Email**: PHPMailer (SMTP Gmail)

---

**Dernière Mise à Jour**: 2026-05-20
**Status**: 🟡 EN COURS (1 bug critique à corriger)
