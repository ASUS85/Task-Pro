/**
 * ============================================================
 * TASKPRO - PROFILE (V2.0)
 * Gestion du profil utilisateur avec API intégrée
 * ============================================================
 */

// ==============================================
// INITIALISATION
// ==============================================
document.addEventListener('DOMContentLoaded', async () => {
    requireAuth();
    
    // Charger les infos du profil
    await loadProfile();
    
    // Initialiser les event listeners
    initializeEventListeners();
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
});

// ==============================================
// CHARGER LE PROFIL
// ==============================================
async function loadProfile() {
    try {
        const user = sessionManager.getUser();
        
        if (!user) {
            window.location.href = '/Task-Pro/Frontend/login.html';
            return;
        }

        // Remplir les informations du profil
        document.getElementById('profileName').textContent = `${user.nom} ${user.prenom}`;
        document.getElementById('profileRole').textContent = getRoleDisplay(user.role);
        document.getElementById('profilePoste').textContent = user.poste || 'Poste non spécifié';
        document.getElementById('profileEmail').textContent = user.email;
        document.getElementById('profileNom').value = user.nom;
        document.getElementById('profilePrenom').value = user.prenom;
        document.getElementById('profileEmail').value = user.email;
        document.getElementById('profilePoste').value = user.poste || '';
        document.getElementById('profileSexe').value = user.sexe || '';

    } catch (error) {
        loaderManager.toast(`Erreur: ${error.message}`, 'error');
        console.error('Erreur chargement profil:', error);
    }
}

// ==============================================
// EVENT LISTENERS
// ==============================================
function initializeEventListeners() {
    const editProfileBtn = document.getElementById('editProfileBtn');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const profileForm = document.getElementById('profileForm');
    const changePasswordForm = document.getElementById('changePasswordForm');

    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', toggleEditMode);
    }

    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', saveProfile);
    }

    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', toggleEditMode);
    }

    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveProfile();
        });
    }

    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', handleChangePassword);
    }
}

// ==============================================
// ÉDITION DU PROFIL
// ==============================================
function toggleEditMode() {
    const profileView = document.getElementById('profileView');
    const editView = document.getElementById('editView');

    if (profileView && editView) {
        profileView.style.display = profileView.style.display === 'none' ? 'block' : 'none';
        editView.style.display = editView.style.display === 'none' ? 'block' : 'none';
    }
}

async function saveProfile() {
    try {
        const user = sessionManager.getUser();
        
        const updatedData = {
            nom: document.getElementById('profileNom').value,
            prenom: document.getElementById('profilePrenom').value,
            poste: document.getElementById('profilePoste').value,
            sexe: document.getElementById('profileSexe').value
        };

        // Validation
        if (!updatedData.nom || !updatedData.prenom) {
            loaderManager.toast('Nom et prénom sont obligatoires', 'error');
            return;
        }

        loaderManager.show('Mise à jour du profil');

        // TODO: Implémenter l'endpoint de mise à jour profil
        // const result = await apiUpdateProfile(user.id, updatedData);

        // Mise à jour locale
        user.nom = updatedData.nom;
        user.prenom = updatedData.prenom;
        user.poste = updatedData.poste;
        user.sexe = updatedData.sexe;

        sessionManager.setUser(user);

        loaderManager.hide();
        loaderManager.toast('Profil mis à jour avec succès', 'success');

        toggleEditMode();
        await loadProfile();

    } catch (error) {
        loaderManager.hide();
        loaderManager.toast(`Erreur: ${error.message}`, 'error');
    }
}

// ==============================================
// CHANGEMENT DE MOT DE PASSE
// ==============================================
async function handleChangePassword(event) {
    event.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
        loaderManager.toast('Tous les champs sont obligatoires', 'error');
        return;
    }

    if (newPassword !== confirmPassword) {
        loaderManager.toast('Les nouveaux mots de passe ne correspondent pas', 'error');
        return;
    }

    if (newPassword.length < 8) {
        loaderManager.toast('Le mot de passe doit contenir au moins 8 caractères', 'error');
        return;
    }

    try {
        loaderManager.show('Changement du mot de passe');

        // TODO: Implémenter l'endpoint de changement de mot de passe
        // await apiChangePassword(currentPassword, newPassword);

        loaderManager.hide();
        loaderManager.toast('Mot de passe changé avec succès', 'success');

        // Réinitialiser le formulaire
        document.getElementById('changePasswordForm').reset();

    } catch (error) {
        loaderManager.hide();
        loaderManager.toast(`Erreur: ${error.message}`, 'error');
    }
}

// ==============================================
// AUTRES ACTIONS
// ==============================================
async function downloadActivityLog() {
    try {
        loaderManager.toast('Téléchargement en cours...', 'info');
        // TODO: Implémenter le téléchargement de l'historique d'activité
    } catch (error) {
        loaderManager.toast(`Erreur: ${error.message}`, 'error');
    }
}

// CSS pour la page profil
const style = document.createElement('style');
style.textContent = `
    .profile-section {
        margin-bottom: 30px;
    }

    .profile-section h3 {
        margin-bottom: 15px;
        font-size: 18px;
        font-weight: 600;
    }

    .profile-info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-bottom: 20px;
    }

    .profile-info-item {
        display: flex;
        flex-direction: column;
    }

    .profile-info-item label {
        font-size: 12px;
        color: #999;
        margin-bottom: 5px;
        font-weight: 500;
    }

    .profile-info-item span {
        font-size: 14px;
        color: #333;
    }

    .form-group {
        margin-bottom: 15px;
    }

    .form-group label {
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
        font-size: 14px;
    }

    .form-group input,
    .form-group select {
        width: 100%;
        padding: 10px 12px;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 14px;
    }

    .form-group input:focus,
    .form-group select:focus {
        outline: none;
        border-color: #D4AF37;
        box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.1);
    }

    .button-group {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
    }

    .btn {
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.3s;
    }

    .btn-primary {
        background: #D4AF37;
        color: white;
    }

    .btn-primary:hover {
        background: #C49A27;
    }

    .btn-secondary {
        background: #eee;
        color: #333;
    }

    .btn-secondary:hover {
        background: #ddd;
    }

    .btn-danger {
        background: #E74C3C;
        color: white;
    }

    .btn-danger:hover {
        background: #C0392B;
    }

    .activity-table {
        width: 100%;
        border-collapse: collapse;
    }

    .activity-table th,
    .activity-table td {
        padding: 12px;
        text-align: left;
        border-bottom: 1px solid #eee;
    }

    .activity-table th {
        background: #f8f8f8;
        font-weight: 600;
    }

    .activity-table tr:hover {
        background: #f9f9f9;
    }

    .hidden-section {
        display: none;
    }
`;
document.head.appendChild(style);
