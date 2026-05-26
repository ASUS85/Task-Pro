
const logoutSessionBtn = document.getElementById("logoutSessionBtn");

async function loadDashboard() {
    try {
        const data = await apiGetDashboard();
        renderDashboard(data);
    } catch (error) {
        console.error('Dashboard error:', error);
        const message = error.message || 'Impossible de charger le tableau de bord';
        if (message.includes('Non authentifié') || message.includes('Accès refusé')) {
            window.location.href = 'login.html';
            return;
        }
        notify('Impossible de charger le dashboard', 'red');
    }
}

function formatDynamicValue(value) {
    if (value === null || value === undefined || value === '') {
        return '--//--';
    }
    return value;
}

function renderDashboard(data) {
    const userNameEl = document.getElementById('userName');
    if (userNameEl) {
        userNameEl.innerHTML = `<span style="color: var(--primary)">${formatDynamicValue(data.user.nom)} ${formatDynamicValue(data.user.prenom)}</span>`;
    }

    const welcomeEl = document.getElementById('dashboardWelcome');
    if (welcomeEl) {
        welcomeEl.textContent = `Bienvenue ${formatDynamicValue(data.user.role === 'SuperAdmin' ? 'Super Admin' : 'Administrateur')}`;
    }

    const messageEl = document.getElementById('dashboardMessage');
    if (messageEl) {
        messageEl.textContent = data.overview.message || 'Utilisez le menu latéral pour gérer les tâches, utilisateurs, comptes administrateurs et votre profil.';
    }

    document.getElementById('totalTasks').textContent = formatDynamicValue(data.stats.totalTasks);
    document.getElementById('inProgressTasks').textContent = formatDynamicValue(data.stats.inProgressTasks);
    document.getElementById('doneTasks').textContent = formatDynamicValue(data.stats.doneTasks);
    document.getElementById('usersActive').textContent = formatDynamicValue(data.stats.usersActive);
    document.getElementById('progressPercent').textContent = `${formatDynamicValue(data.stats.completionPercent)}%`;
    document.getElementById('progressSummary').textContent = `${formatDynamicValue(data.stats.doneTasks)} / ${formatDynamicValue(data.stats.totalTasks)} tâches terminées`;
    document.getElementById('progressNote').textContent = data.overview.message || 'Performance de la période actuelle';

    const overviewList = document.getElementById('overviewList');
    if (overviewList && Array.isArray(data.overview.activity)) {
        overviewList.innerHTML = data.overview.activity.map(item => `<li>${formatDynamicValue(item)}</li>`).join('');
    }

    const defaultTeam = [
        { name: '--//--', progress: 0 },
        { name: '--//--', progress: 0 },
        { name: '--//--', progress: 0 }
    ];
    const performance = Array.isArray(data.teamPerformance) && data.teamPerformance.length > 0 ? data.teamPerformance : defaultTeam;

    performance.slice(0, 3).forEach((member, index) => {
        const nameEl = document.getElementById(`teamName${index + 1}`);
        const barEl = document.getElementById(`teamBar${index + 1}`);
        if (nameEl) {
            nameEl.textContent = formatDynamicValue(member.name);
        }
        if (barEl) {
            const width = Number.isFinite(member.progress) ? Math.min(Math.max(member.progress, 0), 100) : 0;
            barEl.style.width = `${width}%`;
        }
    });

}

function openLogoutModal() {
  logoutModal?.classList.add("show");
}

function bindProfileActions() {
  logoutSessionBtn?.addEventListener("click", openLogoutModal);
  
}

function init() {
  bindProfileActions();
}


document.addEventListener("DOMContentLoaded", init);