/**
 * ============================================================
 * TASKPRO - SESSION MANAGER
 * Gestion sécurisée des sessions, rôles et permissions
 * ============================================================
 */

class SessionManager {
    constructor() {
        this.user = null;
        this.isAuthenticated = false;
        this.userRole = null;
        this.permissions = new Map();
        this.init();
    }

    /**
     * Initialiser la session
     */
    init() {
        const stored = localStorage.getItem('user');
        if (stored) {
            try {
                this.user = JSON.parse(stored);
                this.isAuthenticated = true;
                this.userRole = this.user.role;
                this.loadPermissions();
            } catch (error) {
                console.error('Erreur lors du chargement de la session:', error);
                this.clear();
            }
        }
    }

    /**
     * Charger les permissions selon le rôle
     */
    loadPermissions() {
        // Définition des permissions par rôle
        const rolePermissions = {
            'SuperAdmin': [
                'view_dashboard',
                'create_task',
                'modify_own_task',
                'modify_all_tasks',
                'assign_task',
                'delete_task',
                'view_all_tasks',
                'create_user',
                'modify_user',
                'delete_user',
                'view_users',
                'view_notifications',
                'view_reports',
                'modify_role',
                'access_admin_panel'
            ],
            'Administrateur': [
                'view_dashboard',
                'create_task',
                'modify_own_task',
                'modify_all_tasks',
                'assign_task',
                'delete_task',
                'view_all_tasks',
                'view_notifications',
                'view_reports'
            ],
            'Employe': [
                'view_dashboard',
                'view_own_tasks',
                'modify_own_task',
                'view_notifications',
                'view_own_profile'
            ]
        };

        this.permissions.clear();
        const perms = rolePermissions[this.userRole] || [];
        perms.forEach(perm => this.permissions.set(perm, true));
    }

    /**
     * Vérifier si l'utilisateur a une permission
     */
    hasPermission(permission) {
        return this.permissions.has(permission) || false;
    }

    /**
     * Vérifier si l'utilisateur a TOUTES les permissions listées
     */
    hasAllPermissions(permissions) {
        return permissions.every(perm => this.hasPermission(perm));
    }

    /**
     * Vérifier si l'utilisateur a AU MOINS UNE des permissions listées
     */
    hasAnyPermission(permissions) {
        return permissions.some(perm => this.hasPermission(perm));
    }

    /**
     * Se connecter
     */
    async login(email, password) {
        try {
            loaderManager.show('Connexion en cours');
            const response = await api.login(email, password);

            if (response.success && response.user) {
                this.user = response.user;
                this.isAuthenticated = true;
                this.userRole = response.user.role;
                this.loadPermissions();

                // Stocker localement
                localStorage.setItem('user', JSON.stringify(this.user));
                localStorage.setItem('authenticated', 'true');

                loaderManager.hide();
                loaderManager.toast('Connexion réussie!', 'success');
                return true;
            } else {
                loaderManager.hide();
                loaderManager.toast(response.message || 'Erreur de connexion', 'error');
                return false;
            }
        } catch (error) {
            loaderManager.hide();
            loaderManager.toast('Erreur de connexion: ' + error.message, 'error');
            return false;
        }
    }

    /**
     * Se déconnecter
     */
    async logout() {
        try {
            await api.logout();
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
        } finally {
            this.clear();
            localStorage.removeItem('user');
            localStorage.removeItem('authenticated');
            window.location.href = 'login.html';
        }
    }

    /**
     * S'inscrire
     */
    async register(email, password, nom, prenom, sexe, poste) {
        try {
            loaderManager.show('Inscription en cours');
            const response = await api.register(email, password, nom, prenom, sexe, poste);

            if (response.success) {
                loaderManager.hide();
                loaderManager.toast('Inscription réussie! Veuillez vous connecter.', 'success');
                return true;
            } else {
                loaderManager.hide();
                loaderManager.toast(response.message || 'Erreur d\'inscription', 'error');
                return false;
            }
        } catch (error) {
            loaderManager.hide();
            loaderManager.toast('Erreur d\'inscription: ' + error.message, 'error');
            return false;
        }
    }

    /**
     * Obtenir l'utilisateur courant
     */
    getUser() {
        return this.user;
    }

    /**
     * Obtenir le rôle
     */
    getRole() {
        return this.userRole;
    }

    /**
     * Vérifier l'authentification
     */
    isLoggedIn() {
        return this.isAuthenticated && this.user !== null;
    }

    /**
     * Rediriger si non authentifié
     */
    requireAuth() {
        if (!this.isLoggedIn()) {
            window.location.href = 'login.html';
            return false;
        }
        return true;
    }

    /**
     * Rediriger si permission manquante
     */
    requirePermission(permission) {
        if (!this.hasPermission(permission)) {
            loaderManager.toast('Accès refusé: permission insuffisante', 'error');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
            return false;
        }
        return true;
    }

    /**
     * Rediriger si rôle incorrect
     */
    requireRole(role) {
        if (Array.isArray(role)) {
            if (!role.includes(this.userRole)) {
                loaderManager.toast('Accès refusé pour votre rôle', 'error');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 2000);
                return false;
            }
        } else {
            if (this.userRole !== role) {
                loaderManager.toast('Accès refusé pour votre rôle', 'error');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 2000);
                return false;
            }
        }
        return true;
    }

    /**
     * Nettoyer la session
     */
    clear() {
        this.user = null;
        this.isAuthenticated = false;
        this.userRole = null;
        this.permissions.clear();
    }

    /**
     * Obtenir le poids/niveau d'accès (pour interface dynamique)
     */
    getAccessLevel() {
        const levels = {
            'SuperAdmin': 3,
            'Administrateur': 2,
            'Employe': 1
        };
        return levels[this.userRole] || 0;
    }

    /**
     * Vérifier si l'utilisateur est SuperAdmin
     */
    isSuperAdmin() {
        return this.userRole === 'SuperAdmin';
    }

    /**
     * Vérifier si l'utilisateur est Admin ou SuperAdmin
     */
    isAdmin() {
        return ['SuperAdmin', 'Administrateur'].includes(this.userRole);
    }

    /**
     * Vérifier si l'utilisateur est Employe
     */
    isEmploye() {
        return this.userRole === 'Employe';
    }
}

// Instancier le gestionnaire de session globalement
const sessionManager = new SessionManager();

// Export pour modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SessionManager;
}
