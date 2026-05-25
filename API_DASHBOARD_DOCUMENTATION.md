# 📡 API Dashboard - Documentation des Endpoints

## 🔐 Authentification Requise

Tous les endpoints du dashboard nécessitent une session utilisateur active (`$_SESSION['user_id']` et `$_SESSION['user_role']`).

---

## 📊 Endpoint: `GET /dashboard/stats`

### Description
Récupère les statistiques du dashboard selon le rôle de l'utilisateur.

### URL
```
GET /public/api.php/dashboard/stats
```

### Authentification
✅ Requise (session)

### Réponse Succès (Code 200)

#### Pour SuperAdmin/Administrateur
```json
{
    "success": true,
    "stats": {
        "totalTaches": 24,
        "tachesEnCours": 7,
        "tachesTerminees": 12,
        "tachesNonAssignees": 3,
        "tachesAssignees": 9,
        "utilisateurActif": "John Doe",
        "role": "SuperAdmin",
        "totalUtilisateurs": 15,
        "adminCount": 2,
        "employeCount": 13
    }
}
```

#### Pour Employé
```json
{
    "success": true,
    "stats": {
        "totalTaches": 5,
        "tachesEnCours": 2,
        "tachesTerminees": 3,
        "tachesAssignees": 5,
        "utilisateurActif": "Jane Smith",
        "role": "Employe"
    }
}
```

### Erreurs Possibles

#### Code 401 (Non Authentifié)
```json
{
    "success": false,
    "message": "Non authentifié"
}
```

#### Code 400 (Erreur Serveur)
```json
{
    "success": false,
    "message": "Description de l'erreur"
}
```

### Exemple de Requête
```javascript
fetch('/Task-Pro/public/api.php/dashboard/stats', {
    method: 'GET',
    credentials: 'include'
})
.then(res => res.json())
.then(data => console.log(data.stats));
```

---

## 📝 Endpoint: `GET /dashboard/recent-tasks`

### Description
Récupère les 5 tâches les plus récentes selon le rôle.
- SuperAdmin/Admin: Toutes les tâches
- Employé: Seulement ses tâches assignées

### URL
```
GET /public/api.php/dashboard/recent-tasks
```

### Authentification
✅ Requise (session)

### Réponse Succès (Code 200)

#### Format de Réponse
```json
{
    "success": true,
    "tasks": [
        {
            "id": 102,
            "libelle": "Développer API REST",
            "description": "Créer endpoints pour gestion tâches",
            "status": "en cours",
            "id_responsable": 5,
            "responsable": "Jane Smith",
            "dateCreation": "2026-04-01 10:30:00",
            "periode_realisation": "10j"
        },
        {
            "id": 101,
            "libelle": "Analyser les besoins",
            "description": "Comprendre les requirements",
            "status": "terminé",
            "id_responsable": 5,
            "responsable": "Jane Smith",
            "dateCreation": "2026-03-28 09:00:00",
            "periode_realisation": "3j"
        }
    ]
}
```

### Champs Retournés
| Champ | Type | Description |
|-------|------|-------------|
| `id` | integer | ID unique de la tâche |
| `libelle` | string | Titre/nom de la tâche |
| `description` | string | Description détaillée |
| `status` | string | État (en cours, terminé, assigné, non assigné) |
| `id_responsable` | integer | ID de la personne responsable |
| `responsable` | string | Nom du responsable |
| `dateCreation` | datetime | Date de création |
| `periode_realisation` | string | Durée (ex: 10j, 5h) |

### Statuts Possibles
```
- "non assigné"  → Tâche non assignée
- "assigné"      → Tâche assignée à quelqu'un
- "en cours"     → Tâche en cours d'exécution
- "terminé"      → Tâche complétée
```

### Erreurs Possibles

#### Code 401 (Non Authentifié)
```json
{
    "success": false,
    "message": "Non authentifié"
}
```

#### Code 400 (Erreur Serveur)
```json
{
    "success": false,
    "message": "Description de l'erreur"
}
```

### Exemple de Requête
```javascript
fetch('/Task-Pro/public/api.php/dashboard/recent-tasks', {
    method: 'GET',
    credentials: 'include'
})
.then(res => res.json())
.then(data => {
    data.tasks.forEach(task => {
        console.log(`${task.libelle} - ${task.status}`);
    });
});
```

---

## 🔍 Endpoints Connexes

### GET `/auth/me`
Récupère les infos de l'utilisateur connecté.

**Réponse**:
```json
{
    "success": true,
    "user": {
        "id": 1,
        "nom": "Doe",
        "prenom": "John",
        "email": "john@example.com",
        "role": "SuperAdmin",
        "poste": "Manager",
        "sexe": "M"
    }
}
```

### POST `/auth/logout`
Déconnecte l'utilisateur et détruit la session.

**Réponse**:
```json
{
    "success": true
}
```

---

## 🚀 Intégration Front-end

### Chargement des Données (Vue d'ensemble)

```javascript
// 1. Charger l'utilisateur
const userResponse = await fetch('/Task-Pro/public/api.php/auth/me', {
    credentials: 'include'
});
const userData = await userResponse.json();
const user = userData.user;

// 2. Charger les stats
const statsResponse = await fetch('/Task-Pro/public/api.php/dashboard/stats', {
    credentials: 'include'
});
const statsData = await statsResponse.json();
const stats = statsData.stats;

// 3. Charger les tâches
const tasksResponse = await fetch('/Task-Pro/public/api.php/dashboard/recent-tasks', {
    credentials: 'include'
});
const tasksData = await tasksResponse.json();
const tasks = tasksData.tasks;

// 4. Afficher les données
document.querySelector('[data-stat="totalTaches"]').textContent = stats.totalTaches;
tasks.forEach(task => {
    console.log(task.libelle);
});
```

### Gestion des Erreurs

```javascript
async function loadDashboard() {
    try {
        const response = await fetch('/Task-Pro/public/api.php/dashboard/stats', {
            credentials: 'include'
        });

        if (response.status === 401) {
            // Rediriger vers login
            window.location.href = '/Task-Pro/Frontend/login.html';
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.message);
        }

        // Utiliser data.stats
        return data.stats;

    } catch (error) {
        console.error('Erreur dashboard:', error);
        showErrorMessage(error.message);
    }
}
```

---

## 🛡️ Sécurité et Restrictions

### Vérifications Côté Serveur

1. **Authentification**: `requireAuth()` vérifie `$_SESSION['user_id']`
2. **Rôle**: Filtrage basé sur `$_SESSION['user_role']`
3. **Données Filtrées**:
   - Les employés ne voient que leurs tâches (`id_responsable == user_id`)
   - Les admins voient toutes les tâches
4. **Erreurs**: Les messages d'erreur ne divulguent pas d'info sensible

### Vérifications Côté Client

1. **Redirection**: Basée sur le rôle de l'utilisateur
2. **Visibilité**: Éléments `data-admin-only` cachés pour les employés
3. **Affichage**: Les données censurées ne s'affichent pas

---

## 📈 Performance

### Optimisations
- ✅ Requêtes parallèles (Promise.all)
- ✅ Cache sessionStorage
- ✅ Auto-refresh limité (5 min)
- ✅ Limitation des résultats (5 tâches max)

### Temps de Réponse Attendus
- `/dashboard/stats`: ~100-200ms
- `/dashboard/recent-tasks`: ~150-300ms

---

## 🔄 Flux de Données

```
┌─────────────────────────────────────┐
│   Page Dashboard (HTML)             │
└──────────────────┬──────────────────┘
                   │
         ┌─────────▼──────────┐
         │ dashboard-unified.js│
         └─────────┬──────────┘
                   │
     ┌─────────────┼─────────────┐
     │             │             │
     ▼             ▼             ▼
  /auth/me   /dashboard/stats   /dashboard/recent-tasks
     │             │             │
     └─────────────┼─────────────┘
                   │
         ┌─────────▼──────────┐
         │   API (api.php)    │
         └─────────┬──────────┘
                   │
     ┌─────────────┼─────────────┐
     │             │             │
     ▼             ▼             ▼
   DAO      TacheService    NotificationService
     │             │             │
     └─────────────┼─────────────┘
                   │
               ┌───▼────┐
               │ MySQL  │
               └────────┘
```

---

## 📝 Format de Réponse Standard

Tous les endpoints retournent du JSON au format:

```json
{
    "success": true|false,
    "message": "Optional error message",
    "data": {}  // Contenu spécifique
}
```

---

**Dernière mise à jour**: 29 avril 2026  
**Version API**: 3.0
