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

        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const result = await response.json();

        if (!response.ok && !result.success) {
            throw new Error(result.message || `Erreur HTTP ${response.status}`);
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
    const response = await apiCall('/taches/list', 'GET');
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
 * Liste tous les utilisateurs (SuperAdmin seulement)
 */
async function apiListUsers() {
    const response = await apiCall('/admin/users', 'GET');
    return response.users || [];
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

