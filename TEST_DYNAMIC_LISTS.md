# 🧪 Guide de Test - Listes Dynamiques (Tâches + Utilisateurs)

## 🎯 Objectif

Vérifier que les trois pages affichent les **vraies données** de la base de données au lieu des données mockées.

---

## ✅ Test 1: Liste des Tâches

### Étape 1: Naviguer vers la page
1. Connectez-vous en tant qu'**Administrateur**
2. Cliquez sur **"Liste des tâches"** dans le menu

### Étape 2: Vérifier la console
1. Appuyez sur **F12** (Ouvrir Developer Tools)
2. Allez dans l'onglet **Console**
3. Cherchez les messages (devrait voir quelque chose comme):
   ```
   ✅ [INIT] Démarrage du chargement des tâches
   ✅ [API] Appel GET /taches/list...
   ✅ [API RESPONSE] Status: 200
   ✅ Tâches transformées et chargées
   📊 Nombre de tâches: 5
   ✅ TaskPRO Task List initialisé avec succès 🚀
   [RENDER] Affichage de 5 tâche(s)
   ```

### Étape 3: Vérifier le tableau
1. **IMPORTANT:** Devrait voir les **vraies tâches** créées dans le système
2. Les 4 tâches mockées d'avant **NE DOIVENT PAS** apparaître:
   - ❌ "Développer API backend"
   - ❌ "Créer formulaire inscription"
   - ❌ "Tests unitaires"
   - ❌ "Déployer application"

3. À la place, voir les tâches **réelles** créées via l'interface ou l'API

### Étape 4: Tester les filtres
1. Cherchez "Rechercher une tâche" en haut du tableau
2. Tapez du texte - les résultats doivent se filtrer en temps réel
3. Les tâches affichées doivent correspondre à votre recherche

### Étape 5: Tester la suppression (optionnel)
1. Trouvez une tâche
2. Cliquez sur le bouton **Supprimer** (🗑)
3. Confirmez la suppression
4. La tâche doit disparaître du tableau ET de la base de données

✅ **Si tout cela fonctionne**: Test 1 est **RÉUSSI**

---

## ✅ Test 2: Liste des Utilisateurs

### Étape 1: Naviguer vers la page
1. Restez connecté en tant qu'**Administrateur**
2. Cliquez sur **"Liste des utilisateurs"** dans le menu

### Étape 2: Vérifier la console
1. Appuyez sur **F12** (s'il est fermé, l'ouvrir)
2. Allez dans l'onglet **Console**
3. Cherchez les messages:
   ```
   ✅ [INIT] Démarrage du chargement des utilisateurs
   ✅ [API] Appel GET /users...
   ✅ [API RESPONSE] Status: 200
   ✅ Utilisateurs transformés et chargés
   📊 Nombre d'utilisateurs: 3
   ✅ TaskPRO Users List initialisé avec succès 🚀
   [RENDER] Affichage de 3 utilisateur(s)
   ```

### Étape 3: Vérifier le tableau
1. **IMPORTANT:** Devrait voir les **vrais utilisateurs** du système
2. Les 4 utilisateurs mockés d'avant **NE DOIVENT PAS** apparaître:
   - ❌ "John Doe" (john@taskpro.com)
   - ❌ "Sarah Smith" (sarah@taskpro.com)
   - ❌ "Mike Johnson" (mike@taskpro.com)
   - ❌ "Emma Brown" (emma@taskpro.com)

3. À la place, voir les utilisateurs **réels** créés dans le système (exemple: admin, employes, etc.)

### Étape 4: Vérifier les rôles
1. Regardez la colonne **Rôle**
2. Les rôles doivent être affichés correctement:
   - "Administrateur" → affiche "Admin"
   - "Employe" → affiche "User"
   - Pas de "SuperAdmin" (ils sont filtrés)

### Étape 5: Tester les modales
1. Cliquez sur un utilisateur
2. La modal **"Voir le profil"** doit s'ouvrir
3. Les informations affichées doivent correspondre à la base de données

✅ **Si tout cela fonctionne**: Test 2 est **RÉUSSI**

---

## ✅ Test 3: Création de Tâche (Vérification)

### Étape 1: Créer une tâche
1. Allez sur **"Créer une tâche"** dans le menu
2. Remplissez le formulaire:
   - **Nom:** "Tâche Test Dynamique"
   - **Description:** "Description de test"
   - **Utilisateur assigné:** Sélectionnez un utilisateur réel (cliquez sur "Choisir un utilisateur")
   - **Tâche parente:** Optionnel (cliquez sur "Choisir une tâche parente" pour voir les vraies tâches)

### Étape 2: Vérifier la console
1. Appuyez sur **F12**
2. Vérifiez qu'il n'y a **PAS** d'erreur
3. Cherchez les messages de création réussis

### Étape 3: Créer la tâche
1. Cliquez sur **"Créer la tâche"**
2. Devrait voir une confirmation de succès
3. Vous devez être redirigé vers la **liste des tâches**

### Étape 4: Vérifier la nouvelle tâche
1. Sur la page de la liste des tâches
2. Cherchez votre nouvelle tâche "Tâche Test Dynamique"
3. Elle doit apparaître dans le tableau avec les bonnes informations:
   - Nom correct
   - Utilisateur assigné correct
   - Date de création correcte

✅ **Si tout cela fonctionne**: Test 3 est **RÉUSSI**

---

## 📊 Checklist Complète

### Frontend
- [ ] task-list.js ne contient **PAS** de données mockées
- [ ] users-list.js ne contient **PAS** de données mockées
- [ ] task-list.html charge `api.js`
- [ ] users-list.html charge `api.js`
- [ ] Logs console affichent `[INIT]`, `[API]`, `[RENDER]`

### Backend
- [ ] GET `/taches/list` retourne les vraies tâches
- [ ] GET `/users` retourne les vrais utilisateurs
- [ ] POST `/taches/create` crée une vraie tâche en base de données
- [ ] DELETE `/taches/{id}` supprime réellement de la base de données

### Affichage
- [ ] Les vraies tâches s'affichent dans task-list.js
- [ ] Les vrais utilisateurs s'affichent dans users-list.js
- [ ] Les 4 tâches mockées ne s'affichent PAS
- [ ] Les 4 utilisateurs mockés ne s'affichent PAS

---

## 🐛 Dépannage

### Problème: Console affiche une erreur 401 ou 403
**Solution:** Vérifiez que:
- Vous êtes connecté (localStorage devrait avoir 'user')
- Votre utilisateur est bien Administrateur
- Essayez de vous déconnecter et reconnecter

### Problème: Le tableau affiche "Aucune tâche à afficher" ou "Aucun utilisateur à afficher"
**Solution:**
- Vérifiez que des tâches/utilisateurs existent réellement en base de données
- Vérifiez la console pour les erreurs API
- Essayez F5 (rafraîchir la page)

### Problème: Les 4 données mockées s'affichent toujours
**Solution:**
- Vérifiez que le fichier JS a bien été modifié (pas de cache du navigateur)
- Appuyez sur **Ctrl+Shift+Delete** pour vider le cache
- Ou ouvrez en navigation privée (Ctrl+Shift+P)

### Problème: Les logs n'affichent rien
**Solution:**
- Vérifiez que vous êtes connecté
- Vérifiez que `api.js` est chargé AVANT le fichier JS principal
- Vérifiez que la console n'est pas fermée

---

## 🎉 Résultat Attendu

### Avant la correction:
```
📋 LISTE DES TÂCHES (Mock):
1. Développer API backend - 5 tâches assignées
2. Créer formulaire inscription - 2 tâches assignées
3. Tests unitaires - 0 tâches assignées
4. Déployer application - 3 tâches assignées

👥 LISTE DES UTILISATEURS (Mock):
1. John Doe - john@taskpro.com - Admin
2. Sarah Smith - sarah@taskpro.com - User
3. Mike Johnson - mike@taskpro.com - SuperAdmin
4. Emma Brown - emma@taskpro.com - User
```

### Après la correction:
```
📋 LISTE DES TÂCHES (Réelles):
1. Créer documentation API (créée le 26/04)
2. Tâche Test Dynamique (créée à l'instant)
[Autres tâches créées via l'interface]

👥 LISTE DES UTILISATEURS (Réels):
1. admin@example.com - Admin
2. Employé 1 - employé1@example.com - User
[Autres utilisateurs créés dans le système]
```

---

**Rappel:** Les données affichées doivent maintenant venir **100% de la base de données**, pas des mockData!

✅ Bonne chance avec les tests!
