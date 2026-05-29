// ===============================
// TASKPRO - USERS LIST JS (FINAL STABLE CORRIGÉ)
// ===============================

let users = [];
let allUsers = [];
let currentUserPage = 1;
const usersPerPage = 10;
let currentFilteredUsers = [];

let userToEdit = null;
let userToDelete = null;

// DOM
const tableBody = document.getElementById("userTableBody");
const userPaginationControls = document.getElementById("userPaginationControls");
const searchUserInput = document.getElementById("searchUser");
const roleFilter = document.getElementById("filterRole");
const posteFilter = document.getElementById("filterPoste");
const availabilityFilter = document.getElementById("filterAvailability");

function showToast(message, type = 'info') {
    if (window.loaderManager?.toast) {
        loaderManager.toast(message, type, 3000);
        return;
    }
    alert(message);
}

// MODALS
const profileModal = document.getElementById("userModal");
const editModal = document.getElementById("editUserModal");
const deleteModal = document.getElementById("confirmDeleteModal");

// CLOSE BUTTONS
document.getElementById("closeUserModal").onclick = () => profileModal.style.display = "none";
document.getElementById("closeEditUserModal").onclick = () => editModal.style.display = "none";

// TRANSFORMER DONNÉES API → FRONTEND
function transformUserFromAPI(apiUser) {
    const roleMap = {
        "Administrateur": "admin",
        "Employe": "employe",
        "SuperAdmin": "super_admin"
    };

    const role = roleMap[apiUser.role] || "employe";

    return {
        id: apiUser.id,
        name: `${apiUser.prenom} ${apiUser.nom}`,
        email: apiUser.email,
        role: role,
        poste: apiUser.poste || 'Non spécifié',
        status: "online",
        availability: apiUser.disponibilite === 'non' ? 'busy' : 'free',
        tasks: Number(apiUser.total_taches) || 0,
        lastSeen: new Date().toLocaleString('fr-FR'),
        bio: apiUser.poste ? `${apiUser.poste}` : "Aucune bio disponible"
    };
}

// AVATAR
function getAvatar(name) {
    return name
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase();
}

// FORMATTERS
function formatRole(role) {
    switch (role) {
        case "admin": return "Admin";
        case "super_admin": return "Super Admin";
        case "employe": return "Employé";
        default: return role;
    }
}

function formatStatus(status) {
    return status === "online" ? "En ligne" : "Hors ligne";
}

function formatAvailability(av) {
    return av === "free" ? "Libre" : "Occupé";
}

// RENDER TABLE
function renderUsers(data) {
    tableBody.innerHTML = "";

    if (data.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 30px; color: #999;">
                    <p>Aucun utilisateur à afficher</p>
                </td>
            </tr>
        `;
        return;
    }

    const currentUser = getCurrentUserFromStorage();
    const isSuperAdmin = currentUser?.role === 'SuperAdmin';

    data.forEach(user => {
        const row = document.createElement("tr");
        row.setAttribute("data-id", user.id); // On stocke l'ID sur la ligne

        const canEdit = isSuperAdmin || user.role === 'employe';
        const canDelete = isSuperAdmin || user.role === 'employe';

        row.innerHTML = `
            <td>
                <div class="user-avatar">${getAvatar(user.name)}</div>
                ${user.name}
            </td>
            <td>${user.email}</td>
            <td>${formatRole(user.role)}</td>
            <td>${user.poste}</td>
            <td>
                <span class="badge ${user.availability}">
                    ${formatAvailability(user.availability)}
                </span>
            </td>
            <td>${user.tasks}</td>
            <td>${user.lastSeen}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-action view-btn" data-id="${user.id}">Voir</button>
                    ${canEdit ? `<button class="btn-action edit-btn" data-id="${user.id}">Modifier</button>` : ''}
                    ${canDelete ? `<button class="btn-action delete-btn" data-id="${user.id}">Supprimer</button>` : ''}
                </div>
            </td>
        `;

        tableBody.appendChild(row);
    });
}

// PROFILE MODAL
function openProfileModal(id) {
    const user = users.find(u => u.id === id);
    if (!user) return;

    document.getElementById("userName").textContent = user.name;
    document.getElementById("userEmail").textContent = user.email;
    document.getElementById("userRole").textContent = formatRole(user.role);
    document.getElementById("userStatus").textContent = formatStatus(user.status);
    document.getElementById("userAvailability").textContent = formatAvailability(user.availability);
    document.getElementById("userTasks").textContent = user.tasks;
    document.getElementById("userLastSeen").textContent = user.lastSeen;
    document.getElementById("userBio").textContent = user.bio;

    profileModal.style.display = "flex";
}

// EDIT MODAL
function openEditModal(id) {
    const user = users.find(u => u.id === id);
    if (!user) return;

    userToEdit = user;

    document.getElementById("editName").value = user.name;
    document.getElementById("editEmail").value = user.email;
    document.getElementById("editRole").value = user.role; // S'aligne parfaitement sur l'attribut HTML value
    document.getElementById("editAvailability").value = user.availability;

    editModal.style.display = "flex";
}

// DELETE MODAL (La fonction qui manquait !)
function openDeleteModal(id) {
    userToDelete = id; 
    deleteModal.style.display = "flex";
}

// SAVE EDIT (Soumission du Formulaire)
// document.getElementById("editUserForm").addEventListener("submit", async (e) => {
//     e.preventDefault();

//     if (!userToEdit) return;

//     const fullName = document.getElementById("editName").value.trim();
//     const nameParts = fullName.split(" ");
//     const prenom = nameParts[0] || "";
//     const nom = nameParts.slice(1).join(" ") || "";

//     const updatedData = {
//         id: userToEdit.id,
//         nom: nom,
//         prenom: prenom,
//         email: document.getElementById("editEmail").value,
//         role: document.getElementById("editRole").value,
//         availability: document.getElementById("editAvailability").value
//     };

//     // CODE DE SAUVEGARDE EN LOCAL
//     userToEdit.name = fullName;
//     userToEdit.email = updatedData.email;
//     userToEdit.role = updatedData.role;
//     userToEdit.availability = updatedData.availability;

//     renderUsersFromCurrentFilter();
//     editModal.style.display = "none";
//     showToast("Utilisateur mis à jour avec succès.", "success");
    
//     // NOTE: Si tu veux lier à ton API, décommente cette partie :
//     /*
//     try {
//         await fetch('api.php/admin/users/update', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(updatedData)
//         });
//     } catch(err) { console.error("Erreur synchro API", err); }
//     */
// });

// SAVE EDIT (Soumission du Formulaire avec sauvegarde en Base de Données)
document.getElementById("editUserForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!userToEdit) return;

    const fullName = document.getElementById("editName").value.trim();
    const nameParts = fullName.split(" ");
    const prenom = nameParts[0] || "";
    const nom = nameParts.slice(1).join(" ") || "";

    // Préparation des données au format attendu par ton API PHP
    const updatedData = {
        id: userToEdit.id,
        nom: nom,
        prenom: prenom,
        email: document.getElementById("editEmail").value,
        role: document.getElementById("editRole").value,
        availability: document.getElementById("editAvailability").value
    };

    try {
        // Envoi des données modifiées à ton API PHP (Adapte le chemin du fichier si besoin)
        const response = await fetch('../public/api.php/admin/users/update', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(updatedData)
        });

        // On vérifie si le serveur a bien accepté la modification
        if (!response.ok) {
            throw new Error("Erreur serveur lors de la mise à jour");
        }

        // 1. Mise à jour dans la mémoire locale JS seulement si l'API a répondu avec succès
        userToEdit.name = fullName;
        userToEdit.email = updatedData.email;
        userToEdit.role = updatedData.role;
        userToEdit.availability = updatedData.availability;

        // 2. Rafraîchir l'affichage de la table
        renderUsersFromCurrentFilter();
        
        // 3. Fermer la modale et notifier
        editModal.style.display = "none";
        showToast("Utilisateur mis à jour avec succès en base de données.", "success");

    } catch (error) {
        console.error("❌ Erreur de synchronisation API:", error);
        showToast("⚠️ Impossible d'enregistrer les modifications sur le serveur.", "error");
    }
});

// CONFIRM DELETE
document.getElementById("confirmDelete").onclick = () => {
    if (userToDelete == null) return;

    users = users.filter(u => u.id !== userToDelete);
    allUsers = allUsers.filter(u => u.id !== userToDelete);
    currentFilteredUsers = currentFilteredUsers.filter(u => u.id !== userToDelete);
    
    renderUsersFromCurrentFilter();
    deleteModal.style.display = "none";
    userToDelete = null; // Reset
    showToast("Utilisateur supprimé.", "success");
};

document.getElementById("cancelDelete").onclick = () => {
    deleteModal.style.display = "none";
    userToDelete = null;
};

// PAGINATION
function getUserPage(data) {
    const start = (currentUserPage - 1) * usersPerPage;
    return data.slice(start, start + usersPerPage);
}

function renderUsersFromCurrentFilter() {
    currentFilteredUsers.sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' }));
    const totalItems = currentFilteredUsers.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / usersPerPage));
    currentUserPage = Math.min(currentUserPage, totalPages);
    renderUserPagination(totalItems);
    const pageItems = getUserPage(currentFilteredUsers);
    renderUsers(pageItems);
}

function populatePosteFilter() {
    if (!posteFilter) return;

    const postes = [...new Set(allUsers.map(user => user.poste).filter(Boolean))];
    postes.sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));

    posteFilter.innerHTML = '<option value="">Tous les postes</option>';
    postes.forEach(poste => {
        const option = document.createElement('option');
        option.value = poste;
        option.textContent = poste;
        posteFilter.appendChild(option);
    });
}

function renderUserPagination(totalItems) {
    if (!userPaginationControls) return;

    const totalPages = Math.max(1, Math.ceil(totalItems / usersPerPage));
    userPaginationControls.innerHTML = '';

    const pageInfo = document.createElement('span');
    pageInfo.id = 'userPaginationInfo';
    pageInfo.className = 'pagination-info';
    pageInfo.textContent = `Page ${currentUserPage} / ${totalPages}`;
    userPaginationControls.appendChild(pageInfo);

    if (totalPages <= 1) return;

    const createButton = (text, page, active = false, disabled = false) => {
        const button = document.createElement('button');
        button.className = 'pagination-button';
        if (active) button.classList.add('active');
        if (disabled) {
            button.classList.add('disabled');
            button.disabled = true;
        }
        button.textContent = text;
        button.addEventListener('click', () => {
            if (disabled || currentUserPage === page) return;
            currentUserPage = page;
            renderUsersFromCurrentFilter();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        return button;
    };

    userPaginationControls.appendChild(createButton('« Préc.', Math.max(1, currentUserPage - 1), false, currentUserPage === 1));

    const pageWindow = 5;
    const halfWindow = Math.floor(pageWindow / 2);
    let startPage = Math.max(1, currentUserPage - halfWindow);
    let endPage = Math.min(totalPages, startPage + pageWindow - 1);
    if (endPage - startPage < pageWindow - 1) {
        startPage = Math.max(1, endPage - pageWindow + 1);
    }

    for (let page = startPage; page <= endPage; page++) {
        userPaginationControls.appendChild(createButton(page.toString(), page, currentUserPage === page));
    }

    userPaginationControls.appendChild(createButton('Suiv. »', Math.min(totalPages, currentUserPage + 1), false, currentUserPage === totalPages));
}

function applyUserFilters() {
    let filtered = [...allUsers];
    const search = searchUserInput.value.trim().toLowerCase();
    const role = roleFilter.value;
    const poste = posteFilter?.value;
    const availability = availabilityFilter.value;

    if (search) {
        filtered = filtered.filter(user =>
            user.name.toLowerCase().includes(search) ||
            user.email.toLowerCase().includes(search)
        );
    }

    if (role) filtered = filtered.filter(user => user.role === role);
    if (poste) filtered = filtered.filter(user => user.poste === poste);
    if (availability) filtered = filtered.filter(user => user.availability === availability);

    currentFilteredUsers = filtered;
    currentUserPage = 1;
    renderUsersFromCurrentFilter();
}

searchUserInput.addEventListener('input', applyUserFilters);
roleFilter.addEventListener('change', applyUserFilters);
posteFilter?.addEventListener('change', applyUserFilters);
availabilityFilter.addEventListener('change', applyUserFilters);

// CENTRALISATION DE L'ÉCOUTEUR DES CLICS (Pas de conflits)
tableBody.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-action");
    
    // Si on clique sur un bouton d'action
    if (btn) {
        const id = parseInt(btn.dataset.id);
        if (btn.classList.contains("view-btn")) openProfileModal(id);
        if (btn.classList.contains("edit-btn")) openEditModal(id);
        if (btn.classList.contains("delete-btn")) openDeleteModal(id);
    } else {
        // Si on clique n'importe où ailleurs sur la ligne <tr>, on ouvre le profil
        const row = e.target.closest("tr");
        if (row && row.dataset.id) {
            openProfileModal(parseInt(row.dataset.id));
        }
    }
});

// INITIALISATION
async function initializePage() {
    try {
        const currentUser = getCurrentUserFromStorage();

        if (!currentUser) {
            console.warn("⚠️ PAS D'UTILISATEUR AUTHENTIFIÉ");
            showToast("Vous devez être connecté", "error");
            window.location.href = 'login.html';
            return;
        }

        const usersResponse = await apiListUsers();

        if (!Array.isArray(usersResponse)) {
            console.warn("[WARN] apiListUsers() n'a pas retourné un tableau");
            users = [];
            allUsers = [];
        } else {
            users = usersResponse.map(apiUser => transformUserFromAPI(apiUser));
            allUsers = [...users];
            currentFilteredUsers = [...allUsers];
            currentUserPage = 1;

            populatePosteFilter();
        }

        renderUsersFromCurrentFilter();
    } catch (error) {
        console.error("❌ Erreur lors de l'initialisation:", error);
        showToast("⚠️ Erreur de chargement des utilisateurs: " + error.message, "error");
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePage);
} else {
    initializePage();
}