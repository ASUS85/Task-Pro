# 🚀 TaskPRO - Notes de Migration et Correctifs API

Ce document récapitule les modifications techniques majeures apportées à l'application **TaskPRO** pour résoudre les problèmes d'affichage des tâches, de synchronisation des compteurs et de gestion du profil utilisateur.

À lire attentivement avant de procéder à la fusion (`merge`) des branches.

---

## 📌 Problématiques résolues
1. **Tableau des tâches vide :** L'API `taches/list` reposait uniquement sur les sessions PHP (`$_SESSION['user_id']`). En raison des restrictions de partage de cookies de session entre le Frontend HTML et le Backend PHP local, la session sautait, renvoyant un tableau vide `[]`.


2. **Statistiques bloquées à 0 :** Les requêtes PHP filtraient le statut des tâches en cours avec la chaîne `'en cours'`, alors que la base de données SQL utilise la valeur **`'non terminé'`**.


3. **Mise à jour Profil :** Harmonisation des appels AJAX et des routes de l'API pour la modification des informations utilisateur.

---

## 🛠️ Détail des modifications par fichier

### 1. `public/api.php` (Backend)
* **Route `taches/list` (GET) :** Ajout d'un système de secours (*fallback*). L'API accepte désormais un paramètre `user_id` directement dans l'URL. Si la session PHP est introuvable, le script s'appuie sur cet ID pour charger les tâches.

* **Route `dashboard/stats` (GET) :** Correction des filtres d'agrégation (`array_filter`). Prise en compte du statut textuel exact de la base de données : `non terminé` (au lieu de `en cours`).


* **Route `auth/update-profile` (POST) :** Intégration et liaison correcte avec la méthode `mettreAJour()` de `UtilisateurDAO` en utilisant l'ID de la session active (`$_SESSION['user_id']`).


* **Route `auth/change-password` (POST) :** Ajout d'une vérification sécurisée. Si la méthode `modifierMotdepass` existe dans `AuthServices`, elle est appelée ; sinon, le script bascule sur `changerMotDePasse()` du DAO avec un hachage `PASSWORD_BCRYPT`.


### 2. `Frontend/js/api.js` (Services API)
* **Fonction `apiListTasks()` :** Modification de l'appel Fetch pour récupérer l'ID de l'utilisateur connecté depuis le `localStorage` et le transmettre explicitement dans la requête :
  ```javascript
  const response = await apiCall(`/taches/list?user_id=${user.id}`, 'GET');