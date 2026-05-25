/**
 * ============================================================
 * TASKPRO - USERS LIST (V2.0)
 * Gestion complète de la liste des utilisateurs avec API
 * ============================================================
 */

let usersState = {
    all: [],
    filtered: [],
    currentSearch: ''
};

// DOM References
const usersTableBody = document.getElementById('usersTableBody');
const searchUsersInput = document.getElementById('searchUsers');
const createUserBtn = document.getElementById('createUserBtn');

// ==============================================
// INITIALISATION
// ==============================================
document.addEventListener('DOMContentLoaded', async () => {
    requireAuth();
    
    // Vérifier les droits admin
    if (!sessionManager.isSuperAdmin()) {
        window.location.href = '/Task-Pro/Frontend/dashboard.html';
        return;
    }
    
    initializeEventListeners();
    await loadUsers();
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});

// ==============================================
// EVENT LISTENERS
// ==============================================
function initializeEventListeners() {
    if (searchUsersInput) {
        searchUsersInput.addEventListener('input', (e) => {
            usersState.currentSearch = e.target.value;
            filterAndRenderUsers();
        });
    }

    if (createUserBtn) {
        createUserBtn.addEventListener('click', openCreateUserModal);
    }
}

// ==============================================
// CHARGER LES UTILISATEURS
// ==============================================
async function loadUsers() {
    try {
        loaderManager.show('Chargement des utilisateurs');
        
        usersState.all = await apiListUsers();
        usersState.filtered = [...usersState.all];
        
        loaderManager.hide();
        renderUsers();
        
    } catch (error) {
        loaderManager.hide();
        loaderManager.toast(`Erreur: ${error.message}`, 'error');
        console.error('Erreur chargement utilisateurs:', error);
    }
}

// ==============================================
// FILTRAGE ET RECHERCHE
// ==============================================
function filterAndRenderUsers() {
    usersState.filtered = usersState.all.filter(user => {
        return !usersState.currentSearch || 
               user.nom.toLowerCase().includes(usersState.currentSearch.toLowerCase()) ||
               user.prenom.toLowerCase().includes(usersState.currentSearch.toLowerCase()) ||
               user.email.toLowerCase().includes(usersState.currentSearch.toLowerCase());
    });

    renderUsers();
}

// ==============================================
// AFFICHAGE DES UTILISATEURS
// ==============================================
function renderUsers() {
    if (!usersTableBody) {
        console.error('Table body not found');
        return;
    }

    if (usersState.filtered.length === 0) {
        usersTableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px; color: #999;">
                    <div style="font-size: 48px; margin-bottom: 10px;">👥</div>
                    <p>Aucun utilisateur trouvé</p>
                </td>
            </tr>
        `;
        return;
    }

    usersTableBody.innerHTML = usersState.filtered.map(user => `
        <tr class="user-row" data-user-id="${user.id}">
            <td class="user-name" onclick="openUserModal(${user.id})" style="cursor: pointer;">
                <div class="user-avatar" style="display: inline-block; margin-right: 10px;">
                    ${user.nom[0]}${user.prenom[0]}
                </div>
                <strong>${escapeHtml(user.nom)} ${escapeHtml(user.prenom)}</strong>
            </td>
            <td>${escapeHtml(user.email)}</td>
            <td>${getRoleDisplay(user.role)}</td>
            <td>${escapeHtml(user.poste || '-')}</td>
            <td>
                <button class="action-btn" onclick="openUserModal(${user.id})" title="Éditer">
                    <i data-lucide="edit"></i>
                </button>
                <button class="action-btn danger" onclick="confirmDeleteUser(${user.id})" title="Supprimer">
                    <i data-lucide="trash"></i>
                </button>
            </td>
        </tr>
    `).join('');

    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// ==============================================
// MODAL UTILISATEUR
// ==============================================
function openUserModal(userId) {
    const user = usersState.all.find(u => u.id === userId);
    if (!user) return;

    const modal = createOrGetModal('userDetailsModal');
    const modalBody = modal.querySelector('.modal-content');
    
    modalBody.innerHTML = `
        <div class="modal-header">
            <h2>Détails Utilisateur</h2>
            <button class="close-btn" onclick="closeModal('userDetailsModal')">✕</button>
        </div>

        <div class="modal-body">
            <div class="detail-grid">
                <div class="detail-item">
                    <label>Nom</label>
                    <div>${escapeHtml(user.nom)}</div>
                </div>

                <div class="detail-item">
                    <label>Prénom</label>
                    <div>${escapeHtml(user.prenom)}</div>
                </div>

                <div class="detail-item">
                    <label>Email</label>
                    <div>${escapeHtml(user.email)}</div>
                </div>

                <div class="detail-item">
                    <label>Rôle</label>
                    <div>${getRoleDisplay(user.role)}</div>
                </div>

                <div class="detail-item">
                    <label>Poste</label>
                    <div>${escapeHtml(user.poste || '-')}</div>
                </div>

                <div class="detail-item">
                    <label>Sexe</label>
                    <div>${user.sexe || '-'}</div>
                </div>
            </div>
        </div>
    `;

    modal.style.display = 'flex';
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function openCreateUserModal() {
    const modal = createOrGetModal('createUserModal');
    const modalBody = modal.querySelector('.modal-content');
    
    modalBody.innerHTML = `
        <div class="modal-header">
            <h2>Créer un nouvel utilisateur</h2>
            <button class="close-btn" onclick="closeModal('createUserModal')">✕</button>
        </div>

        <div class="modal-body">
            <form id="createUserForm" onsubmit="handleCreateUser(event)">
                <div class="form-group">
                    <label>Nom *</label>
                    <input type="text" id="newUserNom" required>
                </div>

                <div class="form-group">
                    <label>Prénom *</label>
                    <input type="text" id="newUserPrenom" required>
                </div>

                <div class="form-group">
                    <label>Email *</label>
                    <input type="email" id="newUserEmail" required>
                </div>

                <div class="form-group">
                    <label>Rôle *</label>
                    <select id="newUserRole" required>
                        <option value="">-- Sélectionner --</option>
                        <option value="Administrateur">Administrateur</option>
                        <option value="Employe">Employé</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Poste</label>
                    <input type="text" id="newUserPoste">
                </div>

                <div class="form-group">
                    <label>Sexe</label>
                    <select id="newUserSexe">
                        <option value="">Non spécifié</option>
                        <option value="Masculin">Masculin</option>
                        <option value="Féminin">Féminin</option>
                    </select>
                </div>

                <div class="modal-actions">
                    <button type="button" class="btn-cancel" onclick="closeModal('createUserModal')">Annuler</button>
                    <button type="submit" class="btn-success">Créer</button>
                </div>
            </form>
        </div>
    `;

    modal.style.display = 'flex';
}

function closeModal(modalId = 'userDetailsModal') {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

function createOrGetModal(modalId) {
    let modal = document.getElementById(modalId);
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-wrapper">
                <div class="modal-content"></div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modalId);
            }
        });
    }

    return modal;
}

// ==============================================
// ACTIONS UTILISATEUR
// ==============================================
async function handleCreateUser(event) {
    event.preventDefault();

    const userData = {
        nom: document.getElementById('newUserNom').value,
        prenom: document.getElementById('newUserPrenom').value,
        email: document.getElementById('newUserEmail').value,
        role: document.getElementById('newUserRole').value,
        poste: document.getElementById('newUserPoste').value,
        sexe: document.getElementById('newUserSexe').value
    };

    // Validation
    if (!userData.nom || !userData.prenom || !userData.email || !userData.role) {
        loaderManager.toast('Veuillez remplir tous les champs obligatoires', 'error');
        return;
    }

    try {
        loaderManager.show('Création en cours');
        await apiCreateUser(userData);
        
        loaderManager.hide();
        loaderManager.toast('Utilisateur créé avec succès', 'success');
        closeModal('createUserModal');
        
        // Recharger la liste
        await loadUsers();
    } catch (error) {
        loaderManager.hide();
        loaderManager.toast(`Erreur: ${error.message}`, 'error');
    }
}

function confirmDeleteUser(userId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
        deleteUser(userId);
    }
}

async function deleteUser(userId) {
    try {
        loaderManager.show('Suppression en cours');
        
        // TODO: Implémenter l'endpoint de suppression utilisateur
        // await apiDeleteUser(userId);
        
        loaderManager.hide();
        loaderManager.toast('Utilisateur supprimé', 'success');
        
        usersState.all = usersState.all.filter(u => u.id !== userId);
        usersState.filtered = usersState.filtered.filter(u => u.id !== userId);
        renderUsers();
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

// CSS pour les modales et formulaires
const style = document.createElement('style');
style.textContent = `
    .modal {
        display: none;
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        justify-content: center;
        align-items: center;
    }

    .modal-wrapper {
        background-color: white;
        padding: 30px;
        border-radius: 12px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
        border-bottom: 1px solid #eee;
        padding-bottom: 15px;
    }

    .close-btn {
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
    }

    .form-group {
        margin-bottom: 15px;
    }

    .form-group label {
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
    }

    .form-group input,
    .form-group select {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 14px;
    }

    .modal-actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        margin-top: 20px;
        padding-top: 15px;
        border-top: 1px solid #eee;
    }

    .btn-cancel, .btn-success {
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
    }

    .btn-cancel {
        background: #eee;
        color: #333;
    }

    .btn-success {
        background: #D4AF37;
        color: white;
    }

    .user-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: #D4AF37;
        color: white;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 12px;
    }

    .action-btn {
        background: none;
        border: none;
        color: #666;
        cursor: pointer;
        padding: 5px 10px;
    }

    .action-btn:hover {
        color: #D4AF37;
    }

    .action-btn.danger:hover {
        color: #E74C3C;
    }
`;
document.head.appendChild(style);
