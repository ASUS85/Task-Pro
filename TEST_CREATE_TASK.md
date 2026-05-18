# Plan de Test - Création de Tâche

## Modifications Apportées

### 1. **Frontend/create-task.js**
   - ✅ Suppression des données mockées
   - ✅ Intégration avec les API réelles
   - ✅ Chargement dynamique des utilisateurs et tâches parentes
   - ✅ Validation des champs obligatoires

### 2. **Frontend/api.js**
   - ✅ Modification de `apiListUsers()` pour utiliser le nouvel endpoint `/users`

### 3. **Public/api.php**
   - ✅ Création du nouvel endpoint `/users` (accessible par Administrateurs)
   - ✅ Filtrage des SuperAdmin

---

## Checklist de Test

### Préalables
- [ ] Connecté avec un compte Administrateur
- [ ] La base de données contient au moins 2-3 utilisateurs non-SuperAdmin
- [ ] Au moins 2-3 tâches existent en base de données

### Tests de Chargement
- [ ] Page se charge sans erreur console
- [ ] Les données (utilisateurs et tâches) sont chargées au démarrage
- [ ] Console affiche: "Utilisateurs disponibles: X" et "Tâches disponibles: X"

### Test Modal Tâche Parent
- [ ] Clic sur "Sélectionner une tâche parent" ouvre la modal
- [ ] Les tâches parentes s'affichent dans la modal
- [ ] La recherche filtre les tâches correctement
- [ ] Clic sur une tâche parent remplit le champ "Tâche Parent / Dépendance"
- [ ] Clic sur "✖ Aucune tâche parent" réinitialise la sélection

### Test Modal Utilisateurs
- [ ] Clic sur "Assigner à un utilisateur" ouvre la modal
- [ ] Les utilisateurs s'affichent (sans SuperAdmin)
- [ ] La recherche filtre les utilisateurs par nom
- [ ] Le filtre par rôle fonctionne
- [ ] Clic sur un utilisateur remplit le champ "Assigner à un utilisateur"
- [ ] Clic sur "✖ Aucun utilisateur" réinitialise la sélection

### Test Validation du Formulaire
- [ ] Erreur si le **libellé** est vide
- [ ] Erreur si la **description** est vide
- [ ] Erreur si la **durée/échéance** est vide
- [ ] Modal de confirmation s'affiche si tous les champs sont remplis

### Test Création de Tâche
- [ ] Remplir tous les champs obligatoires
- [ ] Sélectionner optionnellement une tâche parent et un utilisateur
- [ ] Clic sur "Créer la tâche"
- [ ] Modal de confirmation s'affiche
- [ ] Clic sur "Confirmer"
- [ ] Message de succès s'affiche
- [ ] Formulaire se réinitialise
- [ ] Vérifier en base de données que la tâche est créée

### Test Gestion Fichiers (Optionnel)
- [ ] Clic sur "Ajouter / Attacher un fichier" ouvre le sélecteur
- [ ] Les fichiers s'affichent correctement après sélection
- [ ] Clic sur "✖" supprime un fichier de la liste

### Test Statuts
- [ ] Statuts disponibles: "Non assignée", "Assignée", "En cours", "Non terminée", "Terminée"
- [ ] Sélectionner un utilisateur change automatiquement le statut à "Assignée"
- [ ] Sélectionner une tâche parent change le statut à "Non assignée"

### Test Erreurs
- [ ] En cas d'erreur API (utilisateurs), un message d'erreur s'affiche
- [ ] En cas d'erreur lors de la création, le message d'erreur est affiché à l'utilisateur

---

## Détails de Débogage

### Vérifier dans la Console
```javascript
console.log('realUsers:', realUsers);
console.log('realTasks:', realTasks);
```

### Vérifier les Appels API
1. Ouvrir les **Outils de Développement** (F12)
2. Aller dans l'onglet **Network**
3. Charger la page
4. Vérifier les appels:
   - `/api.php/users` (GET) - doit retourner les utilisateurs
   - `/api.php/taches/list` (GET) - doit retourner les tâches
   - `/api.php/taches/create` (POST) - création de tâche

### Vérifier la Base de Données
```sql
SELECT id, libelle, description, status, id_responsable FROM taches ORDER BY dateCreation DESC LIMIT 5;
```

---

## Contrats des Endpoints

### GET /users
**Authentification:** Oui (Administrateur/SuperAdmin)
**Réponse:**
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

### GET /taches/list
**Authentification:** Oui
**Réponse:**
```json
{
  "success": true,
  "taches": [
    {
      "id": 1,
      "libelle": "Titre de la tâche",
      "description": "Description...",
      "status": "assigné",
      "id_parent": null,
      "dateCreation": "2026-05-18 10:30:00",
      "id_responsable": 2,
      ...
    }
  ]
}
```

### POST /taches/create
**Authentification:** Oui (Administrateur/SuperAdmin)
**Données:**
```json
{
  "libelle": "Titre",
  "description": "Description",
  "periode_realisation": "2026-06-18T14:30",
  "id_responsable": 2,
  "id_parent": null,
  "status": "assigné",
  "cheminFichier": null
}
```
**Réponse:**
```json
{
  "success": true
}
```

---

## Résumé des Changements
- Suppression complète des données mockées
- Intégration avec l'API réelle
- Nouvel endpoint `/users` pour les Administrateurs
- Validation complète du formulaire
- Gestion des erreurs API
- Initialisiation automatique au chargement de la page
