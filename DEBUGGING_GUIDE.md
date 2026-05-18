# 🔧 Guide de Débogage - Création de Tâche

## Problème: Les données mockées reviennent toujours

### Symptômes
- ❌ Les utilisateurs affichés dans la modal ne correspondent pas à ceux en base de données
- ❌ Les tâches parentes n'existent pas en base de données
- ❌ La création de tâche utilise les faux IDs des données mockées

---

## ✅ Corrections Apportées

### 1. **Correction de la vérification d'erreur API**
**Fichier:** `Frontend/api.js`

**Bug:**
```javascript
// ❌ AVANT (INCORRECT)
if (!response.ok && !result.success) {
    throw new Error(...)
}
```

Utilisait `&&` (ET) au lieu de `||` (OU), ce qui signifiait que les erreurs passaient silencieusement!

**Fix:**
```javascript
// ✅ APRÈS (CORRECT)
if (!response.ok || !result.success) {
    throw new Error(...)
}
```

### 2. **Amélioration du chargement initial**
**Fichier:** `Frontend/create-task.js`

- ✅ Ajout de vérification d'authentification au démarrage
- ✅ Logging détaillé de toutes les étapes
- ✅ Gestion des cas d'erreur avec messages clairs
- ✅ Rechargement des données si elles ne sont pas en mémoire

### 3. **Amélioration des handlers de boutons**
- ✅ Vérification que les données existent avant d'ouvrir les modales
- ✅ Rechargement automatique si les données manquent
- ✅ Messages d'erreur détaillés

---

## 🧪 Comment Vérifier

### Étape 1: Ouvrir la Console (F12)
```
Chrome/Firefox: F12 ou Ctrl+Shift+I
Safari: Cmd+Option+I
```

### Étape 2: Vérifier l'Authentification
**Console:**
```javascript
console.log(localStorage.getItem('user'));
```

**Résultat attendu:**
```json
{
  "id": 2,
  "nom": "Dupont",
  "prenom": "Jean",
  "email": "jean@example.com",
  "role": "Administrateur"
}
```

**Si c'est vide:** Vous n'êtes pas connecté! Allez sur la page login.

### Étape 3: Vérifier le Chargement des Données
**Console:**
```javascript
console.log('Utilisateurs:', realUsers);
console.log('Tâches:', realTasks);
```

**Résultat attendu:**
- `realUsers` doit contenir un tableau avec les utilisateurs de la BD (sans SuperAdmin)
- `realTasks` doit contenir un tableau avec les tâches de la BD

**Si c'est vide:** Les API retournent aucune donnée - voir étape 4.

### Étape 4: Vérifier les Appels API
**Onglet Network (F12):**

1. Recharger la page
2. Chercher les requêtes:
   - `api.php?...` ou chercher `/users`
   - `api.php?...` ou chercher `/taches/list`

3. Vérifier pour chaque:
   - **Status:** Doit être `200` (vert)
   - **Response:** Doit contenir `"success": true` et les données

**Exemple de réponse correcte pour `/users`:**
```json
{
  "success": true,
  "users": [
    {
      "id": 2,
      "nom": "Dupont",
      "prenom": "Jean",
      "email": "jean@example.com",
      "role": "Administrateur",
      "poste": "Manager"
    }
  ]
}
```

**Exemple d'erreur 401 (Non authentifié):**
```json
{
  "success": false,
  "message": "Non authentifié"
}
```

**Exemple d'erreur 403 (Accès refusé):**
```json
{
  "success": false,
  "message": "Accès refusé"
}
```

### Étape 5: Vérifier les Logs Détaillés
**Console:**

Chercher les lignes avec `[INIT]`, `[API]`, `[MODAL]`:

```
✅ [INIT] Démarrage du chargement des données...
✅ [API] Appel GET /users...
✅ [API RESPONSE] Status: 200 {...}
✅ [API] Appel GET /taches/list...
✅ [API RESPONSE] Status: 200 {...}
✅ ✅ TaskPRO Create Task JS chargé et données initialisées
```

---

## 🚨 Dépannage Courant

### Erreur: "Non authentifié"
**Cause:** Vous n'êtes pas connecté
**Solution:** 
1. Allez sur `login.html`
2. Connectez-vous avec vos identifiants

### Erreur: "Accès refusé"
**Cause:** Vous n'êtes pas Administrateur
**Solution:**
1. Vérifiez votre rôle dans localStorage: `getCurrentUserFromStorage().role`
2. Seuls les Administrateurs et SuperAdmin peuvent créer des tâches

### Erreur: "CORS" ou "Network error"
**Cause:** L'API est inaccessible
**Solution:**
1. Vérifiez que le serveur Apache est actif
2. Vérifiez que `API_BASE_URL` est correct en console:
   ```javascript
   console.log(API_BASE_URL);
   ```
3. Doit afficher: `http://localhost:80/Task-Pro/public/api.php` ou similaire

### Pas de données mais pas d'erreur
**Cause:** Les API retournent des données mais dans le mauvais format
**Solution:**
1. Ouvrir Network tab
2. Vérifier la réponse complète (pas juste le status)
3. S'assurer que `"success": true` est présent
4. S'assurer que les données sont dans le bon champ: `users` ou `taches`

---

## 📝 Checklist de Diagnostic

- [ ] **Authentification:** localStorage a un user avec role "Administrateur"
- [ ] **Console:** Pas d'erreurs rouges (sauf erreurs CORS peut-être)
- [ ] **Logs:** Console affiche "[INIT]" et "[API]" avec Status 200
- [ ] **Variables:** `realUsers` et `realTasks` contiennent des données
- [ ] **Network:** Appels API retournent Status 200 avec `success: true`
- [ ] **Modal:** Clic sur "Assigner utilisateur" affiche de vraies données
- [ ] **Base de données:** Vérifier que les utilisateurs/tâches existent en BD

---

## 🔍 Vérifier la Base de Données

**SQL (via phpMyAdmin ou ligne de commande):**

```sql
-- Vérifier les utilisateurs
SELECT id, nom, prenom, email, role FROM utilisateurs;

-- Vérifier les tâches
SELECT id, libelle, description, status, id_responsable FROM taches;

-- Vérifier qu'au moins un utilisateur est Administrateur
SELECT * FROM utilisateurs WHERE role = 'Administrateur';

-- Vérifier qu'au moins une tâche existe
SELECT * FROM taches LIMIT 5;
```

---

## 🛠️ Corrections Appliquées

### Fichier: `Frontend/api.js`
- ✅ Correction de la condition d'erreur `&&` → `||`
- ✅ Ajout de logging détaillé des appels API
- ✅ Meilleure gestion des erreurs

### Fichier: `Frontend/create-task.js`
- ✅ Vérification d'authentification au démarrage
- ✅ Chargement automatique des données avec logging
- ✅ Fallback si les données ne sont pas en mémoire
- ✅ Messages d'erreur détaillés pour l'utilisateur

---

## 📞 Si Rien Ne Fonctionne

1. **Sauvegardez** les logs complets de la console (F12 → Console → Clic droit → "Save as")
2. **Listez** toutes les erreurs rouges visibles
3. **Vérifiez** que le serveur Apache est actif
4. **Videz** le cache du navigateur (Ctrl+F5)
5. **Redémarrez** le navigateur complètement
6. **Contactez** l'administrateur avec les logs

---

**Dernière mise à jour:** 18 Mai 2026
**Statut:** ✅ Résolution appliquée
