/**
 * ============================================================
 * TASKPRO - AUTH HELPER
 * Vérification d'authentification et redirection
 * ============================================================
 */

/**
 * Vérifier l'authentification et rediriger si nécessaire
 */
function frontendUrl(page) {
    const appBasePath = window.location.pathname.includes('/Frontend/')
        ? window.location.pathname.split('/Frontend/')[0]
        : '';
    return `${appBasePath}/Frontend/${page}`;
}

function requireAuth() {
    if (!sessionManager.isAuthenticated()) {
        window.location.href = frontendUrl('login.html');
        return false;
    }
    return true;
}

function notifyAuthError(message) {
    if (window.loaderManager?.toast) {
        loaderManager.toast(message, 'error', 3000);
        return;
    }
    alert(message);
}

/**
 * Vérifier le rôle requis
 */
function requireRole(role) {
    if (!sessionManager.hasRole(role)) {
        notifyAuthError('Accès refusé: vous n\'avez pas la permission d\'accéder à cette ressource');
        window.location.href = frontendUrl('dashboard.html');
        return false;
    }
    return true;
}

/**
 * Vérifier accès SuperAdmin
 */
function requireSuperAdmin() {
    return requireRole('SuperAdmin');
}

/**
 * Vérifier accès Admin
 */
function requireAdmin() {
    if (!sessionManager.isAdmin() && !sessionManager.isSuperAdmin()) {
        notifyAuthError('Accès refusé: droits administrateur requis');
        window.location.href = frontendUrl('dashboard.html');
        return false;
    }
    return true;
}

/**
 * Utilitaires de formatage
 */
function getRoleDisplay(role) {
    const roles = {
        'SuperAdmin': 'Super Administrateur',
        'Administrateur': 'Administrateur',
        'Employe': 'Employé'
    };
    return roles[role] || role;
}

function getStatusDisplay(status) {
    const statuses = {
        'en attente': { text: 'En attente', color: '#FFA500' },
        'en cours': { text: 'En cours', color: '#5DADE2' },
        'completee': { text: 'Complétée', color: '#52C41A' },
        'bloquer': { text: 'Bloquée', color: '#F5222D' },
        'en_attente': { text: 'En attente', color: '#FFA500' },
        'en_cours': { text: 'En cours', color: '#5DADE2' },
        'complete': { text: 'Complétée', color: '#52C41A' },
        'bloquee': { text: 'Bloquée', color: '#F5222D' }
    };
    return statuses[status] || { text: status, color: '#999' };
}

function getPriorityDisplay(priority) {
    const priorities = {
        'basse': 'Basse',
        'moyenne': 'Moyenne',
        'haute': 'Haute',
        'critique': 'Critique'
    };
    return priorities[priority] || priority;
}

/**
 * Utilitaires de dates
 */
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Calcul temps restant
 */
function getTimeRemaining(deadline) {
    if (!deadline) return '-';
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate - now;

    if (diff < 0) return 'Dépassé';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}j ${hours}h`;
    return `${hours}h`;
}

/**
 * Validation email
 */
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Validation mot de passe
 */
function validatePassword(password) {
    // Min 8 caractères, au moins 1 majuscule et 1 chiffre
    const regex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    return regex.test(password);
}

/**
 * Génération couleur avatar
 */
function getAvatarColor(text) {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
        hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

/**
 * Abréviations initiales
 */
function getInitials(firstName, lastName) {
    const f = (firstName || '').charAt(0).toUpperCase();
    const l = (lastName || '').charAt(0).toUpperCase();
    return (f + l) || '?';
}
