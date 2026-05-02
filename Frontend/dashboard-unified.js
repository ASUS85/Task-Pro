/**
 * ============================================================
 * TASKPRO - DASHBOARD UNIFIÉ (V3.0)
 * Gestion dynamique des dashboards avec restrictions par rôle
 * SuperAdmin/Admin : dashboard.html - Vue complète
 * Employe : dashbordUser.html - Vue restreinte
 * ============================================================
 */

let dashboardData = {
    stats: {},
    tasks: [],
    user: null
};

// ==============================================
// INITIALISATION
// ==============================================
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Charger l'utilisateur
        await loadUserData();
        
        // Vérifier l'authentification et les droits
        checkAuthAndRedirect();
        
        // Charger les données du dashboard
        await loadDashboardData();
        
        // Initialiser les event listeners
        initializeEventListeners();
        
        // Initialiser les icônes Lucide
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    } catch (error) {
        console.error('Erreur initialisation:', error);
        loaderManager.toast('Erreur lors du chargement du dashboard', 'error');
    }
});

// ==============================================
// CHARGER DONNÉES UTILISATEUR
// ==============================================
async function loadUserData() {
    try {
        const response = await fetch('/Task-Pro/public/api.php/auth/me', {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            // Rediriger vers login
            window.location.href = '/Task-Pro/Frontend/login.html';
            return;
        }

        const result = await response.json();
        dashboardData.user = result.user;
        
        // Stocker dans sessionStorage
        sessionStorage.setItem('user', JSON.stringify(result.user));
        
        return result.user;
    } catch (error) {
        console.error('Erreur chargement utilisateur:', error);
        window.location.href = '/Task-Pro/Frontend/login.html';
    }
}

// ==============================================
// VÉRIFIER AUTHENTIFICATION ET RÔLE
// ==============================================
function checkAuthAndRedirect() {
    const user = dashboardData.user;
    
    if (!user) {
        window.location.href = '/Task-Pro/Frontend/login.html';
        return;
    }

    // Déterminer la page actuelle
    const currentPage = window.location.pathname.split('/').pop();
    
    // Restrictions pour dashboard.html (Admin/SuperAdmin seulement)
    if (currentPage === 'dashboard.html') {
        if (user.role !== 'SuperAdmin' && user.role !== 'Administrateur') {
            window.location.href = '/Task-Pro/Frontend/dashbordUser.html';
        }
    }
    
    // Restrictions pour dashbordUser.html (Employe seulement - peut aussi voir Admin)
    if (currentPage === 'dashbordUser.html') {
        // Si superadmin/admin, rediriger vers dashboard complet
        if (user.role === 'SuperAdmin' || user.role === 'Administrateur') {
            window.location.href = '/Task-Pro/Frontend/dashboard.html';
        }
    }
}

// ==============================================
// CHARGER LES DONNÉES DU DASHBOARD
// ==============================================
async function loadDashboardData() {
    try {
        loaderManager.show('Chargement du dashboard');
        
        // Charger les stats et tâches récentes
        const [statsResponse, tasksResponse] = await Promise.all([
            fetch('/Task-Pro/public/api.php/dashboard/stats', {
                method: 'GET',
                credentials: 'include'
            }),
            fetch('/Task-Pro/public/api.php/dashboard/recent-tasks', {
                method: 'GET',
                credentials: 'include'
            })
        ]);

        if (!statsResponse.ok || !tasksResponse.ok) {
            throw new Error('Erreur lors du chargement des données');
        }

        const statsData = await statsResponse.json();
        const tasksData = await tasksResponse.json();

        dashboardData.stats = statsData.stats || {};
        dashboardData.tasks = tasksData.tasks || [];

        // Afficher les données
        renderDashboard();

        loaderManager.hide();
    } catch (error) {
        loaderManager.hide();
        loaderManager.toast(`Erreur: ${error.message}`, 'error');
        console.error('Erreur dashboard:', error);
    }
}

// ==============================================
// AFFICHAGE DU DASHBOARD
// ==============================================
function renderDashboard() {
    const user = dashboardData.user;
    const stats = dashboardData.stats;

    // Mettre à jour le nom d'utilisateur
    updateUserDisplay(user);

    // Mettre à jour les cartes de statistiques
    updateStatCards(stats);

    // Afficher les tâches récentes
    renderRecentTasks();

    // Afficher les éléments selon le rôle
    applyRoleBasedRestrictions(user);
}

// ==============================================
// MISE À JOUR AFFICHAGE UTILISATEUR
// ==============================================
function updateUserDisplay(user) {
    // Mettre à jour le nom d'utilisateur
    const userNameElements = document.querySelectorAll('#userName, #displayUserName');
    userNameElements.forEach(el => {
        if (el) el.textContent = `${user.nom} ${user.prenom}`;
    });

    // Mettre à jour l'avatar
    const avatarElements = document.querySelectorAll('.avatar');
    avatarElements.forEach(el => {
        if (el) el.textContent = (user.nom.charAt(0) + user.prenom.charAt(0)).toUpperCase();
    });

    // Mettre à jour le rôle/poste
    const roleElements = document.querySelectorAll('[data-user-role]');
    roleElements.forEach(el => {
        if (el) el.textContent = getRoleDisplay(user.role);
    });
}

// ==============================================
// MISE À JOUR CARTES STATISTIQUES
// ==============================================
function updateStatCards(stats) {
    const user = dashboardData.user;

    // Cartes disponibles pour tous les rôles
    const cardMappings = {
        'totalTaches': stats.totalTaches || 0,
        'tachesEnCours': stats.tachesEnCours || 0,
        'tachesTerminees': stats.tachesTerminees || 0,
        'inProgressTasks': stats.tachesEnCours || 0,
        'completedTasks': stats.tachesTerminees || 0,
    };

    // Cartes supplémentaires pour Admin/SuperAdmin
    if (user.role === 'SuperAdmin' || user.role === 'Administrateur') {
        cardMappings['tachesNonAssignees'] = stats.tachesNonAssignees || 0;
        cardMappings['nonAssignedTasks'] = stats.tachesNonAssignees || 0;
        cardMappings['tachesAssignees'] = stats.tachesAssignees || 0;
        cardMappings['pendingTasks'] = stats.tachesAssignees || 0;
        cardMappings['totalUtilisateurs'] = stats.totalUtilisateurs || 0;
        cardMappings['totalUsers'] = stats.totalUtilisateurs || 0;
    }

    // Mettre à jour les cartes
    Object.entries(cardMappings).forEach(([key, value]) => {
        const element = document.querySelector(`[data-stat="${key}"]`);
        if (element) {
            element.textContent = value;
        }
    });
}

// ==============================================
// AFFICHAGE TÂCHES RÉCENTES
// ==============================================
function renderRecentTasks() {
    const tasks = dashboardData.tasks || [];
    
    // Chercher le conteneur des tâches récentes
    const taskContainer = document.querySelector('[data-recent-tasks-container]') || 
                         document.querySelector('.recent-tasks-list') ||
                         document.querySelector('[id*="tasks"]');

    if (!taskContainer) {
        console.warn('Conteneur des tâches non trouvé');
        return;
    }

    if (tasks.length === 0) {
        taskContainer.innerHTML = '<p style="text-align: center; color: #999;">Aucune tâche</p>';
        return;
    }

    let html = '<table style="width: 100%; border-collapse: collapse;">';
    html += '<thead style="background: #f8f9fa;"><tr>';
    html += '<th style="padding: 12px; text-align: left; border-bottom: 1px solid #eee;">ID</th>';
    html += '<th style="padding: 12px; text-align: left; border-bottom: 1px solid #eee;">Description</th>';
    html += '<th style="padding: 12px; text-align: left; border-bottom: 1px solid #eee;">Statut</th>';
    html += '<th style="padding: 12px; text-align: left; border-bottom: 1px solid #eee;">Responsable</th>';
    html += '</tr></thead><tbody>';

    tasks.forEach(task => {
        const status = task.status || 'non assigné';
        const statusColor = getStatusColor(status);
        html += '<tr style="border-bottom: 1px solid #eee; hover: background #f5f5f5;">';
        html += `<td style="padding: 12px;">#${task.id || '-'}</td>`;
        html += `<td style="padding: 12px;">${task.libelle || '-'}</td>`;
        html += `<td style="padding: 12px;"><span style="background: ${statusColor}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${status}</span></td>`;
        html += `<td style="padding: 12px;">${task.responsable || '-'}</td>`;
        html += '</tr>';
    });

    html += '</tbody></table>';
    taskContainer.innerHTML = html;
}

// ==============================================
// RESTRICTIONS BASÉES SUR LE RÔLE
// ==============================================
function applyRoleBasedRestrictions(user) {
    // Masquer les éléments admin pour les employés
    if (user.role === 'Employe') {
        // Masquer l'onglet "Liste des utilisateurs" (si présent)
        const userListLink = document.querySelector('[href*="users-list"]');
        if (userListLink) {
            userListLink.parentElement.style.display = 'none';
        }

        // Masquer l'onglet "Créer une tâche" (si les employes ne doivent pas créer)
        // À adapter selon vos règles métier
    }

    // Masquer les stats supplémentaires pour les employés
    if (user.role === 'Employe') {
        document.querySelectorAll('[data-admin-only]').forEach(el => {
            el.style.display = 'none';
        });
    }

    // Afficher les sections complètes pour Admin/SuperAdmin
    if (user.role === 'SuperAdmin' || user.role === 'Administrateur') {
        document.querySelectorAll('[data-admin-only]').forEach(el => {
            el.style.display = 'block';
        });
    }
}

// ==============================================
// UTILITAIRES
// ==============================================
function getRoleDisplay(role) {
    const roleMap = {
        'SuperAdmin': 'Gestionnaire Principal',
        'Administrateur': 'Administrateur',
        'Employe': 'Membre de l\'équipe'
    };
    return roleMap[role] || role;
}

function getStatusColor(status) {
    const statusColors = {
        'en cours': '#f39c12',
        'terminé': '#27ae60',
        'assigné': '#3498db',
        'non assigné': '#95a5a6'
    };
    return statusColors[status] || '#95a5a6';
}

// ==============================================
// EVENT LISTENERS
// ==============================================
function initializeEventListeners() {
    // Bouton de déconnexion
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Navigation (si tabulation)
    document.querySelectorAll('[data-tab]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tabName = link.dataset.tab;
            showSection(tabName);
        });
    });

    // Auto-refresh toutes les 5 minutes
    setInterval(loadDashboardData, 5 * 60 * 1000);
}

// ==============================================
// GESTION SECTIONS (pour dashboard utilisateur)
// ==============================================
function showSection(sectionId) {
    // Masquer toutes les sections
    document.querySelectorAll('[id$="-section"]').forEach(section => {
        section.style.display = 'none';
    });

    // Mettre à jour l'onglet actif
    document.querySelectorAll('[id^="nav-"]').forEach(nav => {
        nav.classList.remove('active');
    });

    // Afficher la section
    const section = document.getElementById(`${sectionId}-section`);
    if (section) {
        section.style.display = 'block';
    }

    // Activer l'onglet
    const navLink = document.getElementById(`nav-${sectionId}`);
    if (navLink) {
        navLink.classList.add('active');
    }
}

// ==============================================
// DÉCONNEXION
// ==============================================
async function handleLogout() {
    try {
        await fetch('/Task-Pro/public/api.php/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
        
        sessionStorage.removeItem('user');
        localStorage.removeItem('authenticated');
        window.location.href = '/Task-Pro/Frontend/login.html';
    } catch (error) {
        console.error('Erreur déconnexion:', error);
        window.location.href = '/Task-Pro/Frontend/login.html';
    }
}

// Fonction globale pour logout (compatibilité)
function logout() {
    handleLogout();
}

// ==============================================
// SESSION MANAGER (compatibilité avec ancien code)
// ==============================================
const sessionManager = {
    getUser: () => dashboardData.user || JSON.parse(sessionStorage.getItem('user') || '{}'),
    logout: handleLogout,
    isAuthenticated: () => !!dashboardData.user
};

// Fonction requireAuth (compatibilité)
function requireAuth() {
    if (!sessionManager.isAuthenticated()) {
        window.location.href = '/Task-Pro/Frontend/login.html';
    }
}

// ==============================================
// LOADER MANAGER (compatibilité - à adapter)
// ==============================================
const loaderManager = {
    show: (message) => {
        console.log('Loading:', message);
    },
    hide: () => {
        console.log('Loading complete');
    },
    showProgress: () => {
        console.log('Progress shown');
    },
    hideProgress: () => {
        console.log('Progress hidden');
    },
    toast: (message, type, duration) => {
        console.log(`Toast [${type}]:`, message);
    }
};
