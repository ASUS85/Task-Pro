
// ===============================
// TASKPRO - PROFILE JS
// ===============================

// -------------------------------
// MOCK USER DATA (plus tard API)
// -------------------------------
const currentUser = {
    name: "Super Admin",
    email: "admin@taskpro.com",
    role: "Super Administrateur",
    status: "online",
    tasksCreated: 32,
    tasksInProgress: 12,
    tasksDone: 25,
    usersManaged: 8,
    lastLogin: "Aujourd’hui"
};

// -------------------------------
// INIT PROFILE UI
// -------------------------------
function loadProfile() {

    // HEADER INFOS
    const nameEl = document.querySelector(".avatar-box h2");
    const emailEl = document.querySelector(".avatar-box p");
    const statusEl = document.querySelector(".status");

    if (nameEl) nameEl.textContent = currentUser.name;
    if (emailEl) emailEl.textContent = currentUser.email;

    if (statusEl) {
        statusEl.textContent = "En ligne";
        statusEl.classList.add("online");
    }

    // STATS UPDATE
    const stats = document.querySelectorAll(".stat-card h4");

    if (stats.length >= 4) {
        stats[0].textContent = currentUser.tasksCreated;
        stats[1].textContent = currentUser.tasksInProgress;
        stats[2].textContent = currentUser.tasksDone;
        stats[3].textContent = currentUser.usersManaged;
    }

    // INFO SECTION (si HTML present)
    const infoBlocks = document.querySelectorAll(".info-line p");

    if (infoBlocks.length >= 4) {
        infoBlocks[0].textContent = currentUser.name;
        infoBlocks[1].textContent = currentUser.email;
        infoBlocks[2].textContent = currentUser.role;
        infoBlocks[3].textContent = currentUser.lastLogin;
    }
}

// -------------------------------
// BUTTON ACTIONS
// -------------------------------

// CHANGE PASSWORD (UI mock)
function changePassword() {
    alert("Fonction changement mot de passe (à connecter backend)");
}

// GLOBAL LOGOUT
function logout() {
    if (confirm("Voulez-vous vraiment vous déconnecter ?")) {
        window.location.href = "login.html";
    }
}

// DISABLE ACCOUNT (mock)
function disableAccount() {
    if (confirm("Désactiver ce compte ?")) {
        alert("Compte désactivé (simulation)");
    }
}

// -------------------------------
// EVENTS BINDING
// -------------------------------
function bindActions() {

    const buttons = document.querySelectorAll(".btn");

    buttons.forEach(btn => {
        if (btn.textContent.includes("mot de passe")) {
            btn.addEventListener("click", changePassword);
        }

        if (btn.textContent.includes("Déconnexion globale")) {
            btn.addEventListener("click", logout);
        }

        if (btn.textContent.includes("Désactiver")) {
            btn.addEventListener("click", disableAccount);
        }
    });
}

// -------------------------------
// INIT APP
// -------------------------------
document.addEventListener("DOMContentLoaded", () => {
    loadProfile();
    bindActions();
});
document.addEventListener("DOMContentLoaded", () => {

    const links = document.querySelectorAll(".side-nav a");
    const currentPage = window.location.pathname.split("/").pop();

    links.forEach(link => {

        const href = link.getAttribute("href");

        // reset
        link.classList.remove("active");

        // match page actuelle
        if (href === currentPage) {
            link.classList.add("active");
        }

    });

});
document.getElementById("createAdminForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const confirmCreate = confirm(
        "Confirmer la création de ce nouvel administrateur ?"
    );

    if (!confirmCreate) return;

    alert("Administrateur créé avec succès.");

    this.reset();
});

// ===============================
// SUPER ADMIN - CREATE ADMIN LOGIC
// ===============================

document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("createAdminForm");
    const modal = document.getElementById("confirmAdminModal");
    const cancelBtn = document.getElementById("cancelAdminCreate");
    const confirmBtn = document.getElementById("confirmAdminCreate");
    const adminList = document.querySelector(".admins-list");
    const adminCount = document.querySelector(".admin-count");

    let tempAdminData = null;

    // =========================
    // OUVERTURE MODAL
    // =========================
    form.addEventListener("submit", (e) => {
        e.preventDefault();

        const name = form.querySelector("input[type='text']").value.trim();
        const email = form.querySelector("input[type='email']").value.trim();
        const password = form.querySelector("input[type='password']").value.trim();
        const role = form.querySelector("select").value;

        if (!name || !email || !password || !role) {
            alert("Veuillez remplir tous les champs !");
            return;
        }

        tempAdminData = { name, email, role };

        modal.classList.add("show");
    });

    // =========================
    // ANNULER MODAL
    // =========================
    cancelBtn.addEventListener("click", () => {
        modal.classList.remove("show");
        tempAdminData = null;
    });

    // =========================
    // CONFIRMER CREATION ADMIN
    // =========================
    confirmBtn.addEventListener("click", () => {

        if (!tempAdminData) return;

        const initials = getInitials(tempAdminData.name);

        // créer nouvelle ligne admin
        const newAdmin = document.createElement("div");
        newAdmin.classList.add("admin-row");

        newAdmin.innerHTML = `
            <div class="admin-left">
                <div class="admin-avatar">${initials}</div>
                <div>
                    <strong>${tempAdminData.name}</strong>
                    <p>${tempAdminData.email}</p>
                </div>
            </div>

            <div class="admin-actions">
                <button class="icon-btn">Voir</button>
                <button class="icon-btn">Modifier</button>
                <button class="icon-btn danger">Supprimer</button>
            </div>
        `;

        adminList.appendChild(newAdmin);

        // update compteur
        const current = parseInt(adminCount.textContent) || 0;
        adminCount.textContent = `${current + 1} Admins`;

        // reset UI
        form.reset();
        modal.classList.remove("show");
        tempAdminData = null;

        // feedback
        alert("Administrateur créé avec succès !");
    });

    // =========================
    // OUTSIDE CLICK CLOSE MODAL
    // =========================
    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.classList.remove("show");
            tempAdminData = null;
        }
    });

    // =========================
    // UTIL: INITIALS
    // =========================
    function getInitials(name) {
        return name
            .split(" ")
            .map(word => word[0])
            .join("")
            .toUpperCase()
            .substring(0, 2);
    }

});
document.addEventListener("DOMContentLoaded", () => {

    const modal = document.getElementById("adminActionModal");
    const closeBtn = document.getElementById("closeAdminModal");
    const details = document.getElementById("adminDetails");
    const title = document.getElementById("modalTitle");

    let selectedAdmin = null;

    // =========================
    // OPEN MODAL ON CLICK
    // =========================
    document.querySelectorAll(".admin-row").forEach(row => {

        const viewBtn = row.querySelector(".icon-btn:not(.danger)");
        const deleteBtn = row.querySelector(".icon-btn.danger");
        const editBtn = row.querySelectorAll(".icon-btn")[1];

        const name = row.querySelector("strong").textContent;
        const email = row.querySelector("p").textContent;

        // VIEW
        viewBtn.addEventListener("click", () => {
            openModal("Consulter Admin", name, email);
        });

        // EDIT
        editBtn.addEventListener("click", () => {
            openModal("Modifier Admin", name, email, true);
        });

        // DELETE
        deleteBtn.addEventListener("click", () => {
            if (confirm("Supprimer cet administrateur ?")) {
                row.remove();
                alert("Admin supprimé");
            }
        });

    });

    // =========================
    // OPEN MODAL FUNCTION
    // =========================
    function openModal(mode, name, email, editable = false) {

        title.textContent = mode;

        details.innerHTML = editable ? `
            <input id="editName" value="${name}" />
            <input id="editEmail" value="${email}" />
        ` : `
            <p><strong>Nom:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
        `;

        modal.classList.add("show");

        selectedAdmin = { name, email, editable };
    }

    // =========================
    // CLOSE MODAL
    // =========================
    closeBtn.addEventListener("click", () => {
        modal.classList.remove("show");
    });

    // =========================
    // EDIT SAVE
    // =========================
    document.getElementById("editAdminBtn").addEventListener("click", () => {

        if (!selectedAdmin?.editable) return;

        const newName = document.getElementById("editName").value;
        const newEmail = document.getElementById("editEmail").value;

        alert("Admin modifié : " + newName);

        modal.classList.remove("show");
    });

    // =========================
    // DELETE FROM MODAL
    // =========================
    document.getElementById("deleteAdminBtn").addEventListener("click", () => {

        if (confirm("Confirmer suppression ?")) {
            alert("Admin supprimé (depuis modal)");
            modal.classList.remove("show");
        }

    });

});