
// ===============================
// TASKPRO - USERS LIST JS (FINAL STABLE)
// ===============================

// -------------------------------
// DONNÉES RÉELLES (depuis API)
// -------------------------------
let users = [];
let allUsers = [];

// -------------------------------
// STATE
// -------------------------------
let userToEdit = null;
let userToDelete = null;

// -------------------------------
// DOM
// -------------------------------
const tableBody = document.getElementById("userTableBody");

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
        tasks: 0, // TODO: compter les tâches assignées
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

    userToEdit.name = document.getElementById("editName").value;
    userToEdit.email = document.getElementById("editEmail").value;
    userToEdit.role = document.getElementById("editRole").value;
    userToEdit.availability = document.getElementById("editAvailability").value;

    renderUsers(users);
    editModal.style.display = "none";
});

// -------------------------------
// DELETE MODAL
// -------------------------------
function openDeleteModal(id) {
    userToDelete = id;
    deleteModal.style.display = "flex";
}

document.getElementById("confirmDelete").onclick = () => {
    users = users.filter(u => u.id !== userToDelete);
    renderUsers(users);
    deleteModal.style.display = "none";
};

document.getElementById("cancelDelete").onclick = () => {
    deleteModal.style.display = "none";
};

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
      
      console.log("✅ Utilisateurs transformés et chargés");
      console.log("📊 Nombre d'utilisateurs:", users.length);
    }
    
    // Afficher les utilisateurs
    renderUsers(users);
    
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