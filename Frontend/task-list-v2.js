/**
 * ============================================================
 * TASKPRO - TASK LIST (V2.0)
 * Gestion complète de la liste des tâches avec API intégrée
 * ============================================================
 */

// État global
let tasksState = {
    all: [],
    filtered: [],
    currentFilter: 'all',
    currentSearch: ''
};

// DOM References
const tableBody = document.getElementById('taskTableBody');
const modal = document.getElementById('taskDetailsModal');
const closeModalBtn = document.getElementById('closeTaskModal');
const searchInput = document.getElementById('searchTask');
const statusFilter = document.getElementById('filterStatus');
const typeFilter = document.getElementById('filterType');

// ==============================================
// INITIALISATION
// ==============================================
document.addEventListener('DOMContentLoaded', async () => {
    requireAuth();
    
    // Initialiser les event listeners
    initializeEventListeners();
    
    // Charger les tâches
    await loadTasks();
    
    // Initialiser Lucide Icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});

// ==============================================
// EVENT LISTENERS
// ==============================================
function initializeEventListeners() {
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            tasksState.currentSearch = e.target.value;
            filterAndRenderTasks();
        });
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', (e) => {
            tasksState.currentFilter = e.target.value;
            filterAndRenderTasks();
        });
    }

    // Fermer modal au clic dehors
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
}

// ==============================================
// CHARGER LES TÂCHES
// ==============================================
async function loadTasks() {
    try {
        loaderManager.show('Chargement des tâches');
        
        tasksState.all = await apiListTasks({ showLoader: false });
        tasksState.filtered = [...tasksState.all];
        
        loaderManager.hide();
        renderTasks();
        
    } catch (error) {
        loaderManager.hide();
        loaderManager.toast(`Erreur: ${error.message}`, 'error');
        console.error('Erreur chargement tâches:', error);
    }
}

// ==============================================
// FILTRAGE ET RECHERCHE
// ==============================================
function filterAndRenderTasks() {
    tasksState.filtered = tasksState.all.filter(task => {
        // Filtre par statut
        const statusMatch = tasksState.currentFilter === 'all' || 
                           task.status === tasksState.currentFilter;

        // Filtre par recherche
        const searchMatch = !tasksState.currentSearch || 
                           task.libelle.toLowerCase().includes(tasksState.currentSearch.toLowerCase()) ||
                           task.description.toLowerCase().includes(tasksState.currentSearch.toLowerCase());

        return statusMatch && searchMatch;
    });

    renderTasks();
}

// ==============================================
// AFFICHAGE DES TÂCHES
// ==============================================
function renderTasks() {
    if (!tableBody) return;

    if (tasksState.filtered.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: #999;">
                    <div style="font-size: 48px; margin-bottom: 10px;">📋</div>
                    <p>Aucune tâche trouvée</p>
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = tasksState.filtered.map(task => `
        <tr class="task-row" data-task-id="${task.id}">
            <td class="task-name" onclick="openTaskModal(${task.id})" style="cursor: pointer;">
                <strong>${escapeHtml(task.libelle)}</strong>
            </td>
            <td>
                <span class="status-badge" style="background-color: ${getStatusDisplay(task.status).color}">
                    ${getStatusDisplay(task.status).text}
                </span>
            </td>
            <td>${task.id_responsable ? `Assigné` : 'Non assigné'}</td>
            <td>${formatDate(task.dateCreation)}</td>
            <td>
                ${sessionManager.isSuperAdmin() || sessionManager.hasRole('Administrateur') ? `
                    <button class="action-btn" onclick="openTaskModal(${task.id})" title="Modifier">
                        <i data-lucide="edit"></i>
                    </button>
                    <button class="action-btn danger" onclick="confirmDeleteTask(${task.id})" title="Supprimer">
                        <i data-lucide="trash"></i>
                    </button>
                ` : `
                    <button class="action-btn" onclick="openTaskModal(${task.id})" title="Voir détails">
                        <i data-lucide="eye"></i>
                    </button>
                `}
            </td>
        </tr>
    `).join('');

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// ==============================================
// MODAL TÂCHE
// ==============================================
function openTaskModal(taskId) {
    const task = tasksState.all.find(t => t.id === taskId);
    if (!task) return;

    const isAdmin = sessionManager.isSuperAdmin() || sessionManager.hasRole('Administrateur');

    const statusDisplay = getStatusDisplay(task.status);
    const modal = document.getElementById('taskDetailsModal');
    
    if (!modal) {
        createTaskModal();
        return openTaskModal(taskId);
    }

    const modalBody = modal.querySelector('.modal-content');
    modalBody.innerHTML = `
        <div class="modal-header">
            <h2>${escapeHtml(task.libelle)}</h2>
            <button class="close-btn" onclick="closeModal()">✕</button>
        </div>

        <div class="modal-body">
            <div class="detail-section">
                <h4>Description</h4>
                <p>${escapeHtml(task.description || 'Pas de description')}</p>
            </div>

            <div class="detail-grid">
                <div class="detail-item">
                    <label>Statut</label>
                    <div style="color: ${statusDisplay.color}; font-weight: bold;">
                        ${statusDisplay.text}
                    </div>
                </div>

                <div class="detail-item">
                    <label>Créé le</label>
                    <div>${formatDateTime(task.dateCreation)}</div>
                </div>

                <div class="detail-item">
                    <label>Période</label>
                    <div>${task.periode_realisation || 'Non spécifiée'}</div>
                </div>

                <div class="detail-item">
                    <label>Assigné à</label>
                    <div>${task.id_responsable ? `User #${task.id_responsable}` : 'Non assigné'}</div>
                </div>
            </div>

            ${isAdmin ? `
                <div class="modal-actions">
                    <select id="statusSelect" onchange="changeTaskStatus(${taskId}, this.value)">
                        <option value="">-- Changer le statut --</option>
                        <option value="non assigné" ${task.status === 'non assigné' ? 'selected' : ''}>Non assigné</option>
                        <option value="assigné" ${task.status === 'assigné' ? 'selected' : ''}>Assigné</option>
                        <option value="en cours" ${task.status === 'en cours' ? 'selected' : ''}>En cours</option>
                        <option value="non terminé" ${task.status === 'non terminé' ? 'selected' : ''}>Non terminé</option>
                        <option value="terminé" ${task.status === 'terminé' ? 'selected' : ''}>Terminé</option>
                    </select>
                </div>
            ` : ''}
        </div>
    `;

    modal.style.display = 'flex';
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function closeModal() {
    const modal = document.getElementById('taskDetailsModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function createTaskModal() {
    if (document.getElementById('taskDetailsModal')) return;

    const modal = document.createElement('div');
    modal.id = 'taskDetailsModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-wrapper">
            <div class="modal-content"></div>
        </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

// ==============================================
// ACTIONS TÂCHE
// ==============================================
async function changeTaskStatus(taskId, newStatus) {
    if (!newStatus) return;

    try {
        loaderManager.show('Mise à jour en cours');
        await apiUpdateTaskStatus(taskId, newStatus);
        
        // Mettre à jour l'état local
        const task = tasksState.all.find(t => t.id === taskId);
        if (task) {
            task.status = newStatus;
            renderTasks();
        }
        
        loaderManager.hide();
        loaderManager.toast('Statut mis à jour', 'success');
        closeModal();
    } catch (error) {
        loaderManager.hide();
        loaderManager.toast(`Erreur: ${error.message}`, 'error');
    }
}

function confirmDeleteTask(taskId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
        deleteTask(taskId);
    }
}

async function deleteTask(taskId) {
    try {
        loaderManager.show('Suppression en cours');
        await apiDeleteTask(taskId);
        
        // Supprimer de l'état local
        tasksState.all = tasksState.all.filter(t => t.id !== taskId);
        tasksState.filtered = tasksState.filtered.filter(t => t.id !== taskId);
        
        loaderManager.hide();
        loaderManager.toast('Tâche supprimée', 'success');
        renderTasks();
    } catch (error) {
        loaderManager.hide();
        loaderManager.toast(`Erreur: ${error.message}`, 'error');
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

// Ajouter un bouton de rafraîchissement
function addRefreshButton() {
    const header = document.querySelector('.glass-panel.page-header-section');
    if (!header) return;

    const btn = document.createElement('button');
    btn.className = 'primary-btn';
    btn.innerHTML = '<i data-lucide="refresh-cw"></i> Rafraîchir';
    btn.onclick = loadTasks;
    header.appendChild(btn);
}

// Appeler après le chargement DOM
window.addEventListener('load', addRefreshButton);
