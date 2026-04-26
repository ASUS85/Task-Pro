// ===============================
// TASKPRO - TASK LIST JS (VERSION PRO)
// ===============================

// -------------------------------
// MOCK DATABASE
// -------------------------------
let tasks = [
    {
        id: 1,
        name: "Créer dashboard analytics",
        type: "principale",
        status: "en_cours",
        assignedTo: "John Doe",
        createdBy: "Admin",
        createdAt: "2026-04-20",
        deadline: "2026-04-30",
        priority: "Haute",
        description: "Développement du dashboard enterprise avec analytics avancées.",
        parentTask: null
    },
    {
        id: 2,
        name: "API gestion utilisateurs",
        type: "sous_tache",
        status: "en_attente",
        assignedTo: "Jane Smith",
        createdBy: "Admin",
        createdAt: "2026-04-18",
        deadline: "2026-05-05",
        priority: "Moyenne",
        description: "Créer une API REST pour gérer les utilisateurs.",
        parentTask: 1
    },
    {
        id: 3,
        name: "UI page login",
        type: "principale",
        status: "terminee",
        assignedTo: "Mike",
        createdBy: "Super Admin",
        createdAt: "2026-04-10",
        deadline: "2026-04-15",
        priority: "Basse",
        description: "Interface de connexion moderne et sécurisée.",
        parentTask: null
    },
    {
        id: 4,
        name: "Fix bug authentification",
        type: "sous_tache",
        status: "retard",
        assignedTo: "Sarah",
        createdBy: "Admin",
        createdAt: "2026-04-12",
        deadline: "2026-04-22",
        priority: "Haute",
        description: "Correction des erreurs de login utilisateur.",
        parentTask: 3
    }
];

// -------------------------------
// DOM
// -------------------------------
const tableBody = document.getElementById("taskTableBody");
const modal = document.getElementById("taskDetailsModal");
const closeModalBtn = document.getElementById("closeTaskModal");

// details
const detailTitle = document.getElementById("detailTitle");
const detailDescription = document.getElementById("detailDescription");
const detailCreator = document.getElementById("detailCreator");
const detailAssigned = document.getElementById("detailAssigned");
const detailCreatedAt = document.getElementById("detailCreatedAt");
const detailDeadline = document.getElementById("detailDeadline");
const detailStatus = document.getElementById("detailStatus");
const detailPriority = document.getElementById("detailPriority");
const parentTaskBlock = document.getElementById("parentTaskBlock");
const parentTaskLink = document.getElementById("detailParentTaskLink");

// filters
const searchInput = document.getElementById("searchTask");
const statusFilter = document.getElementById("filterStatus");
const typeFilter = document.getElementById("filterType");

// -------------------------------
// RENDER TABLE
// -------------------------------
function renderTasks(data) {
    tableBody.innerHTML = "";

    // tri par date la plus récente
    data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    data.forEach(task => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${task.name}</td>
            <td>${task.type}</td>
            <td>
                <span class="status-badge status-${task.status}">
                    ${formatStatus(task.status)}
                </span>
            </td>
            <td>${task.assignedTo}</td>
            <td>${task.createdAt}</td>
            <td>${task.deadline} (${getRemainingTime(task.deadline)})</td>
            <td>${task.priority}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view-btn" data-id="${task.id}">👁</button>
                    <button class="action-btn edit-btn" data-id="${task.id}">✏️</button>
                    <button class="action-btn delete-btn" data-id="${task.id}">🗑</button>
                </div>
            </td>
        `;

        // CLICK LIGNE (hors boutons)
        row.addEventListener("click", (e) => {
            if (!e.target.closest(".action-btn")) {
                openModal(task.id);
            }
        });

        tableBody.appendChild(row);
    });
}

// -------------------------------
// FORMAT STATUS
// -------------------------------
function formatStatus(status) {
    const map = {
        en_cours: "En cours",
        en_attente: "En attente",
        terminee: "Terminée",
        retard: "En retard"
    };
    return map[status] || status;
}

// -------------------------------
// TEMPS RESTANT AMÉLIORÉ
// -------------------------------
function getRemainingTime(deadline) {
    const now = new Date();
    const end = new Date(deadline);

    const diff = end - now;

    if (diff <= 0) return "Expiré";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);

    return `${days}j ${hours}h`;
}

// -------------------------------
// MODAL DETAILS
// -------------------------------
function openModal(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    detailTitle.textContent = task.name;
    detailDescription.textContent = task.description;
    detailCreator.textContent = task.createdBy;
    detailAssigned.textContent = task.assignedTo;
    detailCreatedAt.textContent = task.createdAt;
    detailDeadline.textContent = `${task.deadline} (${getRemainingTime(task.deadline)})`;
    detailStatus.textContent = formatStatus(task.status);
    detailPriority.textContent = task.priority;

    // parent task
    if (task.parentTask) {
        const parent = tasks.find(t => t.id === task.parentTask);
        parentTaskBlock.style.display = "block";

        if (parent) {
            parentTaskLink.textContent = parent.name;

            parentTaskLink.onclick = (e) => {
                e.preventDefault();
                openModal(parent.id);
            };
        }
    } else {
        parentTaskBlock.style.display = "none";
    }

    modal.style.display = "flex";
}

// CLOSE MODAL
closeModalBtn.addEventListener("click", () => {
    modal.style.display = "none";
});

window.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.style.display = "none";
    }
});

// -------------------------------
// ACTIONS (DELETE / EDIT / VIEW)
// -------------------------------
tableBody.addEventListener("click", (e) => {
    const id = parseInt(e.target.dataset.id);

    if (e.target.classList.contains("delete-btn")) {
        e.stopPropagation();

        if (confirm("Supprimer cette tâche ?")) {
            tasks = tasks.filter(t => t.id !== id);
            applyFilters();
        }
    }

    if (e.target.classList.contains("edit-btn")) {
        e.stopPropagation();
        alert("Mode édition à connecter au backend");
    }

    if (e.target.classList.contains("view-btn")) {
        e.stopPropagation();
        openModal(id);
    }
});

// -------------------------------
// FILTRES AVANCÉS
// -------------------------------
function applyFilters() {
    let filtered = [...tasks];

    const search = searchInput.value.toLowerCase();
    const status = statusFilter.value;
    const type = typeFilter.value;

    if (search) {
        filtered = filtered.filter(t =>
            t.name.toLowerCase().includes(search)
        );
    }

    if (status) {
        filtered = filtered.filter(t => t.status === status);
    }

    if (type) {
        filtered = filtered.filter(t => t.type === type);
    }

    renderTasks(filtered);
}

// EVENTS
searchInput.addEventListener("input", applyFilters);
statusFilter.addEventListener("change", applyFilters);
typeFilter.addEventListener("change", applyFilters);

// -------------------------------
// INIT
// -------------------------------
renderTasks(tasks);

console.log("TaskPRO Task List chargé avec succès 🚀");