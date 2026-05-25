
// ===============================
// TASKPRO - USERS LIST JS (FINAL STABLE)
// ===============================

// -------------------------------
// DONNÉES RÉELLES (depuis API)
// -------------------------------
let users = [];
let allUsers = [];
let currentUserPage = 1;
const usersPerPage = 10;
let currentFilteredUsers = [];

// -------------------------------
// STATE
// -------------------------------
let userToEdit = null;
let userToDelete = null;

// -------------------------------
// DOM
// -------------------------------
const tableBody = document.getElementById("userTableBody");
const userPaginationControls = document.getElementById("userPaginationControls");
const searchUserInput = document.getElementById("searchUser");
const roleFilter = document.getElementById("filterRole");
const statusFilter = document.getElementById("filterStatus");
const availabilityFilter = document.getElementById("filterAvailability");

// MODALS
const profileModal = document.getElementById("userModal");
const editModal = document.getElementById("editUserModal");
const deleteModal = document.getElementById("confirmDeleteModal");

// CLOSE BUTTONS
document.getElementById("closeUserModal").onclick = () => profileModal.style.display = "none";
document.getElementById("closeEditUserModal").onclick = () => editModal.style.display = "none";

// -------------------------------
// TRANSFORMER DONNÉES API → FRONTEND
// -------------------------------
/**
 * Transforme un utilisateur de l'API au format du frontend
 */
function transformUserFromAPI(apiUser) {
    // Mapper le rôle API vers le format frontend
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
        status: "online", // TODO: récupérer du statut en temps réel si disponible
        availability: "free", // TODO: récupérer la disponibilité réelle si disponible
        tasks: apiUser.total_taches || 0, // TODO: compter les tâches assignées
        lastSeen: new Date().toLocaleString('fr-FR'),
        bio: apiUser.poste ? `${apiUser.poste}` : "Aucune bio disponible"
    };
}

// CLOSE BUTTONS

// -------------------------------
// AVATAR
// -------------------------------
function getAvatar(name) {
    return name
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase();
}

// -------------------------------
// FORMATTERS
// -------------------------------
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

// -------------------------------
// RENDER TABLE
// -------------------------------
function renderUsers(data) {
    console.log("[RENDER] Affichage de", data.length, "utilisateur(s)");
    
    tableBody.innerHTML = "";

    // Si aucun utilisateur
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

    data.forEach(user => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>
                <div class="user-avatar">${getAvatar(user.name)}</div>
                ${user.name}
            </td>

            <td>${user.email}</td>

            <td>${formatRole(user.role)}</td>

            <td>
                <span class="badge ${user.status}">
                    ${formatStatus(user.status)}
                </span>
            </td>

            <td>
                <span class="badge ${user.availability}">
                    ${formatAvailability(user.availability)}
                </span>
            </td>

            <td>${user.tasks}</td>
            <td>${user.lastSeen}</td>

            <td>
                <div class="action-buttons">

                    <button class="btn-action view-btn" data-id="${user.id}">
                        Voir
                    </button>

                    <button class="btn-action edit-btn" data-id="${user.id}">
                        Modifier
                    </button>

                    <button class="btn-action delete-btn" data-id="${user.id}">
                        Supprimer
                    </button>

                </div>
            </td>
        `;

        // click row => profil
        row.addEventListener("click", (e) => {
            if (!e.target.closest(".btn-action")) {
                openProfileModal(user.id);
            }
        });

        tableBody.appendChild(row);
    });
}

// -------------------------------
// PROFILE MODAL
// -------------------------------
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

// -------------------------------
// EDIT MODAL
// -------------------------------
function openEditModal(id) {
    const user = users.find(u => u.id === id);
    if (!user) return;

    userToEdit = user;

    document.getElementById("editName").value = user.name;
    document.getElementById("editEmail").value = user.email;
    document.getElementById("editRole").value = user.role;
    document.getElementById("editAvailability").value = user.availability;

    editModal.style.display = "flex";
}

// SAVE EDIT
document.getElementById("editUserForm").addEventListener("submit", (e) => {
    e.preventDefault();

    if (!userToEdit) {
        return;
    }

    userToEdit.name = document.getElementById("editName").value;
    userToEdit.email = document.getElementById("editEmail").value;
    userToEdit.role = document.getElementById("editRole").value;
    userToEdit.availability = document.getElementById("editAvailability").value;

    renderUsersFromCurrentFilter();
    editModal.style.display = "none";
});

document.getElementById("confirmDelete").onclick = () => {
    if (userToDelete == null) {
        return;
    }

    users = users.filter(u => u.id !== userToDelete);
    allUsers = allUsers.filter(u => u.id !== userToDelete);
    currentFilteredUsers = currentFilteredUsers.filter(u => u.id !== userToDelete);
    renderUsersFromCurrentFilter();
    deleteModal.style.display = "none";
};

document.getElementById("cancelDelete").onclick = () => {
    deleteModal.style.display = "none";
};

// -------------------------------
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

function renderUserPagination(totalItems) {
    if (!userPaginationControls) {
        return;
    }

    const totalPages = Math.max(1, Math.ceil(totalItems / usersPerPage));
    userPaginationControls.innerHTML = '';

    const pageInfo = document.createElement('span');
    pageInfo.id = 'userPaginationInfo';
    pageInfo.className = 'pagination-info';
    pageInfo.textContent = `Page ${currentUserPage} / ${totalPages}`;
    userPaginationControls.appendChild(pageInfo);

    if (totalPages <= 1) {
        return;
    }

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
    const status = statusFilter.value;
    const availability = availabilityFilter.value;

    if (search) {
        filtered = filtered.filter(user =>
            user.name.toLowerCase().includes(search) ||
            user.email.toLowerCase().includes(search)
        );
    }

    if (role) {
        filtered = filtered.filter(user => user.role === role);
    }

    if (status) {
        filtered = filtered.filter(user => user.status === status);
    }

    if (availability) {
        filtered = filtered.filter(user => user.availability === availability);
    }

    currentFilteredUsers = filtered;
    currentUserPage = 1;
    renderUsersFromCurrentFilter();
}

searchUserInput.addEventListener('input', applyUserFilters);
roleFilter.addEventListener('change', applyUserFilters);
statusFilter.addEventListener('change', applyUserFilters);
availabilityFilter.addEventListener('change', applyUserFilters);

// -------------------------------
// ACTIONS HANDLER
// -------------------------------
tableBody.addEventListener("click", (e) => {
    const id = parseInt(e.target.dataset.id);

    if (e.target.classList.contains("view-btn")) {
        openProfileModal(id);
    }

    if (e.target.classList.contains("edit-btn")) {
        openEditModal(id);
    }

    if (e.target.classList.contains("delete-btn")) {
        openDeleteModal(id);
    }
});

// -------------------------------
// INITIALISATION
// -------------------------------
async function initializePage() {
    try {
        // Vérifier l'authentification
        const currentUser = getCurrentUserFromStorage();
        console.log("[AUTH] Utilisateur actuel:", currentUser);

        if (!currentUser) {
            console.warn("⚠️ PAS D'UTILISATEUR AUTHENTIFIÉ");
            alert("Vous devez être connecté");
            window.location.href = 'login.html';
            return;
        }

        console.log("[INIT] Démarrage du chargement des utilisateurs");
        console.log("[API] Appel GET /users...");

        // Charger les utilisateurs (seulement pour Administrateur)
        const usersResponse = await apiListUsers();
        console.log("[API RESPONSE] Utilisateurs reçus:", usersResponse);

        if (!Array.isArray(usersResponse)) {
            console.warn("[WARN] apiListUsers() n'a pas retourné un tableau");
            users = [];
            allUsers = [];
        } else {
            // Transformer les données
            users = usersResponse.map(apiUser => transformUserFromAPI(apiUser));
            allUsers = [...users];
            currentFilteredUsers = [...allUsers];
            currentUserPage = 1;

            console.log("✅ Utilisateurs transformés et chargés");
            console.log("📊 Nombre d'utilisateurs:", users.length);
        }

        // Afficher les utilisateurs
        renderUsersFromCurrentFilter();
        console.log("✅ TaskPRO Users List initialisé avec succès 🚀");
    } catch (error) {
        console.error("❌ Erreur lors de l'initialisation:", error);
        console.error("Stack:", error.stack);
        alert("⚠️ Erreur de chargement des utilisateurs:\n" + error.message);
    }
}

// Lancer l'initialisation au chargement
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePage);
} else {
  initializePage();
}