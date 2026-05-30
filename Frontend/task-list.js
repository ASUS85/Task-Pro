// ===============================
// TASKPRO - TASK LIST JS (VERSION PRO)
// ===============================

// -------------------------------
// DONNÉES RÉELLES (depuis API)
// -------------------------------
let tasks = [];
let allTasks = []; // pour les filtres
let usersById = {}; // Map des utilisateurs par id_responsable
let currentTaskPage = 1;
const tasksPerPage = 10;
let currentFilteredTasks = [];

function showToast(message, type = 'info') {
    if (window.loaderManager?.toast) {
        loaderManager.toast(message, type, 3000);
        return;
    }
    alert(message);
}

async function confirmAction(message) {
    if (window.loaderManager?.confirm) {
        return await loaderManager.confirm(message);
    }
    return confirm(message);
}

// -------------------------------
// DOM
// -------------------------------
const tableBody = document.getElementById("taskTableBody");
const taskPaginationControls = document.getElementById("taskPaginationControls");
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

// Edit modal
const editModal = document.getElementById("taskEditModal");
const closeEditModalBtn = document.getElementById("closeEditModal");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const taskEditForm = document.getElementById("taskEditForm");
const editTitle = document.getElementById("editTitle");
const editDescription = document.getElementById("editDescription");
const editDeadline = document.getElementById("editDeadline");
const editStatusGroup = document.getElementById("editStatusGroup");
const editStatus = document.getElementById("editStatus");
const editMessage = document.getElementById("editMessage");
let currentTaskEdit = null;

// filters
const searchInput = document.getElementById("searchTask");
const statusFilter = document.getElementById("filterStatus");
const typeFilter = document.getElementById("filterType");

// -------------------------------
// TRANSFORMER DONNÉES API → FRONTEND
// -------------------------------
/**
 * Transforme une tâche de l'API au format du frontend
 */
function transformTaskFromAPI(apiTask) {
    // Déterminer le type de tâche (principale ou sous-tâche)
    const type = apiTask.id_parent ? "sous_tache" : "principale";

    // Mapper le statut API vers le format frontend
    const mapping = {
        "non assigné": { status: "en_attente", label: "Non assignée" },
        "assigné": { status: "en_attente", label: "Assignée" },
        "en cours": { status: "en_cours", label: "En cours" },
        "non terminé": { status: "en_attente", label: "Non terminé" },
        "terminé": { status: "terminee", label: "Terminée" },
        "expiré": { status: "retard", label: "Expirée" }
    };

    const normalized = mapping[apiTask.status] || { status: "en_attente", label: apiTask.status || "En attente" };
    const status = normalized.status;
    const statusLabel = normalized.label;

    // Récupérer le nom du responsable si disponible
    let assignedTo = "-";
    const responsableId = apiTask.id_responsable !== undefined && apiTask.id_responsable !== null ? Number(apiTask.id_responsable) : null;
    if (responsableId) {
        const responsibleUser = usersById[responsableId];
        if (responsibleUser) {
            assignedTo = `${responsibleUser.prenom} ${responsibleUser.nom}`;
        } else {
            assignedTo = `Utilisateur #${responsableId}`;
        }
    }

    const createdAtRaw = apiTask.dateCreation || "";
    const deadlineRaw = apiTask.periode_realisation || "";
    const createdAt = formatDateTime(createdAtRaw);
    const deadline = computeDeadline(createdAtRaw, deadlineRaw, apiTask.dateDebutAssignation);

    return {
        id: apiTask.id,
        name: apiTask.libelle,
        type: type,
        status: status,
        rawStatus: apiTask.status,
        statusLabel: statusLabel,
        assignedTo: assignedTo,
        createdBy: "Admin", // TODO: récupérer du créateur réel si disponible
        createdAt: createdAt,
        createdAtRaw: createdAtRaw,
        deadline: deadline,
        deadlineRaw: deadlineRaw,
        priority: "Moyenne", // TODO: ajouter priorité en BD
        description: apiTask.description || "Aucune description",
        responsableId: responsableId,
        parentTask: apiTask.id_parent || null,
        dateDebutAssignation: apiTask.dateDebutAssignation || null
    };
}

function pad(value) {
    return String(value).padStart(2, '0');
}

function formatDateTime(dateString) {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        return dateString;
    }
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseDurationToMs(durationString) {
    if (!durationString) return null;

    const trimmed = durationString.trim().toLowerCase();
    const regex = /^(\d+)([dhm])$/;
    const match = trimmed.match(regex);
    if (match) {
        const value = parseInt(match[1], 10);
        const unit = match[2];
        if (unit === 'd') return value * 24 * 60 * 60 * 1000;
        if (unit === 'h') return value * 60 * 60 * 1000;
        if (unit === 'm') return value * 60 * 1000;
    }

    const regexComplex = /^(\d+)h(\d+)?m?$/;
    const matchComplex = trimmed.match(regexComplex);
    if (matchComplex) {
        const hours = parseInt(matchComplex[1], 10);
        const minutes = matchComplex[2] ? parseInt(matchComplex[2], 10) : 0;
        return (hours * 60 + minutes) * 60 * 1000;
    }

    const regexHMS = /^(\d+):(\d+)(?::(\d+))?$/;
    const matchHMS = trimmed.match(regexHMS);
    if (matchHMS) {
        const hours = parseInt(matchHMS[1], 10);
        const minutes = parseInt(matchHMS[2], 10);
        const seconds = matchHMS[3] ? parseInt(matchHMS[3], 10) : 0;
        return (hours * 60 + minutes) * 60 * 1000 + seconds * 1000;
    }

    return null;
}

function computeDeadline(createdAtRaw, deadlineRaw, dateDebutAssignation) {
    if (!deadlineRaw) return "-";

    const startString = dateDebutAssignation || createdAtRaw;
    const startDate = startString ? new Date(startString) : null;
    const durationMs = parseDurationToMs(deadlineRaw);

    if (durationMs !== null && startDate && !isNaN(startDate.getTime())) {
        return formatDateTime(new Date(startDate.getTime() + durationMs).toISOString());
    }

    const absolute = new Date(deadlineRaw);
    if (!isNaN(absolute.getTime())) {
        return formatDateTime(absolute.toISOString());
    }

    return deadlineRaw;
}

// filters

// -------------------------------
// RENDER TABLE
// -------------------------------
function renderTasks(data) {

    tableBody.innerHTML = "";

    // Si aucune tâche
    if (data.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 30px; color: #999;">
                    <p>Aucune tâche à afficher</p>
                    <small>Vous n'avez aucune tâche créée ou correspondant aux filtres appliqués.</small>
                </td>
            </tr>
        `;
        return;
    }

    // tri par date la plus récente
    data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    data.forEach(task => {
        const row = document.createElement("tr");
        row.dataset.taskId = task.id;

        row.innerHTML = `
            <td>${task.name}</td>
            <td>${task.type}</td>
            <td>
                <span class="status-badge status-${task.status}">
                    ${task.statusLabel}
                </span>
            </td>
            <td>${task.assignedTo}</td>
            <td>${task.createdAt}</td>
            <td>${task.deadline}</td>
            <td>
                <span class="remaining-time">
                    ${getRemainingTime(task.deadline)}
                </span>
            </td>
            <td>${task.priority}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view-btn" data-id="${task.id}" title="Voir">👁</button>
                    <button class="action-btn edit-btn" data-id="${task.id}" title="Éditer">✏️</button>
                    <button class="action-btn delete-btn" data-id="${task.id}" title="Supprimer">🗑</button>
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

function getTaskPage(data) {
    const start = (currentTaskPage - 1) * tasksPerPage;
    return data.slice(start, start + tasksPerPage);
}

function renderTasksFromCurrentFilter() {
    currentFilteredTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const totalItems = currentFilteredTasks.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / tasksPerPage));
    currentTaskPage = Math.min(currentTaskPage, totalPages);
    renderTaskPagination(totalItems);
    const pageItems = getTaskPage(currentFilteredTasks);
    renderTasks(pageItems);
}

function renderTaskPagination(totalItems) {
    if (!taskPaginationControls) {
        return;
    }

    const totalPages = Math.max(1, Math.ceil(totalItems / tasksPerPage));
    taskPaginationControls.innerHTML = '';

    const pageInfo = document.createElement('span');
    pageInfo.id = 'taskPaginationInfo';
    pageInfo.className = 'pagination-info';
    pageInfo.textContent = `Page ${currentTaskPage} / ${totalPages}`;
    taskPaginationControls.appendChild(pageInfo);

    if (totalPages <= 1) {
        return;
    }

    const createButton = (text, page, active = false, disabled = false) => {
        const button = document.createElement('button');
        button.className = 'pagination-button';
        if (active) {
            button.classList.add('active');
        }
        if (disabled) {
            button.classList.add('disabled');
            button.disabled = true;
        }
        button.textContent = text;
        button.addEventListener('click', () => {
            if (disabled || currentTaskPage === page) return;
            currentTaskPage = page;
            renderTasksFromCurrentFilter();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        return button;
    };

    taskPaginationControls.appendChild(createButton('« Préc.', Math.max(1, currentTaskPage - 1), false, currentTaskPage === 1));

    const pageWindow = 5;
    const halfWindow = Math.floor(pageWindow / 2);
    let startPage = Math.max(1, currentTaskPage - halfWindow);
    let endPage = Math.min(totalPages, startPage + pageWindow - 1);
    if (endPage - startPage < pageWindow - 1) {
        startPage = Math.max(1, endPage - pageWindow + 1);
    }

    for (let page = startPage; page <= endPage; page++) {
        taskPaginationControls.appendChild(createButton(page.toString(), page, currentTaskPage === page));
    }

    taskPaginationControls.appendChild(createButton('Suiv. »', Math.min(totalPages, currentTaskPage + 1), false, currentTaskPage === totalPages));
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
    if (!deadline || deadline === "-") return "-";

    const now = new Date();
    const end = new Date(deadline);

    if (isNaN(end.getTime())) return "-";

    const diff = end - now;

    if (diff <= 0) {
        return "0s";
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);

    if (days > 0) {
        return `${days}j ${hours}h`;
    }

    if (hours > 0) {
        return `${hours}h ${minutes}min`;
    }

    return `${minutes} min`;
}
// -------------------------------
// MODAL DETAILS
// -------------------------------
function openModal(id) {
    const task = tasks.find(t => t.id === id) || allTasks.find(t => t.id === id);
    if (!task) {
        console.warn("[MODAL] Tâche non trouvée:", id);
        return;
    }

    ("[MODAL] Ouverture détails tâche:", task.name);

    detailTitle.textContent = task.name;
    detailDescription.textContent = task.description;
    detailCreator.textContent = task.createdBy;
    detailAssigned.textContent = task.assignedTo;
    detailCreatedAt.textContent = task.createdAt;
    detailDeadline.textContent = `${task.deadline} (${getRemainingTime(task.deadline)})`;
    detailStatus.textContent = task.statusLabel;
    detailPriority.textContent = task.priority;

    // parent task
    if (task.parentTask) {
        const parent = tasks.find(t => t.id === task.parentTask) || allTasks.find(t => t.id === task.parentTask);
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

function openEditTask(taskId) {
    currentTaskEdit = tasks.find(t => t.id === taskId) || allTasks.find(t => t.id === taskId);
    if (!currentTaskEdit) {
        console.warn("[EDIT] Tâche non trouvée pour édition:", taskId);
        return;
    }

    const currentUser = getCurrentUserFromStorage();
    if (!currentUser) {
        showToast("Vous devez être connecté pour modifier une tâche.", "error");
        return;
    }

    editMessage.style.display = 'none';
    editStatusGroup.style.display = 'none';
    editTitle.disabled = false;
    editDescription.disabled = false;
    editDeadline.disabled = false;
    editStatus.innerHTML = '';

    editTitle.value = currentTaskEdit.name;
    editDescription.value = currentTaskEdit.description;
    editDeadline.value = currentTaskEdit.deadlineRaw || currentTaskEdit.deadline;

    if (currentTaskEdit.rawStatus === 'expiré') {
        editMessage.textContent = "Cette tâche a expiré et ne peut plus être modifiée.";
        editMessage.style.display = 'block';
        editTitle.disabled = true;
        editDescription.disabled = true;
        editDeadline.disabled = true;
    } else if (currentUser.role === 'Employe') {
        // Employé ne peut modifier que le statut après assignation
        if (currentTaskEdit.rawStatus === 'assigné' || currentTaskEdit.rawStatus === 'en cours') {
            editTitle.disabled = true;
            editDescription.disabled = true;
            editDeadline.disabled = true;
            editStatusGroup.style.display = 'block';

            const options = [];
            if (currentTaskEdit.rawStatus === 'assigné') {
                options.push({ value: 'en cours', label: 'En cours' });
                options.push({ value: 'terminé', label: 'Terminée' });
                options.push({ value: 'non terminé', label: 'Non terminé' });
            } else if (currentTaskEdit.rawStatus === 'en cours') {
                options.push({ value: 'terminé', label: 'Terminée' });
                options.push({ value: 'non terminé', label: 'Non terminé' });
            }

            if (options.length === 0) {
                editMessage.textContent = "Aucune action de statut possible pour cette tâche.";
                editMessage.style.display = 'block';
            }

            options.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt.value;
                option.textContent = opt.label;
                editStatus.appendChild(option);
            });
        } else {
            editMessage.textContent = "Vous ne pouvez modifier que le statut d'une tâche assignée ou en cours.";
            editMessage.style.display = 'block';
            editTitle.disabled = true;
            editDescription.disabled = true;
            editDeadline.disabled = true;
        }
        // APRÈS
    } else {
        // Admin / SuperAdmin
        const isAssignedToMe = currentTaskEdit.responsableId === currentUser.id;
        const canUpdateStatus = isAssignedToMe &&
            (currentTaskEdit.rawStatus === 'assigné' || currentTaskEdit.rawStatus === 'en cours');

        if (canUpdateStatus) {
            // La tâche lui est assignée → il peut changer le statut comme un Employé
            editTitle.disabled = true;
            editDescription.disabled = true;
            editDeadline.disabled = true;
            editStatusGroup.style.display = 'block';

            const options = [];
            if (currentTaskEdit.rawStatus === 'assigné') {
                options.push({ value: 'en cours', label: 'En cours' });
                options.push({ value: 'terminé', label: 'Terminée' });
                options.push({ value: 'non terminé', label: 'Non terminé' });
            } else if (currentTaskEdit.rawStatus === 'en cours') {
                options.push({ value: 'terminé', label: 'Terminée' });
                options.push({ value: 'non terminé', label: 'Non terminé' });
            }

            options.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt.value;
                option.textContent = opt.label;
                editStatus.appendChild(option);
            });

        } else if (currentTaskEdit.rawStatus === 'non assigné') {
            // Tâche non assignée → Admin peut éditer librement
            // (champs déjà activés par défaut en haut de la fonction)

        } else {
            // Tâche assignée à quelqu'un d'autre ou statut bloquant
            const msg = isAssignedToMe
                ? "Cette tâche ne peut plus être modifiée dans son état actuel."
                : "La tâche ne peut plus être modifiée par l'administrateur après assignation.";
            editMessage.textContent = msg;
            editMessage.style.display = 'block';
            editTitle.disabled = true;
            editDescription.disabled = true;
            editDeadline.disabled = true;
        }
    }

    editModal.style.display = 'flex';
}

// CLOSE MODAL
closeModalBtn.addEventListener("click", () => {
    modal.style.display = "none";
});

window.addEventListener("click", (e) => {
    if (e.target === modal) {
        modal.style.display = "none";
    }
    if (e.target === editModal) {
        editModal.style.display = "none";
    }
});

closeEditModalBtn.addEventListener("click", () => {
    editModal.style.display = "none";
});

cancelEditBtn.addEventListener("click", () => {
    editModal.style.display = "none";
});

if (taskEditForm) {
    taskEditForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentTaskEdit) return;

        const currentUser = getCurrentUserFromStorage();
        if (!currentUser) {
            showToast("Vous devez être connecté pour modifier une tâche.", "error");
            return;
        }

        if (editStatusGroup.style.display !== 'block') {
            const statusMessages = {
                'expiré': "Cette tâche a expiré et ne peut plus être modifiée.",
                'non terminé': "Cette tâche est marquée comme non terminée et ne peut pas être modifiée.",
                'terminé': "Cette tâche est déjà terminée et ne peut plus être modifiée.",
                'en cours': "Cette tâche est en cours d'exécution et ne peut pas être modifiée.",
                'assigné': "Cette tâche est déjà assignée et ne peut plus être modifiée."
            };

            const blockedMessage = statusMessages[currentTaskEdit.rawStatus];
            if (blockedMessage) {
                editModal.style.display = 'none';
                showToast(blockedMessage, 'error');
                return;
            }
        }

        try {
            if (editStatusGroup.style.display === 'block') {
                const newStatus = editStatus.value;
                if (!newStatus) {
                    showToast('Veuillez sélectionner un statut.', 'error');
                    return;
                }
                await apiUpdateTaskStatus(currentTaskEdit.id, newStatus);
                showToast('Statut mis à jour avec succès.', 'success');
            } else {
                await apiUpdateTask(currentTaskEdit.id, {
                    libelle: editTitle.value.trim(),
                    description: editDescription.value.trim(),
                    periode_realisation: editDeadline.value.trim(),
                    id_parent: currentTaskEdit.parentTask || null
                });
                showToast('Tâche mise à jour avec succès.', 'success');
            }

            editModal.style.display = 'none';
            const tasksResponse = await apiListTasks();
            tasks = tasksResponse.map(apiTask => transformTaskFromAPI(apiTask));
            allTasks = [...tasks];
            applyFilters();
        } catch (error) {
            editModal.style.display = 'none';
            console.error('[EDIT] Erreur mise à jour tâche:', error);
            showToast('Erreur: ' + error.message, 'error');
        }
    });
}

// -------------------------------
// ACTIONS (DELETE / EDIT / VIEW)
// -------------------------------
tableBody.addEventListener("click", async (e) => {
    const id = parseInt(e.target.dataset.id);

    if (e.target.classList.contains("delete-btn")) {
        e.stopPropagation();

        if (await confirmAction("Supprimer cette tâche ?")) {
            try {
                const result = await apiDeleteTask(id);

                if (result.success) {
                    // Supprimer du tableau local
                    tasks = tasks.filter(t => t.id !== id);
                    allTasks = allTasks.filter(t => t.id !== id);
                    applyFilters();
                    showToast("Tâche supprimée avec succès", "success");
                } else {
                    throw new Error(result.message || "Erreur lors de la suppression");
                }
            } catch (error) {
                console.error("Erreur suppression:", error);
                showToast("Erreur: " + error.message, "error");
            }
        }
    }

    if (e.target.classList.contains("edit-btn")) {
        e.stopPropagation();
        openEditTask(id);
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
    // Utiliser allTasks comme source (ne pas modifier tasks directement)
    let filtered = [...allTasks];

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

    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    currentFilteredTasks = filtered;
    currentTaskPage = 1;
    renderTasksFromCurrentFilter();
}

// EVENTS
searchInput.addEventListener("input", applyFilters);
statusFilter.addEventListener("change", applyFilters);
typeFilter.addEventListener("change", applyFilters);

// -------------------------------
// UTILITAIRES
// -------------------------------
async function loadUsersById() {
    usersById = {};
    try {
        const usersResponse = await apiListUsers();
        if (Array.isArray(usersResponse)) {
            usersResponse.forEach(user => {
                usersById[user.id] = user;
            });
        }
    } catch (error) {
        console.warn('[WARN] Impossible de charger la liste des utilisateurs :', error.message);
    }

    // Toujours ajouter l'utilisateur connecté dans la map
    // (il peut ne pas apparaître dans apiListUsers selon son rôle)
    const currentUser = getCurrentUserFromStorage();
    if (currentUser && currentUser.id && !usersById[currentUser.id]) {
        usersById[currentUser.id] = {
            id: currentUser.id,
            nom: currentUser.nom,
            prenom: currentUser.prenom
        };
    }
}


// -------------------------------
// INITIALISATION
// -------------------------------
async function initializePage() {
    try {
        // Vérifier l'authentification
        const currentUser = getCurrentUserFromStorage();

        if (!currentUser) {
            console.warn("⚠️ PAS D'UTILISATEUR AUTHENTIFIÉ - Redirection vers login");
            showToast("Vous devez être connecté", "error");
            window.location.href = 'login.html';
            return;
        }

        await loadUsersById();

        // Charger les tâches
        const tasksResponse = await apiListTasks();

        if (!Array.isArray(tasksResponse)) {
            console.warn("[WARN] apiListTasks() n'a pas retourné un tableau");
            tasks = [];
            allTasks = [];
        } else {
            // Transformer les données
            tasks = tasksResponse.map(apiTask => transformTaskFromAPI(apiTask));
            allTasks = [...tasks];
            currentFilteredTasks = [...allTasks];
            currentTaskPage = 1;
        }

        // Afficher les tâches
        renderTasksFromCurrentFilter();

        const urlParams = new URLSearchParams(window.location.search);
        const taskIdFromNotif = parseInt(urlParams.get('task'));
        const searchFromNotif = urlParams.get('search');

        if (taskIdFromNotif) {
            const targetTask = allTasks.find(t => t.id === taskIdFromNotif);
            if (targetTask) {
                const taskRow = document.querySelector(`[data-task-id="${taskIdFromNotif}"]`);
                if (taskRow) {
                    taskRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    taskRow.classList.add('task-highlight');
                }
                openModal(taskIdFromNotif);
            }
        } else if (searchFromNotif) {
            // Pré-remplir la barre de recherche et filtrer
            if (searchInput) {
                searchInput.value = searchFromNotif;
                applyFilters();
                // Highlight la première tâche correspondante
                setTimeout(() => {
                    const firstRow = document.querySelector('#taskTableBody tr');
                    if (firstRow) firstRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            }
        }

    } catch (error) {
        console.error("❌ Erreur lors de l'initialisation:", error);
        console.error("Stack:", error.stack);
        showToast("⚠️ Erreur de chargement des tâches: " + error.message, "error");
    }
}

// Lancer l'initialisation au chargement
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePage);
} else {
    initializePage();
}
