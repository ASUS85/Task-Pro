// ===============================
// TASKPRO - PROFILE JS
// ===============================

let currentUser = null;
let adminRecords = [];
let tempAdminData = null;
let selectedAdmin = null;

const adminSection = document.getElementById('adminSection');
const adminListEl = document.getElementById('adminList');
const adminCountEl = document.getElementById('adminCount');
const createAdminForm = document.getElementById('createAdminForm');
const openCreateAdminModalBtn = document.getElementById('openCreateAdminModalBtn');
const createAdminModal = document.getElementById('createAdminModal');
const cancelCreateAdminBtn = document.getElementById('cancelCreateAdmin');
const createAdminPrenom = document.getElementById('createAdminPrenom');
const createAdminNom = document.getElementById('createAdminNom');
const createAdminEmail = document.getElementById('createAdminEmail');
const createAdminPoste = document.getElementById('createAdminPoste');
const createAdminSexe = document.getElementById('createAdminSexe');
const adminActionModal = document.getElementById('adminActionModal');
const closeAdminModalBtn = document.getElementById('closeAdminModal');
const editAdminBtn = document.getElementById('editAdminBtn');
const deleteAdminBtn = document.getElementById('deleteAdminBtn');
const adminDetails = document.getElementById('adminDetails');
const adminLoader = document.getElementById('adminLoader');
const createAdminSuccessModal = document.getElementById('createAdminSuccessModal');
const closeCreateAdminSuccessBtn = document.getElementById('closeCreateAdminSuccess');
const createdAdminName = document.getElementById('createdAdminName');
const createdAdminEmail = document.getElementById('createdAdminEmail');
const createdAdminPassword = document.getElementById('createdAdminPassword');
const toastContainer = document.getElementById('toastContainer');
const logoutModal = document.getElementById('logoutModal');
const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
const logoutSessionBtn = document.getElementById('logoutSessionBtn');
const disableAccountBtn = document.getElementById('disableAccountBtn');
const changePasswordBtn = document.getElementById('changePasswordBtn');

function normalizeRole(role) {
    return String(role || '').trim().toLowerCase().replace(/\s+/g, '_');
}

function formatRoleLabel(role) {
    const key = normalizeRole(role);
    if (key === 'superadmin' || key === 'super_admin') {
        return 'Super Administrateur';
    }
    if (key === 'administrateur' || key === 'admin') {
        return 'Administrateur';
    }
    if (key === 'employe' || key === 'employé' || key === 'employee' || key === 'user') {
        return 'Employé';
    }
    return role || '--//--';
}

function formatAvatar(name) {
    if (!name) {
        return '--';
    }
    return name
        .split(' ')
        .filter(Boolean)
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value ?? '--//--';
    }
}

function getStatusLabel(status) {
    if (!status) return 'Hors ligne';
    return status.toLowerCase() === 'online' ? 'En ligne' : 'Hors ligne';
}

function isSuperAdmin() {
    return ['superadmin', 'super_admin'].includes(normalizeRole(currentUser?.role));
}

function isAdmin() {
    return ['administrateur', 'admin'].includes(normalizeRole(currentUser?.role));
}

function isEmployee() {
    return ['employe', 'employé', 'employee', 'user'].includes(normalizeRole(currentUser?.role));
}

async function initProfilePage() {
    const storedUser = getCurrentUserFromStorage();
    if (!storedUser) {
        window.location.href = 'login.html';
        return;
    }

    currentUser = storedUser;

    setText('profileName', currentUser.nom || currentUser.name || currentUser.prenom || '--//--');
    setText('infoName', currentUser.nom || currentUser.name || currentUser.prenom || '--//--');
    setText('profileEmail', currentUser.email || '--//--');
    setText('infoEmail', currentUser.email || '--//--');

    const roleLabel = formatRoleLabel(currentUser.role || currentUser.poste || 'Utilisateur');
    setText('profileRole', roleLabel);
    setText('infoRole', roleLabel);

    const avatar = document.getElementById('profileAvatar');
    if (avatar) {
        avatar.textContent = formatAvatar(currentUser.nom || currentUser.name || currentUser.prenom || 'U');
    }

    const statusEl = document.getElementById('profileStatus');
    if (statusEl) {
        statusEl.textContent = getStatusLabel(currentUser.status);
        statusEl.classList.remove('online', 'offline');
        statusEl.classList.add(currentUser.status === 'online' ? 'online' : 'offline');
    }

    setText('infoLastLogin', currentUser.lastLogin || currentUser.dernierLogin || '--//--');

    if (isSuperAdmin()) {
        adminSection?.classList.remove('hidden');
        await loadAdminUsers();
    } else {
        adminSection?.classList.add('hidden');
    }

    await loadTaskStats();
}

async function loadTaskStats() {
    let tasks = [];
    try {
        tasks = await apiListTasks();
    } catch (error) {
        console.warn('Impossible de charger les tâches', error);
    }

    const userId = Number(currentUser.id || currentUser.user_id || 0);
    const totalCreated = tasks.filter(task => {
        if (isSuperAdmin()) {
            return true;
        }
        return Number(task.id_createur) === userId;
    }).length;

    const assigned = tasks.filter(task => Number(task.id_responsable) === userId).length;
    const done = tasks.filter(task => {
        const status = String(task.status || '').toLowerCase();
        return status === 'terminé' && (isSuperAdmin() || Number(task.id_createur) === userId || Number(task.id_responsable) === userId);
    }).length;

    let usersManaged = 0;
    if (isSuperAdmin()) {
        try {
            const users = await apiListUsers();
            usersManaged = users.length;
        } catch {
            usersManaged = totalCreated > 0 ? 1 : 0;
        }
    } else if (isAdmin()) {
        const responsables = new Set(
            tasks
                .filter(task => Number(task.id_createur) === userId)
                .map(task => Number(task.id_responsable))
                .filter(Boolean)
        );
        usersManaged = responsables.size;
    } else if (isEmployee()) {
        usersManaged = 1;
    }

    setText('tasksCreated', formatDisplayValue(totalCreated));
    setText('tasksAssigned', formatDisplayValue(assigned));
    setText('tasksDone', formatDisplayValue(done));
    setText('usersManaged', formatDisplayValue(usersManaged));
}

function formatDisplayValue(value) {
    return value === 0 ? '0' : value || '--//--';
}

function showToast(message, type = 'success') {
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('visible'));

    setTimeout(() => {
        toast.classList.remove('visible');
        toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, 3200);
}

async function loadAdminUsers() {
    try {
        const users = await apiListUsers();
        adminRecords = users.filter(user => {
            const roleKey = normalizeRole(user.role);
            return ['administrateur', 'admin', 'superadmin', 'super_admin'].includes(roleKey);
        });
        adminRecords.sort((a, b) => Number(b.id) - Number(a.id));
    } catch (error) {
        console.warn('Erreur chargement admins', error);
        adminRecords = [];
    }

    renderAdminList();
}

function renderAdminList() {
    if (!adminListEl) return;

    const visibleAdmins = adminRecords.slice(0, 2);
    adminListEl.innerHTML = '';
    adminCountEl.textContent = adminRecords.length === 1 ? '1 Administrateur' : `${adminRecords.length} Administrateurs`;

    if (visibleAdmins.length === 0) {
        adminListEl.innerHTML = `
            <div class="admin-row empty-state">
                <p>Aucun administrateur enregistré.</p>
            </div>
        `;
        return;
    }

    visibleAdmins.forEach(admin => {
        const row = document.createElement('div');
        row.className = 'admin-row';
        row.dataset.id = admin.id;
        row.innerHTML = `
            <div class="admin-left">
                <div class="admin-avatar">${formatAvatar(admin.nom || admin.name || admin.prenom || admin.email)}</div>
                <div>
                    <strong>${admin.nom || admin.name || admin.prenom || '--//--'}</strong>
                    <p>${admin.email || '--//--'}</p>
                </div>
            </div>
            <div class="admin-actions">
                <button class="icon-btn view-admin">Voir</button>
                <button class="icon-btn edit-admin">Modifier</button>
                <button class="icon-btn danger delete-admin">Supprimer</button>
            </div>
        `;
        adminListEl.appendChild(row);
    });
}

function openAdminActionModal(action, admin) {
    if (!adminActionModal) return;

    selectedAdmin = { action, admin };
    adminActionModal.classList.add('show');

    adminActionModal.querySelector('#modalTitle').textContent = action === 'view'
        ? 'Consulter administrateur'
        : action === 'edit'
            ? 'Modifier administrateur'
            : 'Supprimer administrateur';

    const actionEdit = editAdminBtn;
    const actionDelete = deleteAdminBtn;

    if (actionEdit) actionEdit.classList.toggle('hidden', action !== 'edit');
    if (actionDelete) actionDelete.classList.toggle('hidden', action !== 'delete');

    if (!adminDetails) return;

    if (action === 'view') {
        adminDetails.innerHTML = `
            <p><strong>Nom :</strong> ${admin.nom || admin.name || admin.prenom || '--//--'}</p>
            <p><strong>Email :</strong> ${admin.email || '--//--'}</p>
            <p><strong>Rôle :</strong> ${formatRoleLabel(admin.role)}</p>
        `;
    } else if (action === 'edit') {
        adminDetails.innerHTML = `
            <div class="form-fields">
                <input id="editAdminName" value="${admin.nom || admin.name || admin.prenom || ''}" />
                <input id="editAdminEmail" value="${admin.email || ''}" />
            </div>
        `;
    } else {
        adminDetails.innerHTML = `
            <p>Voulez-vous supprimer <strong>${admin.nom || admin.name || admin.prenom || '--//--'}</strong> ?</p>
            <p class="text-dim">Cette action est irréversible.</p>
        `;
    }
}

function closeAdminModal() {
    adminActionModal?.classList.remove('show');
    selectedAdmin = null;
}

function bindNavigation() {
    const links = document.querySelectorAll('.side-nav a');
    const currentPage = window.location.pathname.split('/').pop();
    links.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === currentPage);
    });
}

function bindProfileActions() {
    changePasswordBtn?.addEventListener('click', handleChangePassword);

    logoutSessionBtn?.addEventListener('click', openLogoutModal);
    disableAccountBtn?.addEventListener('click', () => {
        if (confirm('Voulez-vous vraiment désactiver ce compte ?')) {
            alert('Compte désactivé (simulation).');
        }
    });
}

async function handleChangePassword() {
    const newPassword = prompt('Nouveau mot de passe :');
    if (!newPassword) {
        return;
    }

    const confirmPassword = prompt('Confirmez le nouveau mot de passe :');
    if (newPassword !== confirmPassword) {
        showToast('Les mots de passe ne correspondent pas.', 'error');
        return;
    }

    try {
        await apiChangePassword(newPassword, confirmPassword);
        showToast('Mot de passe mis à jour avec succès.', 'success');
    } catch (error) {
        showToast(error.message || 'Erreur lors du changement de mot de passe.', 'error');
    }
}

function bindLogoutModal() {
    cancelLogoutBtn?.addEventListener('click', () => {
        logoutModal?.classList.remove('show');
    });

    confirmLogoutBtn?.addEventListener('click', async () => {
        try {
            await apiLogout();
        } catch (error) {
            console.warn('Erreur lors de la déconnexion', error);
        } finally {
            window.location.href = 'login.html';
        }
    });

    logoutModal?.addEventListener('click', (e) => {
        if (e.target === logoutModal) {
            logoutModal.classList.remove('show');
        }
    });
}

function openLogoutModal() {
    logoutModal?.classList.add('show');
}

function bindCreateAdminActions() {
    openCreateAdminModalBtn?.addEventListener('click', () => {
        createAdminModal?.classList.add('show');
    });

    cancelCreateAdminBtn?.addEventListener('click', () => {
        createAdminModal?.classList.remove('show');
        createAdminForm?.reset();
    });

    createAdminModal?.addEventListener('click', (event) => {
        if (event.target === createAdminModal) {
            createAdminModal.classList.remove('show');
            createAdminForm?.reset();
        }
    });

    createAdminForm?.addEventListener('submit', async (event) => {
        event.preventDefault();

        const prenom = createAdminPrenom?.value.trim();
        const nom = createAdminNom?.value.trim();
        const email = createAdminEmail?.value.trim();
        const poste = createAdminPoste?.value.trim();
        const sexe = createAdminSexe?.value.trim();
        const role = 'Administrateur';
        const password = '12345';

        if (!prenom || !nom || !email || !poste || !sexe) {
            showToast('Veuillez remplir tous les champs du formulaire.', 'error');
            return;
        }

        adminLoader?.classList.add('show');

        try {
            const response = await apiCreateUser({
                prenom,
                nom,
                email,
                poste,
                sexe,
                role,
                password,
            });

            if (response.success) {
                await loadAdminUsers();
                createAdminModal?.classList.remove('show');
                createAdminForm?.reset();

                if (createdAdminName) createdAdminName.textContent = `${prenom} ${nom}`;
                if (createdAdminEmail) createdAdminEmail.textContent = email;
                if (createdAdminPassword) createdAdminPassword.textContent = password;
                createAdminSuccessModal?.classList.add('show');
                showToast('Administrateur créé avec succès.', 'success');
            } else {
                showToast(response.message || 'Erreur lors de la création de l’administrateur.', 'error');
            }
        } catch (error) {
            showToast(error.message || 'Erreur lors de la création de l’administrateur.', 'error');
        } finally {
            adminLoader?.classList.remove('show');
        }
    });

    createAdminSuccessModal?.addEventListener('click', (event) => {
        if (event.target === createAdminSuccessModal) {
            createAdminSuccessModal.classList.remove('show');
        }
    });

    closeCreateAdminSuccessBtn?.addEventListener('click', () => {
        createAdminSuccessModal?.classList.remove('show');
    });
}

function bindAdminActionModal() {
    adminListEl?.addEventListener('click', (event) => {
        const button = event.target.closest('button');
        if (!button) return;

        const row = button.closest('.admin-row');
        if (!row) return;

        const adminId = Number(row.dataset.id);
        const admin = adminRecords.find(item => Number(item.id) === adminId);
        if (!admin) return;

        if (button.classList.contains('view-admin')) {
            openAdminActionModal('view', admin);
        }
        if (button.classList.contains('edit-admin')) {
            openAdminActionModal('edit', admin);
        }
        if (button.classList.contains('delete-admin')) {
            openAdminActionModal('delete', admin);
        }
    });

    closeAdminModalBtn?.addEventListener('click', closeAdminModal);
    adminActionModal?.addEventListener('click', (event) => {
        if (event.target === adminActionModal) {
            closeAdminModal();
        }
    });

    editAdminBtn?.addEventListener('click', () => {
        if (!selectedAdmin || selectedAdmin.action !== 'edit') return;

        const newName = document.getElementById('editAdminName')?.value.trim();
        const newEmail = document.getElementById('editAdminEmail')?.value.trim();
        if (!newName || !newEmail) {
            alert('Veuillez remplir le nom et l’email.');
            return;
        }

        selectedAdmin.admin.nom = newName;
        selectedAdmin.admin.email = newEmail;
        renderAdminList();
        closeAdminModal();
    });

    deleteAdminBtn?.addEventListener('click', () => {
        if (!selectedAdmin || selectedAdmin.action !== 'delete') return;

        if (!confirm('Voulez-vous vraiment supprimer cet administrateur ?')) {
            return;
        }

        adminRecords = adminRecords.filter(item => Number(item.id) !== Number(selectedAdmin.admin.id));
        renderAdminList();
        closeAdminModal();
    });
}

function init() {
    bindNavigation();
    bindProfileActions();
    bindLogoutModal();
    bindCreateAdminActions();
    bindAdminActionModal();
    initProfilePage();
}

document.addEventListener('DOMContentLoaded', init);
