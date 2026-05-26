/**
 * TASKPRO - API CLIENT
 * Gestion centralisée des appels API vers le backend
 */

// ========================================
// CONFIGURATION API
// ========================================
const API_BASE_URL = window.location.protocol + '//' + window.location.hostname +
    (window.location.port ? ':' + window.location.port : '') +
    '/Task-Pro/public/api.php';

console.log('API_BASE_URL:', API_BASE_URL);

/**
 * Helper pour faire des appels API avec gestion d'erreurs
 */
async function apiCall(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include' // Pour les sessions/cookies
        };

        if (data) {
            options.body = JSON.stringify(data);
        }
        console.log(`[API] ${method} ${endpoint}`, data || '');

        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const result = await response.json();

        console.log(`[API RESPONSE] Status: ${response.status}`, result);

        // Vérifier le statut HTTP OU le champ success
        if (!response.ok || !result.success) {
            const errorMsg = result.message || `Erreur HTTP ${response.status}`;
            console.error(`[API ERROR] ${errorMsg}`);
            throw new Error(errorMsg);
        }

        return result;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ========================================
// AUTH ENDPOINTS
// ========================================

/**
 * Inscription - Crée un nouveau compte utilisateur
 */
async function apiRegister(userData) {
    // Validation côté client
    if (!userData.email || !userData.password || !userData.nom || !userData.prenom) {
        throw new Error('Email, mot de passe, nom et prénom sont obligatoires');
    }

    if (userData.password !== userData.confirm_password) {
        throw new Error('Les mots de passe ne correspondent pas');
    }

    if (!isValidEmail(userData.email)) {
        throw new Error('Email invalide');
    }

    const response = await apiCall('/auth/register', 'POST', {
        nom: userData.nom.trim(),
        prenom: userData.prenom.trim(),
        sexe: userData.sexe || 'Non spécifié',
        poste: userData.poste?.trim() || '',
        email: userData.email.trim(),
        password: userData.password,
        confirm_password: userData.confirm_password
    });

    return response;
}

/**
 * Connexion - Authentifie un utilisateur
 */
async function apiLogin(email, password) {
    if (!email || !password) {
        throw new Error('Email et mot de passe requis');
    }

    const response = await apiCall('/auth/login', 'POST', {
        email: email.trim(),
        password: password
    });

    if (response.success && response.user) {
        // Stocker l'utilisateur dans localStorage
        localStorage.setItem('user', JSON.stringify(response.user));
        localStorage.setItem('authenticated', 'true');
    }

    return response;
}

/**
 * Changement de mot de passe
 */
async function apiChangePassword(oldPasswordOrPayload, newPassword = null, confirmPassword = null) {
    let payload;

    if (typeof oldPasswordOrPayload === 'string') {
        payload = {
            old_password: oldPasswordOrPayload,
            new_password: newPassword,
            confirm_password: confirmPassword ?? newPassword
        };
    } else {
        payload = oldPasswordOrPayload;
    }

    return await apiCall('/auth/change-password', 'POST', payload);
}

async function apiUpdatePassword(userData) {
    return await apiChangePassword(userData);
}

/**
 * Déconnexion
 */
async function apiLogout() {
    try {
        await apiCall('/auth/logout', 'POST');
    } finally {
        localStorage.removeItem('user');
        localStorage.removeItem('authenticated');
    }
}

/**
 * Récupère les infos de l'utilisateur actuel
 */
async function apiGetCurrentUser() {
    const response = await apiCall('/auth/me', 'GET');
    return response.user;
}

// ========================================
// TACHES ENDPOINTS
// ========================================

/**
 * Crée une nouvelle tâche
 */
async function apiCreateTask(taskData) {
    const response = await apiCall('/taches/create', 'POST', taskData);
    return response;
}

/**
 * Liste les tâches de l'utilisateur
 */
async function apiListTasks() {
    let user = getCurrentUserFromStorage();

    if (!user || !user.id) {
        try {
            user = await apiGetCurrentUser();
            if (user && user.id) {
                localStorage.setItem('user', JSON.stringify(user));
            }
        } catch (error) {
            return [];
        }
    }

    if (!user || !user.id) {
        return [];
    }

    // Sécurise la récupération des tâches même si la session PHP bug
    const response = await apiCall(`/taches/list?user_id=${user.id}`, 'GET');

    return response.taches || [];
}

/**
 * Récupère une tâche par ID
 */
async function apiGetTask(taskId) {
    const response = await apiCall(`/taches/${taskId}`, 'GET');
    return response.tache;
}

/**
 * Modifie le statut d'une tâche
 */
async function apiUpdateTaskStatus(taskId, status) {
    const response = await apiCall(`/taches/${taskId}/status`, 'PUT', {
        status: status
    });
    return response;
}

async function apiUpdateProfile(userData) {
    return await apiCall('/auth/update-profile', 'POST', userData);
}

/**
 * Assigne une tâche à un utilisateur
 */
async function apiAssignTask(taskId, userId) {
    const response = await apiCall(`/taches/${taskId}/assign`, 'PUT', {
        id_responsable: userId
    });
    return response;
}

/**
 * Met à jour les détails d'une tâche
 */
async function apiListUsers() {
    const response = await apiCall('/users', 'GET');
    return response.users || [];
}

/**
 * Supprime une tâche
 */
async function apiDeleteTask(taskId) {
    const response = await apiCall(`/taches/${taskId}`, 'DELETE');
    return response;
}

// ========================================
// NOTIFICATIONS ENDPOINTS
// ========================================

/**
 * Récupère les notifications non lues
 */
async function apiGetNotifications() {
    try {
        const response = await apiCall('/notifications', 'GET');
        return response.notifications || [];
    } catch (error) {
        console.warn('Notifications non disponibles:', error);
        return [];
    }
}

// ========================================
// ADMIN ENDPOINTS
// ========================================

/**
 * Crée un utilisateur (SuperAdmin seulement)
 */
async function apiCreateUser(userData) {
    const response = await apiCall('/admin/users/create', 'POST', userData);
    return response;
}

/**
 * Liste tous les utilisateurs (Administrateur et SuperAdmin)
 */
async function apiListUsers() {
    const response = await apiCall('/users', 'GET');
    return response.users || [];
}
/**
 * Récupère les statistiques du dashboard pour Admin / SuperAdmin
 */
async function apiGetDashboard() {
    const response = await apiCall('/dashboard', 'GET');
    return response.dashboard;
}

// ========================================
// UTILITAIRES
// ========================================

/**
 * Valide un email
 */
function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

/**
 * Récupère l'utilisateur du localStorage
 */
function getCurrentUserFromStorage() {
    const userJson = localStorage.getItem('user');
    if (!userJson) return null;
    try {
        return JSON.parse(userJson);
    } catch {
        return null;
    }
}

/**
 * Vérifie si l'utilisateur est authentifié
 */
function isAuthenticated() {
    return localStorage.getItem('authenticated') === 'true' && getCurrentUserFromStorage() !== null;
}

/**
 * Redirige vers le login si non authentifié
 */
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
    }
}

function openLogoutModal() {
    const logoutModal = document.getElementById('logoutModal');
    logoutModal?.classList.add('show');
}

function closeLogoutModal() {
    const logoutModal = document.getElementById('logoutModal');
    logoutModal?.classList.remove('show');
}

function bindLogoutModal() {
    const logoutModal = document.getElementById('logoutModal');
    const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
    const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');

    if (!logoutModal || !cancelLogoutBtn || !confirmLogoutBtn) {
        return;
    }

    cancelLogoutBtn.addEventListener('click', () => closeLogoutModal());
    confirmLogoutBtn.addEventListener('click', async () => {
        try {
            await apiLogout();
        } finally {
            window.location.href = 'login.html';
        }
    });

    logoutModal.addEventListener('click', (event) => {
        if (event.target === logoutModal) {
            closeLogoutModal();
        }
    });
}

window.addEventListener('DOMContentLoaded', bindLogoutModal);

