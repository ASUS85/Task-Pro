/**
 * ============================================================
 * TASKPRO - API CLIENT AVANCÉ (V2.0)
 * Client API centralisé avec gestion complète et robuste
 * ============================================================
 */

const API_BASE_URL = (() => {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port ? ':' + window.location.port : '';
    return `${protocol}//${hostname}${port}/Task-Pro/public/api.php`;
})();


/**
 * Helper centralisé pour toutes les requêtes API
 */
async function apiCall(endpoint, method = 'GET', data = null, options = {}) {
    const {
        showLoader = true,
        loaderMessage = 'Chargement',
        showToast = true
    } = options;

    try {
        if (showLoader) {
            loaderManager.showProgress();
        }

        const fetchOptions = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include' // Pour les sessions
        };

        if (data) {
            fetchOptions.body = JSON.stringify(data);
        }

        const url = `${API_BASE_URL}${endpoint}`;
        const response = await fetch(url, fetchOptions);
        const result = await response.json();

        if (!response.ok) {
            // Gérer l'authentification expiree
            if (response.status === 401) {
                localStorage.removeItem('user');
                localStorage.removeItem('authenticated');
                window.location.href = '/Task-Pro/Frontend/login.html';
                throw new Error('Session expirée');
            }
            
            throw new Error(result.message || `Erreur HTTP ${response.status}`);
        }

        if (showLoader) {
            loaderManager.hideProgress();
        }

        if (showToast && result.success) {
            loaderManager.toast('Opération réussie', 'success', 2000);
        }

        return result;
    } catch (error) {
        if (showLoader) {
            loaderManager.hideProgress();
        }

        if (showToast) {
            loaderManager.toast(error.message || 'Erreur réseau', 'error', 3000);
        }

        console.error('API Error:', {
            endpoint,
            method,
            error: error.message,
            stack: error.stack
        });

        throw error;
    }
}

/**
 * =====================================================
 * AUTH - AUTHENTIFICATION
 * =====================================================
 */

async function apiRegister(userData) {
    if (!userData.email || !userData.password || !userData.nom || !userData.prenom) {
        throw new Error('Tous les champs obligatoires doivent être remplis');
    }

    if (userData.password !== userData.confirm_password) {
        throw new Error('Les mots de passe ne correspondent pas');
    }

    if (!isValidEmail(userData.email)) {
        throw new Error('Email invalide');
    }

    return apiCall('/auth/register', 'POST', {
        nom: userData.nom.trim(),
        prenom: userData.prenom.trim(),
        sexe: userData.sexe || 'Non spécifié',
        poste: userData.poste?.trim() || '',
        email: userData.email.trim(),
        password: userData.password,
        confirm_password: userData.confirm_password
    }, { showToast: false });
}

async function apiLogin(email, password) {
    if (!email || !password) {
        throw new Error('Email et mot de passe requis');
    }

    const result = await apiCall('/auth/login', 'POST', {
        email: email.trim(),
        password: password
    }, { showToast: false });

    if (result.success && result.user) {
        sessionManager.setUser(result.user);
    }

    return result;
}

async function apiLogout() {
    try {
        return apiCall('/auth/logout', 'POST', null, { showToast: false });
    } catch (e) {
        console.warn('Logout failed, clearing local session anyway', e);
    }
}

async function apiGetCurrentUser() {
    const response = await apiCall('/auth/me', 'GET', null, { showLoader: false });
    return response.user;
}

/**
 * =====================================================
 * TACHES - GESTION DES TÂCHES
 * =====================================================
 */

async function apiCreateTask(taskData) {
    return apiCall('/taches/create', 'POST', taskData);
}

async function apiListTasks(options = {}) {
    const result = await apiCall('/taches/list', 'GET', null, {
        showLoader: options.showLoader !== false,
        showToast: false
    });
    return result.taches || [];
}

async function apiGetTask(taskId) {
    const response = await apiCall(`/taches/${taskId}`, 'GET', null, { showLoader: false });
    return response.tache;
}

async function apiUpdateTaskStatus(taskId, status) {
    return apiCall(`/taches/${taskId}/status`, 'PUT', { status });
}

async function apiAssignTask(taskId, userId) {
    return apiCall(`/taches/${taskId}/assign`, 'PUT', { id_responsable: userId });
}

async function apiDeleteTask(taskId) {
    return apiCall(`/taches/${taskId}`, 'DELETE');
}

async function apiModifyTaskResponsible(taskId, newResponsibleId) {
    return apiCall(`/taches/${taskId}/assign`, 'PUT', { id_responsable: newResponsibleId });
}

/**
 * =====================================================
 * NOTIFICATIONS
 * =====================================================
 */

async function apiGetNotifications() {
    try {
        const response = await apiCall('/notifications', 'GET', null, {
            showLoader: false,
            showToast: false
        });
        return response.notifications || [];
    } catch (error) {
        console.warn('Notifications non disponibles');
        return [];
    }
}

/**
 * =====================================================
 * ADMIN - GESTION UTILISATEURS
 * =====================================================
 */

async function apiCreateUser(userData) {
    if (!sessionManager.isSuperAdmin()) {
        throw new Error('Accès refusé: Super Admin seulement');
    }

    return apiCall('/admin/users/create', 'POST', {
        nom: userData.nom?.trim(),
        prenom: userData.prenom?.trim(),
        sexe: userData.sexe || 'Non spécifié',
        poste: userData.poste?.trim() || '',
        email: userData.email?.trim(),
        role: userData.role || 'Employe'
    });
}

async function apiListUsers() {
    if (!sessionManager.isAdmin()) {
        throw new Error('Accès refusé: Admin seulement');
    }

    const response = await apiCall('/admin/users', 'GET', null, {
        showLoader: true,
        showToast: false
    });
    return response.users || [];
}

/**
 * =====================================================
 * UTILITAIRES
 * =====================================================
 */

function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function getCurrentUserFromStorage() {
    try {
        const userJson = localStorage.getItem('user');
        return userJson ? JSON.parse(userJson) : null;
    } catch (e) {
        return null;
    }
}

function isAuthenticated() {
    return localStorage.getItem('authenticated') === 'true' && !!getCurrentUserFromStorage();
}

function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = '/Task-Pro/Frontend/login.html';
    }
}

/**
 * Formater une date en français
 */
function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return d.toLocaleDateString('fr-FR', options);
}

/**
 * Formater une date et heure
 */
function formatDateTime(date) {
    if (!date) return '';
    const d = new Date(date);
    const dateStr = d.toLocaleDateString('fr-FR');
    const timeStr = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} ${timeStr}`;
}

/**
 * Obtenir le temps écoulé depuis une date
 */
function getTimeAgo(date) {
    const d = new Date(date);
    const now = new Date();
    const seconds = Math.floor((now - d) / 1000);
    
    if (seconds < 60) return 'à l\'instant';
    if (seconds < 3600) return `il y a ${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `il y a ${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `il y a ${Math.floor(seconds / 86400)}j`;
    
    return formatDate(date);
}

/**
 * Afficher le statut avec couleur et texte
 */
function getStatusDisplay(status) {
    const statusMap = {
        'non assigné': { text: 'Non assigné', color: '#999' },
        'assigné': { text: 'Assigné', color: '#5DADE2' },
        'en cours': { text: 'En cours', color: '#F39C12' },
        'non terminé': { text: 'Non terminé', color: '#E74C3C' },
        'terminé': { text: 'Terminé', color: '#27AE60' }
    };
    return statusMap[status] || { text: status, color: '#95A5A6' };
}

/**
 * Afficher le rôle avec texte français
 */
function getRoleDisplay(role) {
    const roleMap = {
        'SuperAdmin': 'Super Administrateur',
        'Administrateur': 'Administrateur',
        'Employe': 'Employé',
        'SuperSuperAdmin': 'Admin Système'
    };
    return roleMap[role] || role;
}
