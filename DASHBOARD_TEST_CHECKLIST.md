# 🧪 Guide de Test Rapide - Dashboards V3.0

## ✅ Checklist de Vérification

### Avant de Tester
- [ ] Serveur WAMP actif et accessible
- [ ] Base de données `task_pro_db` avec données
- [ ] Au moins 1 SuperAdmin, 1 Administrateur et 1 Employé créés

---

## 🔐 Test 1: Authentification et Redirection

### Scénario A: Connexion SuperAdmin
```
1. URL: http://localhost/Task-Pro/Frontend/dashboard.html
2. Non connecté → Redirection vers login.html ✓
3. Connectez-vous en tant que SuperAdmin
4. Accueil dashboard.html ✓
5. Vérifiez l'affichage du nom: "Super Admin" dans la topbar ✓
```

### Scénario B: Connexion Employé
```
1. URL: http://localhost/Task-Pro/Frontend/dashbordUser.html
2. Non connecté → Redirection vers login.html ✓
3. Connectez-vous en tant que Employé
4. Accueil dashbordUser.html ✓
5. Vérifiez l'affichage du nom: "Employé" dans la topbar ✓
```

### Scénario C: Accès Non Autorisé
```
1. Connecté en tant qu'Employé
   → Essayer d'accéder à /dashboard.html
   → Redirection automatique vers /dashbordUser.html ✓

2. Connecté en tant que SuperAdmin
   → Essayer d'accéder à /dashbordUser.html
   → Redirection automatique vers /dashboard.html ✓
```

---

## 📊 Test 2: Données Dynamiques

### Dashboard SuperAdmin

Vérifier l'affichage des statistiques:
```
[ ] Carte 1: Total Tâches (nombre > 0)
[ ] Carte 2: Tâches en cours (nombre)
[ ] Carte 3: Tâches terminées (nombre)
[ ] Carte 4: Tâches non assignées (visible)
[ ] Carte 5: Utilisateurs actifs (visible)
[ ] Section Statistiques Système (visible)
    [ ] Nombre d'Administrateurs
    [ ] Nombre d'Employés
```

### Dashboard Employé

Vérifier l'affichage des statistiques:
```
[ ] Carte 1: Total Tâches (seulement SES tâches)
[ ] Carte 2: Tâches en cours (seulement SES tâches)
[ ] Carte 3: Tâches terminées (seulement SES tâches)
[ ] Pas de carte "Tâches non assignées" (cachée)
[ ] Pas de carte "Utilisateurs" (cachée)
[ ] Pas de section Statistiques Système (cachée)
```

---

## 🎯 Test 3: Sections et Navigation

### Dashboard SuperAdmin

```
Nav Sidebar:
[ ] Vue d'ensemble (accueil)
[ ] Créer une nouvelle tâche
[ ] Liste des tâches
[ ] Liste des utilisateurs
[ ] Profil
[ ] Bouton Déconnexion
```

### Dashboard Employé

```
Nav Sidebar:
[ ] Vue d'ensemble
[ ] Mes tâches (affiche ses tâches)
[ ] Profil
[ ] Bouton Déconnexion
```

Clic sur "Mes tâches":
```
[ ] Tableau avec ses tâches apparaît
[ ] Colonnes: ID, Description, Statut, Responsable
[ ] Données chargées depuis la BD
```

---

## 🔄 Test 4: Refresh et Actualisation

```
[ ] Cliquer sur le bouton "Rafraîchir" (en haut du dashboard)
[ ] Attendre le chargement (~1-2 secondes)
[ ] Vérifier que les données se mettent à jour
[ ] Attendre 5 minutes
[ ] Vérifier que les données se rechargent automatiquement
```

---

## 🎨 Test 5: Interface et Style

### Affichage Général
```
[ ] Sidebar bien alignée et lisible
[ ] Topbar avec infos utilisateur
[ ] Cartes statistiques bien formatées
[ ] Couleurs des statuts cohérentes:
    - En cours: Orange
    - Terminé: Vert
    - Assigné: Bleu
    - Non assigné: Gris
[ ] Responsive sur mobile (resize le navigateur)
```

### Icônes Lucide
```
[ ] Toutes les icônes s'affichent correctement
[ ] Pas d'erreurs console (F12)
[ ] Animations fluides
```

---

## 🚨 Test 6: Gestion d'Erreurs

### Réseau Indisponible
```
1. Débrancher le réseau ou bloquer l'API
2. Recharger dashboard.html
3. Message d'erreur s'affiche: "Erreur lors du chargement..."
4. Bouton refresh redisponible
```

### Session Expirée
```
1. Attendre expiration de session (ou effacer cookies)
2. Recharger dashboard.html
3. Redirection vers login.html
```

### Données Manquantes
```
1. Base de données vide (0 tâches)
2. Vérifier que "0" s'affiche correctement
3. Tableau affiche "Aucune tâche"
```

---

## 📱 Test 7: Déconnexion

```
1. Cliquer sur bouton "Déconnexion"
2. Vérifier redirection vers login.html
3. Essayer d'accéder à /dashboard.html
4. Vérification: Redirection vers login.html ✓
5. Vérifier que sessionStorage est vidé
```

---

## 🔍 Test 8: Console du Navigateur (F12)

Vérifier qu'il n'y a pas:
```
❌ Erreurs JavaScript rouges
❌ Avertissements CORS
❌ Fichiers 404
❌ Erreurs d'authentification
✓ Messages informatifs normaux uniquement
```

---

## ✔️ Points de Contrôle Critiques

| Aspect | SuperAdmin | Employé | Notes |
|--------|-----------|---------|-------|
| Accès dashboard.html | ✅ | ❌ Redir | Redirection vers dashbordUser |
| Accès dashbordUser.html | ❌ Redir | ✅ | Redirection vers dashboard |
| Cartes Non Assignées | ✅ | ❌ | Seulement pour admins |
| Statistiques Système | ✅ | ❌ | Seulement pour admins |
| Ses tâches | ✅ Toutes | ✅ Siennes | Filtrées par id_responsable |
| Liste Utilisateurs | ✅ | ❌ | Seulement pour admins |

---

## 📊 Résumé du Statut

```
Version: 3.0
Date: 29 avril 2026
Status: 🟢 Prêt pour test

Composants:
✅ API Endpoints (/dashboard/stats, /dashboard/recent-tasks)
✅ Dashboard Admin (dashboard.html)
✅ Dashboard Employé (dashbordUser.html)
✅ Script Unifié (dashboard-unified.js)
✅ Système Restrictions (Rôle-based)
✅ Données Dynamiques (BD)
✅ Auto-refresh (5 min)
```

---

## 🎓 Instructions de Débogage

Si une partie ne fonctionne pas:

### 1. Vérifier la Console (F12)
```javascript
// Voir l'utilisateur actuel
console.log(dashboardData.user)

// Voir les stats chargées
console.log(dashboardData.stats)

// Voir les tâches
console.log(dashboardData.tasks)
```

### 2. Vérifier l'API
```bash
# Tester l'endpoint
curl http://localhost/Task-Pro/public/api.php/dashboard/stats

# Doit retourner JSON avec 'stats'
```

### 3. Vérifier la Session
```javascript
// Voir la session
console.log(sessionStorage.getItem('user'))

// Voir l'auth
console.log(sessionManager.isAuthenticated())
```

### 4. Vérifier la Base de Données
```sql
-- Tâches
SELECT COUNT(*) FROM taches;

-- Utilisateurs
SELECT id, nom, prenom, role FROM utilisateurs;

-- Tâches assignées à un utilisateur
SELECT * FROM taches WHERE id_responsable = X;
```

---

**Note**: Cette checklist doit être complétée pour valider la v3.0 en production.
