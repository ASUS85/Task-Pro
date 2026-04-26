
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