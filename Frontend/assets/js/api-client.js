/**
 * ============================================================
 * TASKPRO - API CLIENT (RÉUTILISABLE)
 * Client centralisé pour toutes les requêtes API
 * ============================================================
 */

class ApiClient {
    constructor(baseUrl = `${window.location.pathname.includes('/Frontend/') ? window.location.pathname.split('/Frontend/')[0] : ''}/public/api.php`) {
        this.baseUrl = baseUrl;
        this.timeout = 30000;
        this.headers = {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        };
    }

    /**
     * Effectuer une requête HTTP
     * @param {string} method - Méthode HTTP (GET, POST, PUT, DELETE)
     * @param {string} endpoint - Endpoint API (ex: /auth/login)
     * @param {object} data - Données à envoyer
     * @param {object} options - Options additionnelles
     */
    async request(method, endpoint, data = null, options = {}) {
        const url = `${this.baseUrl}?action=${endpoint}`;
        
        const fetchOptions = {
            method,
            headers: this.headers,
            signal: AbortSignal.timeout(this.timeout)
        };

        if (data && (method === 'POST' || method === 'PUT')) {
            fetchOptions.body = JSON.stringify(data);
        }

        if (options.headers) {
            fetchOptions.headers = { ...fetchOptions.headers, ...options.headers };
        }

        try {
            const response = await fetch(url, fetchOptions);
            
            if (!response.ok) {
                throw new Error(`Erreur HTTP ${response.status}`);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error(`Erreur API [${method} ${endpoint}]:`, error);
            throw error;
        }
    }

    /**
     * Authentification - Inscription
     */
    async register(email, password, nom, prenom, sexe, poste) {
        return this.request('POST', 'auth/register', {
            email,
            password,
            confirm_password: password,
            nom,
            prenom,
            sexe,
            poste
        });
    }

    /**
     * Authentification - Connexion
     */
    async login(email, password) {
        return this.request('POST', 'auth/login', { email, password });
    }

    /**
     * Authentification - Déconnexion
     */
    async logout() {
        return this.request('POST', 'auth/logout', {});
    }

    /**
     * Authentification - Obtenir utilisateur courant
     */
    async getCurrentUser() {
        return this.request('GET', 'auth/me');
    }

    /**
     * Tâches - Créer une tâche
     */
    async createTask(libelle, description, periode_realisation, id_responsable = null) {
        return this.request('POST', 'taches/create', {
            libelle,
            description,
            periode_realisation,
            id_responsable
        });
    }

    /**
     * Tâches - Lister les tâches
     */
    async getTasks(filters = {}) {
        return this.request('GET', 'taches/list');
    }

    /**
     * Tâches - Obtenir une tâche spécifique
     */
    async getTask(id) {
        return this.request('GET', `taches/${id}`);
    }

    /**
     * Tâches - Modifier le statut
     */
    async updateTaskStatus(id, status) {
        return this.request('PUT', `taches/${id}/status`, { status });
    }

    /**
     * Tâches - Assigner une tâche
     */
    async assignTask(id, id_responsable) {
        return this.request('PUT', `taches/${id}/assign`, { id_responsable });
    }

    /**
     * Tâches - Supprimer une tâche
     */
    async deleteTask(id) {
        return this.request('DELETE', `taches/${id}`);
    }

    /**
     * Notifications - Lister les notifications
     */
    async getNotifications() {
        return this.request('GET', 'notifications');
    }

    /**
     * Admin - Créer un utilisateur
     */
    async createUser(nom, prenom, sexe, poste, email, role) {
        return this.request('POST', 'admin/users/create', {
            nom,
            prenom,
            sexe,
            poste,
            email,
            role
        });
    }

    /**
     * Admin - Lister les utilisateurs
     */
    async getUsers() {
        return this.request('GET', 'admin/users');
    }

    /**
     * Méthode wrapper pour requête avec loader
     */
    async withLoader(promise, options = {}) {
        if (typeof loaderManager !== 'undefined') {
            return loaderManager.withLoader(promise, options);
        }
        return promise;
    }
}

// Instancier le client API globalement
const api = new ApiClient();

// Export pour modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiClient;
}
