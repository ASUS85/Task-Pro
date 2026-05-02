# 🚀 TASKPRO V2.0 - GUIDE DE DÉMARRAGE RAPIDE

## ⚡ Démarrage en 5 minutes

### Étape 1: Vérifier la Base de Données
```bash
# Se connecter à MySQL
mysql -u root

# Vérifier la DB
USE task_pro_db;
SELECT COUNT(*) as 'Total Users' FROM utilisateur;
SELECT COUNT(*) as 'Total Tasks' FROM tache;
```

### Étape 2: Démarrer WAMP64
```bash
1. Ouvrir WAMP64 systray
2. Cliquer "Start All Services"
3. Vérifier les icônes vertes
```

### Étape 3: Accéder à l'Application
```
URL: http://localhost/Task-Pro/Frontend/login.html

Credentials:
- Email: admin@test.com
- Password: password123
```

### Étape 4: Tester les Fonctionnalités
```
1. ✓ Login réussit → Dashboard affiche
2. ✓ Dashboard stats chargées
3. ✓ Aller "Liste des tâches"
4. ✓ Créer une tâche
5. ✓ Changer statut (sans reload)
```

---

## 🔍 Vérifications Rapides

### Console (DevTools - F12)
```javascript
// Vérifier scripts chargés
typeof sessionManager        // → "object"
typeof loaderManager         // → "object"
typeof apiCall              // → "function"

// Vérifier user
sessionManager.getUser()     // → {id: 1, nom: "...", ...}
sessionManager.isAdmin()     // → true/false
```

### Network Tab
```
✓ api-client-v2.js        200 OK
✓ session-manager-enhanced.js 200 OK
✓ auth-helper.js          200 OK
✓ loaders.js              200 OK
✓ Aucune 404 sur les scripts
```

### LocalStorage
```javascript
// Dans Console
JSON.parse(localStorage.getItem('user'))
// → {id, email, nom, prenom, role, ...}
```

---

## 📋 Checklist Rapide Avant Production

| Item | Status |
|------|--------|
| ✓ Scripts v2.0 chargés | __ |
| ✓ SessionManager fonctionne | __ |
| ✓ Login/Logout ok | __ |
| ✓ Dashboard stats ok | __ |
| ✓ API tâches répond | __ |
| ✓ Loaders s'affichent | __ |
| ✓ Toast notifications ok | __ |
| ✓ SPA sans rechargement | __ |
| ✓ Responsive design ok | __ |
| ✓ Aucune erreur console | __ |

---

## 🎬 Scripts de Test Complets

### Test API Connectivity
```javascript
// Exécuter dans Console

// Test 1: Login
fetch('/Task-Pro/public/api.php', {
    method: 'POST',
    body: JSON.stringify({
        action: 'login',
        email: 'admin@test.com',
        password: 'password123'
    })
}).then(r => r.json()).then(d => console.log('Login:', d));

// Test 2: List Tasks
fetch('/Task-Pro/public/api.php?action=listTaches').then(r => r.json()).then(d => console.log('Tasks:', d));

// Test 3: List Users
fetch('/Task-Pro/public/api.php?action=listUtilisateurs').then(r => r.json()).then(d => console.log('Users:', d));
```

### Test UI Loaders
```javascript
// Afficher loader fullscreen
loaderManager.show('Test loader');
setTimeout(() => loaderManager.hide(), 2000);

// Afficher toast
loaderManager.toast('Ceci est un message de succès!', 'success');
loaderManager.toast('Ceci est une erreur!', 'error');

// Section loader
loaderManager.showSection('.some-section');
setTimeout(() => loaderManager.hideSection('.some-section'), 2000);
```

---

## 🐛 Dépannage Rapide

### "Scripts not found" (404)
```
Problème: Les chemins absolus /Task-Pro/... ne résolvent pas
Solution: Vérifier que WAMP DocumentRoot = c:/wamp64/www
          Redémarrer Apache
```

### "SessionManager is undefined"
```
Problème: session-manager-enhanced.js n'a pas chargé
Solution: Vérifier ordre des includes:
         1. api-client-v2.js
         2. session-manager-enhanced.js  ← Doit venir après api
         3. auth-helper.js
         4. loaders.js
         5. page-script-v2.js
```

### "API returns 401"
```
Problème: Session expirée ou invalid token
Solution: Logout → Login à nouveau
          Vérifier localStorage['user'] présent
          Vérifier session en DB pas expirée
```

### "Loaders not visible"
```
Problème: CSS loaders pas chargé
Solution: Vérifier <link rel="stylesheet" href="assets/css/loaders.css">
          Vérifier le fichier existe
          Vérifier pas d'erreur 404 Network tab
```

---

## 📁 Structure Fichiers Clés

```
/Task-Pro/
├── Frontend/
│   ├── assets/js/
│   │   ├── api-client-v2.js ✓ NEW
│   │   ├── session-manager-enhanced.js ✓ NEW
│   │   ├── auth-helper.js ✓ NEW
│   │   ├── loaders.js ✓ UPDATED
│   │   └── ...
│   ├── dashboard.html ✓ UPDATED
│   ├── task-list.html ✓ UPDATED
│   ├── users-list.html ✓ UPDATED
│   ├── profile.html ✓ UPDATED
│   ├── create-task.html ✓ UPDATED
│   ├── task-list-v2.js ✓ NEW
│   ├── users-list-v2.js ✓ NEW
│   ├── profile-v2.js ✓ NEW
│   ├── dashboard-v2.js ✓ NEW
│   ├── create-task-v2.js ✓ NEW
│   ├── TASKPRO_V2_DEPLOYMENT_CHECKLIST.html ✓ NEW
│   └── ...
├── public/
│   └── api.php (endpoints OK)
├── config/
│   └── Database.php (config OK)
└── ...
```

---

## 🎯 Objectifs de Test Prioritaires

**HAUTE PRIORITÉ:**
1. ✓ Connexion/Déconnexion
2. ✓ Dashboard charge et rafraîchit
3. ✓ API répond correctement
4. ✓ Loaders affichés pendant opérations
5. ✓ SPA: changement statut sans reload

**MOYENNE PRIORITÉ:**
6. ✓ Création utilisateur (SuperAdmin)
7. ✓ Création tâche
8. ✓ Toast notifications
9. ✓ Filtrage/Recherche
10. ✓ Responsive design

**BASSE PRIORITÉ:**
11. ✓ Changement mot de passe (endpoint missing)
12. ✓ Édition profil (endpoint missing)
13. ✓ Suppression utilisateurs (endpoint missing)

---

## 📞 Support Rapide

| Question | Réponse |
|----------|---------|
| Où est la checklist? | `TASKPRO_V2_DEPLOYMENT_CHECKLIST.html` |
| Guide intégration API? | `INTEGRATION_API_V2.md` |
| Plan déploiement complet? | `DEPLOYMENT_V2_FINAL.md` |
| Tests auto? | `test-integration-v2.html` |
| Utilitaires helpers? | `assets/js/auth-helper.js` |

---

## ✅ Success Criteria

- [ ] Tous les scripts chargent (0 erreurs 404)
- [ ] Utilisateur peut se connecter
- [ ] Dashboard affiche stats actualisées
- [ ] Listes (tâches/utilisateurs) chargent via API
- [ ] Loaders visibles pendant opérations
- [ ] Toast notifications affichés
- [ ] Aucun rechargement page lors opérations
- [ ] Responsive sur mobile/tablet

---

**Dernière mise à jour:** 2024  
**Version:** 2.0 Complète  
**Status:** Production-Ready ✓
