
// ===============================
// TASKPRO - USERS LIST JS (FINAL STABLE)
// ===============================

// -------------------------------
// MOCK DATABASE
// -------------------------------
let users = [
    {
        id: 1,
        name: "John Doe",
        email: "john@taskpro.com",
        role: "admin",
        status: "online",
        availability: "busy",
        tasks: 5,
        lastSeen: "2026-04-26 12:40",
        bio: "Admin système responsable des projets critiques."
    },
    {
        id: 2,
        name: "Sarah Smith",
        email: "sarah@taskpro.com",
        role: "user",
        status: "online",
        availability: "free",
        tasks: 2,
        lastSeen: "2026-04-26 13:10",
        bio: "Développeuse front-end."
    },
    {
        id: 3,
        name: "Mike Johnson",
        email: "mike@taskpro.com",
        role: "super_admin",
        status: "offline",
        availability: "free",
        tasks: 0,
        lastSeen: "2026-04-25 18:22",
        bio: "Super admin du système TaskPRO."
    },
    {
        id: 4,
        name: "Emma Brown",
        email: "emma@taskpro.com",
        role: "user",
        status: "online",
        availability: "busy",
        tasks: 3,
        lastSeen: "2026-04-26 13:20",
        bio: "Designer UI/UX."
    }
];

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
        case "user": return "Utilisateur";
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
    tableBody.innerHTML = "";

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
// INIT
// -------------------------------
renderUsers(users);