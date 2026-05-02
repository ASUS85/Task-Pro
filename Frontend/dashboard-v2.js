/**
 * ============================================================
 * TASKPRO - DASHBOARD (V2.0)
 * Vue d'ensemble avec statistiques et loaders
 * ============================================================
 */

let dashboardData = {
    stats: {},
    tasks: [],
    notifications: []
};

// ==============================================
// INITIALISATION
// ==============================================
document.addEventListener('DOMContentLoaded', async () => {
    requireAuth();
    
    // Charger les données du dashboard
    await loadDashboardData();
    
    // Initialiser les event listeners
    initializeEventListeners();
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});

// ==============================================
// CHARGER LES DONNÉES
// ==============================================
async function loadDashboardData() {
    try {
        loaderManager.show('Chargement du dashboard');
        
        // Charger les tâches et notifications en parallèle
        const [tasks, notifications] = await Promise.all([
            apiListTasks({ showLoader: false }).catch(e => []),
            apiGetNotifications().catch(e => [])
        ]);

        dashboardData.tasks = tasks;
        dashboardData.notifications = notifications;

        // Calculer les statistiques
        calculateStats();

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
// CALCULER STATISTIQUES
// ==============================================
function calculateStats() {
    const tasks = dashboardData.tasks;
    const user = sessionManager.getUser();

    // Filtrer les tâches selon le rôle
    let userTasks = tasks;
    if (user.role === 'Employe') {
        userTasks = tasks.filter(t => t.id_responsable === user.id);
    }

    dashboardData.stats = {
        totalTasks: userTasks.length,
        inProgressTasks: userTasks.filter(t => t.status === 'en cours').length,
        completedTasks: userTasks.filter(t => t.status === 'terminé').length,
        pendingTasks: userTasks.filter(t => ['non assigné', 'assigné'].includes(t.status)).length,
        unreadNotifications: dashboardData.notifications.filter(n => !n.is_read).length,
        totalUsers: tasks.length // À améliorer avec count réel
    };
}

// ==============================================
// AFFICHAGE DU DASHBOARD
// ==============================================
function renderDashboard() {
    const user = sessionManager.getUser();
    const stats = dashboardData.stats;

    // Mettre à jour les statistiques
    updateStatCard('totalTasks', stats.totalTasks);
    updateStatCard('inProgressTasks', stats.inProgressTasks);
    updateStatCard('completedTasks', stats.completedTasks);
    updateStatCard('pendingTasks', stats.pendingTasks);

    // Mettre à jour les tâches récentes
    renderRecentTasks();

    // Mettre à jour les notifications
    renderNotifications();

    // Mettre à jour le message de bienvenue
    const welcomeMsg = document.getElementById('welcomeMessage');
    if (welcomeMsg) {
        welcomeMsg.textContent = `Bienvenue, ${user.nom}! 👋`;
    }
}

// ==============================================
// METTRE À JOUR UNE CARTE STAT
// ==============================================
function updateStatCard(statId, value) {
    const element = document.querySelector(`[data-stat="${statId}"]`);
    if (element) {
        element.textContent = value;
    }
}

// ==============================================
// AFFICHER LES TÂCHES RÉCENTES
// ==============================================
function renderRecentTasks() {
    const recentTasksList = document.getElementById('recentTasksList');
    if (!recentTasksList) return;

    const recentTasks = dashboardData.tasks
        .sort((a, b) => new Date(b.dateCreation) - new Date(a.dateCreation))
        .slice(0, 5);

    if (recentTasks.length === 0) {
        recentTasksList.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #999;">
                <p>Aucune tâche récente</p>
            </div>
        `;
        return;
    }

    recentTasksList.innerHTML = recentTasks.map(task => `
        <div class="recent-task-item" onclick="goToTaskList()" style="cursor: pointer;">
            <div class="task-header">
                <strong>${escapeHtml(task.libelle)}</strong>
                <span class="status-badge" style="background-color: ${getStatusDisplay(task.status).color}">
                    ${getStatusDisplay(task.status).text}
                </span>
            </div>
            <small style="color: #999;">Créé le ${formatDate(task.dateCreation)}</small>
        </div>
    `).join('');
}

// ==============================================
// AFFICHER LES NOTIFICATIONS
// ==============================================
function renderNotifications() {
    const notificationsList = document.getElementById('notificationsList');
    if (!notificationsList) return;

    const recentNotifs = dashboardData.notifications.slice(0, 5);

    if (recentNotifs.length === 0) {
        notificationsList.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #999;">
                <p>Pas de notifications</p>
            </div>
        `;
        return;
    }

    notificationsList.innerHTML = recentNotifs.map(notif => `
        <div class="notification-item" style="${notif.is_read ? '' : 'border-left: 3px solid #D4AF37;'}">
            <div class="notif-content">
                <p>${escapeHtml(notif.message)}</p>
                <small style="color: #999;">${getTimeAgo(notif.created_at)}</small>
            </div>
        </div>
    `).join('');
}

// ==============================================
// EVENT LISTENERS
// ==============================================
function initializeEventListeners() {
    const refreshBtn = document.getElementById('refreshDashboard');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadDashboardData();
        });
    }
}

// ==============================================
// NAVIGATION
// ==============================================
function goToTaskList() {
    window.location.href = '/Task-Pro/Frontend/task-list.html';
}

function goToCreateTask() {
    window.location.href = '/Task-Pro/Frontend/create-task.html';
}

function goToUsersList() {
    if (sessionManager.isSuperAdmin()) {
        window.location.href = '/Task-Pro/Frontend/users-list.html';
    } else {
        loaderManager.toast('Accès refusé', 'error');
    }
}

// ==============================================
// UTILITAIRES
// ==============================================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// CSS pour le dashboard
const style = document.createElement('style');
style.textContent = `
    .stat-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 12px;
        padding: 20px;
        color: white;
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: transform 0.3s;
    }

    .stat-card:hover {
        transform: translateY(-5px);
    }

    .stat-card .stat-value {
        font-size: 28px;
        font-weight: bold;
    }

    .stat-card .stat-label {
        font-size: 12px;
        opacity: 0.9;
        margin-top: 5px;
    }

    .stat-card.blue {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .stat-card.orange {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }

    .stat-card.green {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    }

    .stat-card.purple {
        background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
    }

    .recent-task-item {
        padding: 15px;
        border-bottom: 1px solid #eee;
        transition: background 0.2s;
    }

    .recent-task-item:hover {
        background: #f8f8f8;
    }

    .task-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
    }

    .status-badge {
        padding: 4px 10px;
        border-radius: 20px;
        font-size: 11px;
        color: white;
    }

    .notification-item {
        padding: 12px;
        border-bottom: 1px solid #eee;
        border-left: 3px solid transparent;
        transition: all 0.2s;
    }

    .notification-item:hover {
        background: #f8f8f8;
    }

    .notif-content p {
        margin: 0;
        font-size: 13px;
        color: #333;
    }

    .quick-actions {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 10px;
    }

    .quick-action-btn {
        padding: 15px;
        border: 1px solid #ddd;
        border-radius: 8px;
        background: white;
        cursor: pointer;
        transition: all 0.2s;
        text-align: center;
    }

    .quick-action-btn:hover {
        border-color: #D4AF37;
        background: #fffef7;
        transform: translateY(-2px);
    }
`;
document.head.appendChild(style);

// Auto-refresh dashboard toutes les 30 secondes
setInterval(() => {
    if (!document.hidden) {
        loadDashboardData().catch(e => console.error('Auto-refresh failed:', e));
    }
}, 30000);
