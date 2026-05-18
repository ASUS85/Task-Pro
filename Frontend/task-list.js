// ===============================
// TASKPRO - TASK LIST JS (VERSION PRO)
// ===============================

// -------------------------------
// DONNÉES RÉELLES (depuis API)
// -------------------------------
let tasks = [];
let allTasks = []; // pour les filtres

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
// TRANSFORMER DONNÉES API → FRONTEND
// -------------------------------
/**
 * Transforme une tâche de l'API au format du frontend
 */
function transformTaskFromAPI(apiTask, responsibleUser = null) {
    // Déterminer le type de tâche (principale ou sous-tâche)
    const type = apiTask.id_parent ? "sous_tache" : "principale";
    
    // Mapper le statut API vers le format frontend
    const statusMap = {
        "non assigné": "en_attente",
        "assigné": "en_attente",
        "en cours": "en_cours",
        "non terminé": "en_attente",
        "terminé": "terminee"
    };
    
    const status = statusMap[apiTask.status] || "en_attente";
    
    // Récupérer le nom du responsable si disponible
    let assignedTo = "-";
    if (responsibleUser) {
        assignedTo = `${responsibleUser.prenom} ${responsibleUser.nom}`;
    }
    
    return {
        id: apiTask.id,
        name: apiTask.libelle,
        type: type,
        status: status,
        assignedTo: assignedTo,
        createdBy: "Admin", // TODO: récupérer du créateur réel si disponible
        createdAt: apiTask.dateCreation ? apiTask.dateCreation.split(' ')[0] : "-",
        deadline: apiTask.periode_realisation ? apiTask.periode_realisation.split(' ')[0] : "-",
        priority: "Moyenne", // TODO: ajouter priorité en BD
        description: apiTask.description || "Aucune description",
        parentTask: apiTask.id_parent || null
    };
}

// filters

// -------------------------------
// RENDER TABLE
// -------------------------------
function renderTasks(data) {
    console.log("[RENDER] Affichage de", data.length, "tâche(s)");
    
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
    const task = tasks.find(t => t.id === id) || allTasks.find(t => t.id === id);
    if (!task) {
        console.warn("[MODAL] Tâche non trouvée:", id);
        return;
    }

    console.log("[MODAL] Ouverture détails tâche:", task.name);

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
tableBody.addEventListener("click", async (e) => {
    const id = parseInt(e.target.dataset.id);

    if (e.target.classList.contains("delete-btn")) {
        e.stopPropagation();

        if (confirm("Supprimer cette tâche ?")) {
            try {
                console.log("[DELETE] Suppression de la tâche", id);
                const result = await apiDeleteTask(id);
                
                if (result.success) {
                    console.log("✅ Tâche supprimée avec succès");
                    // Supprimer du tableau local
                    tasks = tasks.filter(t => t.id !== id);
                    allTasks = allTasks.filter(t => t.id !== id);
                    applyFilters();
                    alert("Tâche supprimée avec succès");
                } else {
                    throw new Error(result.message || "Erreur lors de la suppression");
                }
            } catch (error) {
                console.error("Erreur suppression:", error);
                alert("Erreur: " + error.message);
            }
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

    renderTasks(filtered);
}

// EVENTS
searchInput.addEventListener("input", applyFilters);
statusFilter.addEventListener("change", applyFilters);
typeFilter.addEventListener("change", applyFilters);

// -------------------------------
// INITIALISATION
// -------------------------------
async function initializePage() {
  try {
    // Vérifier l'authentification
    const currentUser = getCurrentUserFromStorage();
    console.log("[AUTH] Utilisateur actuel:", currentUser);
    
    if (!currentUser) {
      console.warn("⚠️ PAS D'UTILISATEUR AUTHENTIFIÉ - Redirection vers login");
      alert("Vous devez être connecté");
      window.location.href = 'login.html';
      return;
    }
    
    console.log("[INIT] Démarrage du chargement des tâches pour", currentUser.prenom, currentUser.nom);
    console.log("[API] Appel GET /taches/list...");
    
    // Charger les tâches
    const tasksResponse = await apiListTasks();
    console.log("[API RESPONSE] Tâches reçues:", tasksResponse);
    
    if (!Array.isArray(tasksResponse)) {
      console.warn("[WARN] apiListTasks() n'a pas retourné un tableau");
      tasks = [];
      allTasks = [];
    } else {
      // Transformer les données
      tasks = tasksResponse.map(apiTask => transformTaskFromAPI(apiTask));
      allTasks = [...tasks];
      
      console.log("✅ Tâches transformées et chargées");
      console.log("📊 Nombre de tâches:", tasks.length);
    }
    
    // Afficher les tâches
    renderTasks(tasks);
    
    console.log("✅ TaskPRO Task List initialisé avec succès 🚀");
    
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation:", error);
    console.error("Stack:", error.stack);
    alert("⚠️ Erreur de chargement des tâches:\n" + error.message);
  }
}

// Lancer l'initialisation au chargement
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePage);
} else {
  initializePage();
}