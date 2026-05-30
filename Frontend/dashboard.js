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


// ─── NOTIFICATIONS ───────────────────────────────────────────────

let notifPanelOpen = false;
let notifSortOrder = 'DESC';
let pendingDeleteId = null;
let allNotifications = [];

async function fetchNotifications() {
    try {
        const res = await fetch(
            `../public/api.php/notifications?ordre=${notifSortOrder}`,
            { credentials: 'include' }
        );
        const data = await res.json();
        if (!data.success) return;
        allNotifications = data.notifications || [];
        renderNotifBadge(data.unread_count || 0);
        if (notifPanelOpen) renderNotifList();
    } catch (e) {
        console.error('Erreur chargement notifications', e);
    }
}

function renderNotifBadge(count) {
    const badge = document.getElementById('notifCount');
    if (!badge) return;
    if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }
}

function stripHtml(html) {
    // Extrait les données clés du HTML de notification Task-Pro
    const tmp = document.createElement('div');
    tmp.innerHTML = html;

    // Essaye d'extraire le libellé et le statut depuis le tableau HTML
    const rows = tmp.querySelectorAll('tr');
    let libelle = '', statut = '', responsable = '';

    rows.forEach(row => {
        const th = row.querySelector('th');
        const td = row.querySelector('td');
        if (!th || !td) return;
        const label = th.textContent.trim().toLowerCase();
        const value = td.textContent.trim();
        if (label === 'libellé') libelle = value;
        if (label === 'statut') statut = value.trim();
        if (label === 'responsable') responsable = value;
    });

    if (libelle) {
        let msg = `Tâche "${libelle}"`;
        if (statut) msg += ` — ${statut}`;
        if (responsable) msg += ` · ${responsable}`;
        return msg;
    }

    // Fallback : texte brut sans balises
    return tmp.textContent.replace(/\s+/g, ' ').trim();
}

function renderNotifList() {
    const list = document.getElementById('notifList');
    if (!list) return;

    if (allNotifications.length === 0) {
        list.innerHTML = `<p class="notif-empty">Aucune notification</p>`;
        return;
    }

    const statusColors = {
        'terminé': { bg: 'rgba(58,110,17,0.25)', color: '#7ecf45' },
        'en cours': { bg: 'rgba(24,95,165,0.25)', color: '#5aadff' },
        'assigné': { bg: 'rgba(83,74,183,0.25)', color: '#b3acff' },
        'expiré': { bg: 'rgba(163,45,45,0.25)', color: '#ff6b6b' },
        'non assigné': { bg: 'rgba(80,80,80,0.25)', color: '#aaaaaa' },
        'non terminé': { bg: 'rgba(133,79,11,0.25)', color: '#ffb347' },
    };

    list.innerHTML = allNotifications.map(n => {
        const unread = !parseInt(n.is_read);
        const parsed = parseNotifMessage(n.message);
        const sc = statusColors[parsed.statut] || statusColors['non assigné'];
        const date = new Date(n.created_at).toLocaleString('fr-FR', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
        });

        // Badge tâche — cliquable si on a un libellé
        const taskBadge = parsed.libelle
            ? `<span class="notif-task-badge"
                    style="background:${sc.bg}; color:${sc.color};">
                    ${escHtml(parsed.libelle)}
               </span>`
            : '';

        // La ligne entière est cliquable si on a un id_tache ou un libellé
        const isClickable = n.id_tache || parsed.libelle;

        return `
        <div class="notif-item ${unread ? 'unread' : ''} ${isClickable ? 'notif-item-clickable' : ''}"
             data-notif-id="${n.id}"
             data-task-id="${n.id_tache || ''}"
             data-task-libelle="${escHtml(parsed.libelle || '')}"
             onmouseenter="${unread ? `markOneRead(${n.id})` : ''}">
            <div class="notif-dot ${unread ? 'unread' : ''}"></div>
            <div class="notif-item-body">
                <p class="notif-item-msg">${escHtml(parsed.resume)}</p>
                <div class="notif-item-meta">
                    ${taskBadge}
                    <span class="notif-item-date">${date}</span>
                </div>
            </div>
            <button class="notif-delete-btn"
                    onclick="event.stopPropagation(); askDeleteNotif(${n.id})"
                    title="Supprimer">✕</button>
        </div>`;
    }).join('');

    // Attacher les clics sur les lignes après rendu
    list.querySelectorAll('.notif-item-clickable').forEach(item => {
        item.addEventListener('click', () => {
            const taskId = item.dataset.taskId;
            const libelle = item.dataset.taskLibelle;
            goToTask(taskId ? parseInt(taskId) : null, libelle);
        });
    });
}
function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function parseNotifMessage(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;

    const rows = tmp.querySelectorAll('tr');
    let libelle = '', statut = '', responsable = '';

    rows.forEach(row => {
        const th = row.querySelector('th');
        const td = row.querySelector('td');
        if (!th || !td) return;
        const label = th.textContent.trim().toLowerCase();
        const value = td.textContent.trim();
        if (label === 'libellé') libelle = value;
        if (label === 'statut') statut = value.replace(/\s+/g, ' ').trim();
        if (label === 'responsable') responsable = value;
    });

    // Résumé lisible
    let resume = '';
    if (libelle) {
        resume = `Tâche "${libelle}"`;
        if (statut) resume += ` — ${statut}`;
        if (responsable) resume += ` · ${responsable}`;
    } else {
        // Fallback : texte brut nettoyé
        resume = tmp.textContent.replace(/\s+/g, ' ').trim().slice(0, 120);
    }

    return { libelle, statut, responsable, resume };
}

function toggleNotifPanel() {
    const panel = document.getElementById('notifPanel');
    const overlay = document.getElementById('notifOverlay');
    notifPanelOpen = !notifPanelOpen;
    panel.classList.toggle('open', notifPanelOpen);
    overlay.style.display = notifPanelOpen ? 'block' : 'none';
    if (notifPanelOpen) fetchNotifications();
}

function closeNotifPanel() {
    notifPanelOpen = false;
    const panel = document.getElementById('notifPanel');
    const overlay = document.getElementById('notifOverlay');
    if (panel) panel.classList.remove('open');
    if (overlay) overlay.style.display = 'none';
}

function changeNotifSort() {
    const sel = document.getElementById('notifSort');
    notifSortOrder = sel ? sel.value : 'DESC';
    fetchNotifications();
}

async function markOneRead(id) {
    try {
        await fetch(`../public/api.php/notifications/${id}/read`, {
            method: 'PATCH', credentials: 'include'
        });
        const notif = allNotifications.find(n => n.id == id);
        if (notif) notif.is_read = true;
        const unread = allNotifications.filter(n => !n.is_read).length;
        renderNotifBadge(unread);
        renderNotifList();
    } catch (e) { }
}

async function markAllRead() {
    try {
        await fetch('../public/api.php/notifications/read-all', {
            method: 'PATCH', credentials: 'include'
        });
        allNotifications.forEach(n => n.is_read = true);
        renderNotifBadge(0);
        renderNotifList();
    } catch (e) { }
}

function askDeleteNotif(id) {
    pendingDeleteId = id;
    const modal = document.getElementById('deleteNotifModal');
    if (modal) modal.classList.add('show');
    const btn = document.getElementById('confirmDeleteBtn');
    if (btn) btn.onclick = confirmDeleteNotif;
}

function closeDeleteConfirm() {
    pendingDeleteId = null;
    const modal = document.getElementById('deleteNotifModal');
    if (modal) modal.classList.remove('show');
}

function handleDeleteBackdrop(e) {
    if (e.target === document.getElementById('deleteNotifModal')) closeDeleteConfirm();
}

async function confirmDeleteNotif() {
    if (!pendingDeleteId) return;
    try {
        const res = await fetch(`../public/api.php/notifications/${pendingDeleteId}`, {
            method: 'DELETE', credentials: 'include'
        });
        const data = await res.json();
        if (data.success) {
            allNotifications = allNotifications.filter(n => n.id != pendingDeleteId);
            const unread = allNotifications.filter(n => !n.is_read).length;
            renderNotifBadge(unread);
            renderNotifList();
        }
    } catch (e) { }
    closeDeleteConfirm();
}

function goToTask(idTache, libelle = '') {
    closeNotifPanel();

    if (idTache) {
        // Cas normal : id_tache présent en BD
        window.location.href = `task-list.html?task=${idTache}`;
        return;
    }

    if (libelle) {
        // Fallback : pas d'id, on envoie le libellé comme filtre de recherche
        window.location.href = `task-list.html?search=${encodeURIComponent(libelle)}`;
        return;
    }

    // Aucune info : juste ouvrir la liste
    window.location.href = 'task-list.html';
}

// Rafraîchir le badge toutes les 60 secondes
setInterval(async () => {
    try {
        const res = await fetch('../public/api.php/notifications/unread-count', {
            credentials: 'include'
        });
        const data = await res.json();
        if (data.success) renderNotifBadge(data.unread_count);
    } catch (e) { }
}, 60000);

// Charger le badge au démarrage
document.addEventListener('DOMContentLoaded', () => {
    fetchNotifications();
});


function init() {
    if (window.location.pathname.includes('dashboard.html')) {
        loadDashboard();
    }
}

document.addEventListener("DOMContentLoaded", init);
