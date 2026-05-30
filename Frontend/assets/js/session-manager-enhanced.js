/**
 * ============================================================
 * TASKPRO - SESSION MANAGER (V2.0)
 * Gestion centralisée des sessions et utilisateurs
 * ============================================================
 */

class SessionManager {
    constructor() {
        this.user = this.loadUser();
        this.authenticated = !!this.user;
        this.init();
    }

    /**
     * Charger les infos utilisateur depuis localStorage
     */
    loadUser() {
        try {
            const userJson = localStorage.getItem('user');
            return userJson ? JSON.parse(userJson) : null;
        } catch (e) {
            console.error('Erreur chargement utilisateur:', e);
            return null;
        }
    }

    /**
     * Sauvegarder utilisateur
     */
    saveUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('authenticated', 'true');
        this.user = user;
        this.authenticated = true;
        this.updateUI();
    }

    /**
     * Initialiser les éléments UI de session
     */
    init() {
        // Mettre à jour l'interface avec les infos utilisateur
        this.updateUI();
        
        // Vérifier l'auth si pas sur les pages publiques
        const publicPages = ['login', 'inscription', 'index'];
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        if (!publicPages.some(p => currentPage.includes(p)) && !this.authenticated) {
            window.location.href = this.frontendUrl('login.html');
        }
    }

    /**
     * Mettre à jour l'affichage des infos utilisateur
     */
    updateUI() {
        if (!this.user) return;

        const userNameElements = document.querySelectorAll('#userName, #topUserName');
        const userRoleElements = document.querySelectorAll('#userRole, #topUserRole');
        const avatarElements = document.querySelectorAll('#userAvatar, #topUserAvatar, #profileAvatar');
        
        userNameElements.forEach(el => {
            el.textContent = `${this.user.nom} ${this.user.prenom || ''}`;
        });

        userRoleElements.forEach(el => {
            el.textContent = this.getRoleDisplay(this.user.role);
        });

        const initials = `${this.user.nom[0]}${this.user.prenom ? this.user.prenom[0] : ''}`.toUpperCase();
        avatarElements.forEach(el => {
            el.textContent = initials;
        });

        // Afficher/masquer menu admin si nécessaire
        this.updateAdminMenu();
    }

    /**
     * Afficher ou masquer le menu admin selon le rôle
     */
    updateAdminMenu() {
        const usersLink = document.getElementById('usersLink');
        const isAdmin = this.user && ['SuperAdmin', 'Administrateur'].includes(this.user.role);
        
        if (usersLink) {
            usersLink.style.display = isAdmin ? 'flex' : 'none';
        }
    }

    /**
     * Convertir le rôle en affichage français
     */
    getRoleDisplay(role) {
        const roleMap = {
            'SuperAdmin': 'Super Administrateur',
            'Administrateur': 'Administrateur',
            'Employe': 'Employé',
            'SuperSuperAdmin': 'Admin Système'
        };
        return roleMap[role] || role;
    }

    /**
     * Vérifier si utilisateur connecté
     */
    isAuthenticated() {
        return this.authenticated && !!this.user;
    }

    /**
     * Vérifier si utilisateur a un rôle spécifique
     */
    hasRole(role) {
        return this.user && this.user.role === role;
    }

    /**
     * Vérifier si utilisateur est admin
     */
    isAdmin() {
        return this.user && ['SuperAdmin', 'Administrateur'].includes(this.user.role);
    }

    /**
     * Vérifier si utilisateur est SuperAdmin
     */
    isSuperAdmin() {
        return this.user && this.user.role === 'SuperAdmin';
    }

    /**
     * Déconnexion
     */
    async logout() {
        try {
            await apiLogout();
        } catch (e) {
            console.error('Erreur déconnexion:', e);
        } finally {
            localStorage.removeItem('user');
            localStorage.removeItem('authenticated');
            this.user = null;
            this.authenticated = false;
            window.location.href = this.frontendUrl('login.html');
        }
    }

    frontendUrl(page) {
        const appBasePath = window.location.pathname.includes('/Frontend/')
            ? window.location.pathname.split('/Frontend/')[0]
            : '';
        return `${appBasePath}/Frontend/${page}`;
    }

    /**
     * Définir l'utilisateur connecté
     */
    setUser(user) {
        this.saveUser(user);
    }

    /**
     * Obtenir l'utilisateur actuel
     */
    getUser() {
        return this.user;
    }

    /**
     * Obtenir l'ID utilisateur
     */
    getUserId() {
        return this.user?.id;
    }
}

// Instance globale
const sessionManager = new SessionManager();

// Initialiser au chargement
document.addEventListener('DOMContentLoaded', () => {
    sessionManager.init();
});
