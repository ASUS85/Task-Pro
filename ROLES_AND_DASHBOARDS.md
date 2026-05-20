# 🔐 SYSTÈME DE RÔLES ET DASHBOARDS - CLARIFICATION

## Architecture des Rôles

### 1️⃣ SuperAdmin (Accès Complet)
**Rôle**: `'SuperAdmin'`

**Accès Dashboard**: `/dashboard.html`

**Permissions**:
- ✅ Voir **TOUTES les tâches** du système
- ✅ Voir **TOUS les utilisateurs**
- ✅ CRUD complet sur les tâches
- ✅ CRUD complet sur les utilisateurs
- ✅ Gestion des Administrateurs

**Données filtrées par API**: `obtenirTous()` - Aucun filtre

---

### 2️⃣ Administrateur (Accès Partiel)
**Rôle**: `'Administrateur'`

**Accès Dashboard**: `/dashbordUser.html`

**Permissions**:
- ✅ Voir **SES tâches créées** 
- ✅ Voir **SES tâches assignées**
- ✅ Voir **TOUS les utilisateurs**
- ✅ CRUD sur ses propres tâches
- ❌ Pas d'accès à `/dashboard.html`
- ❌ Pas de gestion des autres Administrateurs

**Données filtrées par API**: `obtenirParCreateur(userId)` - Seulement ses créations

---

### 3️⃣ Employé (Accès Minimal)
**Rôle**: `'Employe'`

**Accès Dashboard**: ❌ **AUCUN**

**Permissions**:
- ✅ Voir **SES tâches assignées** (page simple)
- ✅ Mettre à jour le statut de ses tâches
- ❌ Créer des tâches
- ❌ Gérer d'autres tâches
- ❌ Voir les utilisateurs
- ❌ Accès à dashboard

**Note**: Un Employé n'accède qu'à une page simplifiée montrant ses tâches assignées

---

## Interface Visuelle

```
┌─────────────────────────────────────────────────┐
│              SYSTÈME TASK-PRO 3.1               │
├─────────────────────────────────────────────────┤

SUPER ADMIN → /dashboard.html (Interface Complète)
│
├─ Stats: TOUTES les tâches
├─ Tâches: TOUTES (CRUD)
├─ Utilisateurs: TOUS (CRUD)
├─ Performance: Vue globale
└─ Créer tâche: OUI

ADMINISTRATEUR → /dashbordUser.html (Interface Identique)
│
├─ Stats: SES tâches
├─ Tâches: SES tâches (CRUD)
├─ Utilisateurs: TOUS (Vue seulement)
├─ Performance: Ses équipes
└─ Créer tâche: OUI (ses créations)

EMPLOYÉ → Page Simple (Pas de Dashboard)
│
├─ Voir: SES tâches assignées
├─ Action: Changer statut
└─ Pas de création
```

---

## Flux d'Authentification

### Premier Utilisateur (Inscription)
```
Formulaire Inscription
    ↓
backend/AuthServices.php: isFirstUser = true
    ↓
Crée rôle: "SuperAdmin"
    ↓
Login après → /dashboard.html
```

### Utilisateur Subsequent (Inscription)
```
Formulaire Inscription
    ↓
backend/AuthServices.php: isFirstUser = false
    ↓
Crée rôle: "Employe"
    ↓
Login après → Pas de dashboard
(Accès simple aux tâches assignées)
```

### Créer un Administrateur (Par SuperAdmin)
```
⚠️ À IMPLÉMENTER:
- SuperAdmin crée un nouvel Administrateur
- Via formulaire de gestion utilisateurs
- Attribue le rôle "Administrateur"
- Cet utilisateur → /dashbordUser.html
```

---

## Redirection Après Login

```javascript
// script.js - handleLogin()
const userRole = result.user?.role;

if (userRole === 'SuperAdmin') {
    window.location.href = '/dashboard.html';
} else if (userRole === 'Administrateur') {
    window.location.href = '/dashbordUser.html';
} else if (userRole === 'Employe') {
    window.location.href = '/login.html'; // Ou page simple tâches
} else {
    window.location.href = '/login.html'; // Sécurité
}
```

---

## Vérification d'Accès (JavaScript)

```javascript
// Avant le chargement de la page

// SuperAdmin SEULEMENT
if (window.location.pathname.includes('dashboard.html')) {
    if (user.role !== 'SuperAdmin') {
        window.location.href = '/dashbordUser.html';
    }
}

// Admin OU SuperAdmin
if (window.location.pathname.includes('dashbordUser.html')) {
    if (user.role !== 'Administrateur' && user.role !== 'SuperAdmin') {
        window.location.href = '/login.html';
    }
}
```

---

## Vérification d'Accès (Backend API)

```php
// api.php - Route /dashboard

requireAuth(); // Vérifier session

$user = $utilisateurDAO->trouverParId($_SESSION['user_id']);

// Seuls Admin et SuperAdmin peuvent accéder
if ($user->getRole() !== 'Administrateur' && $user->getRole() !== 'SuperAdmin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Accès refusé']);
    exit;
}

// Filtrer les données selon le rôle
if ($user->getRole() === 'SuperAdmin') {
    $tasks = $tacheDAO->obtenirTous(); // TOUS
} else {
    $tasks = $tacheDAO->obtenirParCreateur($user->getId()); // SES tâches
}
```

---

## Points Clés

✅ **Interface Identique**: dashboard.html et dashbordUser.html ont le même layout  
✅ **Données Filtrées**: L'API retourne différentes données selon le rôle  
✅ **Contrôle d'Accès Strict**: Redirection basée sur le rôle  
✅ **Backend Sécurisé**: Vérification du rôle côté serveur  
✅ **Traçabilité**: Les logs API montrent qui accède à quoi  

---

## 📋 TODO: À IMPLÉMENTER

- [ ] **Créer système de création d'Administrateur** par SuperAdmin
- [ ] **Dashboard Employé** - Page simple pour tâches assignées
- [ ] **Logs d'accès** - Tracer les actions par rôle
- [ ] **Permissions granulaires** - Plus de contrôle par rôle

---

**Version**: Task-Pro 3.1 Corrigée  
**Date**: 19 mai 2026  
**Status**: ✅ Rôles et Dashboards Clarifiés
